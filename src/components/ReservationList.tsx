import type { Schema } from "../../amplify/data/resource";

export interface ReservationListProps {
  reservations: Array<Schema["Reservation"]["type"]>;
  onEdit: (reservation: Schema["Reservation"]["type"]) => void;
  onDelete: (reservation: Schema["Reservation"]["type"]) => void;
}

export default function ReservationList({ reservations, onEdit, onDelete }: ReservationListProps) {
  return (
    <table className="reservation-table">
      <thead>
        <tr>
          <th>Fecha y hora</th>
          <th>Cliente</th>
          <th>Nº Personas</th>
          <th>Mesa</th>
          <th>Observaciones</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {reservations.map((r) => (
          <tr key={r.id}>
            <td>{new Date(r.datetime).toLocaleString()}</td>
            <td>{r.customerName}</td>
            <td>{r.partySize}</td>
            <td>{r.tableNumber ?? "-"}</td>
            <td>{r.notes ?? "-"}</td>
            <td>
              <button onClick={() => onEdit(r)}>Editar</button>
              <button onClick={() => onDelete(r)}>Eliminar</button>
            </td>
          </tr>
        ))}
      </tbody>
      <style>{`
        .reservation-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }
        .reservation-table th,
        .reservation-table td {
          border: 1px solid #ddd;
          padding: 0.5rem;
          text-align: left;
        }
        .reservation-table th {
          background: #f5f5f5;
        }
        button {
          margin-right: 0.25rem;
        }
      `}</style>
    </table>
  );
}
