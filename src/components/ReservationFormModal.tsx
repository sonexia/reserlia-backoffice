import { useState, FormEvent, useEffect, useRef } from "react"; // useRef para controlar apertura
import type { Schema } from "../../amplify/data/resource";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export interface ReservationFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (input: Partial<Schema["Reservation"]["type"]>) => void;
  reservation?: Schema["Reservation"]["type"] | null;
}

export default function ReservationFormModal({
  open,
  onClose,
  onSave,
  reservation,
}: ReservationFormModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    reservation?.datetime ? new Date(reservation.datetime) : new Date()
  );

  const [customerName, setCustomerName] = useState(reservation?.customerName || "");
  const [partySize, setPartySize] = useState<number>(
    reservation?.partySize || 2
  );
  const [tableNumber, setTableNumber] = useState(reservation?.tableNumber || "");
  const [notes, setNotes] = useState(reservation?.notes || "");
  const [error, setError] = useState<string | null>(null);
  // Referencia para cerrar el DatePicker manualmente
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const datePickerRef = useRef<any>(null);


  // Initialize form when reservation changes
  useEffect(() => {
    if (reservation) {
      setSelectedDate(new Date(reservation.datetime));
      setCustomerName(reservation.customerName ?? "");
      setPartySize(reservation.partySize ?? 1);
      setTableNumber(reservation.tableNumber ?? "");
      setNotes(reservation.notes ?? "");
    } else {
      setSelectedDate(new Date());
      setCustomerName("");
      setPartySize(1);
      setTableNumber("");
      setNotes("");
    }
    setError(null);
  }, [reservation, open]);

  if (!open) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Basic validation
    if (!selectedDate || !customerName || !partySize) {
      setError("Por favor completa los campos obligatorios.");
      return;
    }
    
    try {
      // Convertir a formato ISO8601 completo (lo que espera AWS AppSync/DynamoDB)
      const isoDateTime = selectedDate.toISOString();
      onSave({ datetime: isoDateTime, customerName, partySize, tableNumber, notes });
    } catch (err) {
      console.error("Error al formatear la fecha:", err);
      setError("Formato de fecha incorrecto. Por favor verifica.");
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{reservation ? "Editar reserva" : "Nueva reserva"}</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div style={{ width: '100%', marginBottom: '20px' }}>
            <label htmlFor="reserva-datetime">Fecha y hora*</label>
            <DatePicker
              id="reserva-datetime"
              ref={datePickerRef}
              selected={selectedDate}
              onChange={(newDate: Date | null) => {
                if (!newDate) return;
                // Si ya teníamos una fecha del mismo día y la hora cambió, cerramos
                if (
                  selectedDate &&
                  selectedDate.getFullYear() === newDate.getFullYear() &&
                  selectedDate.getMonth() === newDate.getMonth() &&
                  selectedDate.getDate() === newDate.getDate() &&
                  (selectedDate.getHours() !== newDate.getHours() || selectedDate.getMinutes() !== newDate.getMinutes())
                ) {
                  datePickerRef.current?.setOpen(false);
                }
                setSelectedDate(newDate);
              }}
              shouldCloseOnSelect={false}
              showTimeSelect
              dateFormat="dd/MM/yyyy HH:mm"
              timeFormat="HH:mm"
              timeCaption="Hora"
              timeIntervals={15}
              required
              customInput={
                <input id="reserva-datetime" 
                  style={{ 
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                  }} 
                />
              }
            />
          </div>
          <label>
            Nombre del cliente*
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </label>
          <label>
            Número de personas*
            <input
              type="number"
              min={1}
              value={partySize}
              onChange={(e) => setPartySize(parseInt(e.target.value))}
              required
            />
          </label>
          <label>
            Mesa asignada
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
            />
          </label>
          <label>
            Observaciones
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <div className="modal-actions">
            <button type="submit">Guardar</button>
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal {
          background: #fff;
          padding: 1.5rem;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
        }
        .modal label {
          display: block;
          margin-bottom: 0.5rem;
        }
        .modal input,
        .modal textarea {
          width: 100%;
          padding: 0.4rem;
          margin-top: 0.25rem;
          margin-bottom: 1rem;
        }
        .modal-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
}
