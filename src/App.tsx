import { useAuthenticator } from '@aws-amplify/ui-react';
import { useEffect, useState } from "react";
import ReservationFormModal from "./components/ReservationFormModal";
import ReservationList from "./components/ReservationList";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { toast } from 'react-toastify';

const client = generateClient<Schema>();

function App() {
  const { signOut } = useAuthenticator();
  const [reservations, setReservations] = useState<Array<Schema["Reservation"]["type"]>>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Schema["Reservation"]["type"] | null>(null);

  useEffect(() => {
    client.models.Reservation.observeQuery().subscribe({
      next: (data) => setReservations([...data.items]),
    });
  }, []);

  async function handleSave(input: Partial<Schema["Reservation"]["type"]>) {
    try {
      if (editingReservation) {
        await client.models.Reservation.update({ ...editingReservation, ...input });
        toast.success('Reserva actualizada correctamente');
      } else {
        await client.models.Reservation.create(input as Omit<Schema["Reservation"]["type"], "id">);
        toast.success('Reserva creada correctamente');
      }
      setModalOpen(false);
      setEditingReservation(null);
    } catch (err) {
      console.error('Error al guardar reserva:', err);
      toast.error('Error al guardar la reserva. Por favor intenta de nuevo.');
      // No cerramos el modal para que el usuario pueda corregir los datos
    }
  }

  function handleEdit(r: Schema["Reservation"]["type"]) {
    setEditingReservation(r);
    setModalOpen(true);
  }

  async function handleDelete(r: Schema["Reservation"]["type"]) {
    if (window.confirm("¿Eliminar esta reserva?")) {
      try {
        await client.models.Reservation.delete(r);
        toast.success('Reserva eliminada correctamente');
      } catch (err) {
        console.error('Error al eliminar reserva:', err);
        toast.error('Error al eliminar la reserva');
      }
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Reserlia - Gestión de Reservas</h1>
      </header>
      
      <button onClick={() => setModalOpen(true)}>+ Nueva reserva</button>
      <ReservationList
        reservations={reservations}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ReservationFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingReservation(null);
        }}
        reservation={editingReservation}
        onSave={handleSave}
      />

    <button onClick={() => signOut()}>Cerrar sesión</button>
    </div>
    
  );
}

export default App;
