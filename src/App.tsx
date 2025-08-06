import { useAuthenticator } from '@aws-amplify/ui-react';
import { useEffect, useState } from "react";
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, AppBar, Toolbar, Box, Button, Container, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Settings, MoreVert } from '@mui/icons-material';
import ReservationFormModal from "./components/ReservationFormModal";
import ReservationTable from "./components/ReservationTable";
import RestaurantSetup from "./components/RestaurantSetup";
import RestaurantSettings from "./components/RestaurantSettings";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useRestaurantConfig } from "./hooks/useRestaurantConfig";
import { toast } from 'react-toastify';
import logoReserlia from './assets/logo-reserlia.png';
import { reserliaTheme } from './theme/reserliaTheme';
import './App.css';

const client = generateClient<Schema>();

function App() {
  const { signOut } = useAuthenticator();
  const [reservations, setReservations] = useState<Array<Schema["Reservation"]["type"]>>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Schema["Reservation"]["type"] | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Restaurant configuration hook
  const { config, saving: configSaving, saveConfig, isFirstTimeSetup } = useRestaurantConfig();

  useEffect(() => {
    client.models.Reservation.observeQuery().subscribe({
      next: (data) => setReservations([...data.items]),
    });
  }, []);

  async function handleSave(input: Partial<Schema["Reservation"]["type"]>) {
    try {
      if (editingReservation) {
        // Solo enviamos los campos que se pueden actualizar, no metadatos del sistema
        const updateData = {
          id: editingReservation.id,
          datetime: input.datetime,
          customerName: input.customerName,
          partySize: input.partySize,
          tableNumber: input.tableNumber,
          notes: input.notes,
        };
        await client.models.Reservation.update(updateData);
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

  // Restaurant configuration handlers
  const handleFirstTimeSetup = async (configData: Omit<Schema["RestaurantConfig"]["type"], 'id'>) => {
    const success = await saveConfig(configData);
    return success;
  };

  const handleConfigUpdate = async (configData: Omit<Schema["RestaurantConfig"]["type"], 'id'>) => {
    await saveConfig(configData);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleSettingsClick = () => {
    setSettingsOpen(true);
    handleMenuClose();
  };

  // Show first-time setup if no config exists
  if (isFirstTimeSetup()) {
    return (
      <ThemeProvider theme={reserliaTheme}>
        <CssBaseline />
        <RestaurantSetup 
          onComplete={handleFirstTimeSetup}
          loading={configSaving}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={reserliaTheme}>
      <CssBaseline />
      <Box sx={{ 
        flexGrow: 1, 
        minHeight: '100vh', 
        bgcolor: 'white'
      }}>
        {/* Header con logo de Reserlia */}
        <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e5e7eb' }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <img 
                src={logoReserlia} 
                alt="Reserlia" 
                style={{ height: 40, width: 'auto' }}
              />
              <Box>
                <Box sx={{ fontSize: '1.25rem', fontWeight: 600, color: 'text.primary' }}>
                  Reserlia
                </Box>
                <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                  Gestión de Reservas
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                onClick={handleMenuOpen}
                sx={{ 
                  color: 'text.primary',
                  '&:hover': {
                    bgcolor: 'rgba(0, 201, 167, 0.1)'
                  }
                }}
              >
                <MoreVert />
              </IconButton>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                className="reserlia-menu"
              >
                <MenuItem onClick={handleSettingsClick}>
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Configuración del Restaurante</ListItemText>
                </MenuItem>
              </Menu>
              <Button 
                variant="outlined" 
                onClick={() => signOut()}
                sx={{ 
                  color: 'text.primary', 
                  borderColor: '#e5e7eb',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'rgba(0, 201, 167, 0.1)'
                  }
                }}
              >
                Cerrar sesión
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Contenido principal */}
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Box sx={{ fontSize: '1.5rem', fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                Reservas
              </Box>
              <Box sx={{ color: 'text.secondary' }}>
                Gestiona todas las reservas de tu restaurante
              </Box>
            </Box>
            <Button 
              variant="contained" 
              onClick={() => setModalOpen(true)}
              sx={{ borderRadius: 2, px: 3 }}
            >
              + Nueva reserva
            </Button>
          </Box>

          <ReservationTable
            reservations={reservations}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </Container>

        <ReservationFormModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingReservation(null);
          }}
          reservation={editingReservation}
          onSave={handleSave}
        />

        {/* Restaurant Settings Dialog */}
        <RestaurantSettings
          config={config}
          onUpdate={handleConfigUpdate}
          loading={configSaving}
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
