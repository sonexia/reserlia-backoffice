import { useAuthenticator } from '@aws-amplify/ui-react';
import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, AppBar, Toolbar, Box, Button, Container, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Chip } from '@mui/material';
import { MoreVert, Logout, CreditCard, Restaurant, Schedule, Tune, Call } from '@mui/icons-material';
import ReservationFormModal from "./components/ReservationFormModal";
import ReservationTable from "./components/ReservationTable";
import RestaurantSetup from "./components/RestaurantSetup";
import RestaurantSettings from "./components/RestaurantSettings";
import ScheduleSettings from "./components/ScheduleSettings";
import AdvancedSettings from "./components/AdvancedSettings";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useRestaurantConfig, RestaurantConfig } from "./hooks/useRestaurantConfig";
import { toast } from 'react-toastify';
import logoReserlia from './assets/logo-reserlia.png';
import { reserliaTheme } from './theme/reserliaTheme';
import './App.css';

const client = generateClient<Schema>();
const BILLING_ENDPOINT = (import.meta.env.VITE_CHECKOUT_ENDPOINT as string) || 'http://localhost:8787/createCheckout';

function App() {
  const { signOut } = useAuthenticator();
  const navigate = useNavigate();
  const location = useLocation();
  const [reservations, setReservations] = useState<Array<Schema["Reservation"]["type"]>>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Schema["Reservation"]["type"] | null>(null);
  const [basicSettingsOpen, setBasicSettingsOpen] = useState(false);
  const [scheduleSettingsOpen, setScheduleSettingsOpen] = useState(false);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Filter state for reservations
  type FilterType = 'all' | 'lunch' | 'dinner';
  const [reservationFilter, setReservationFilter] = useState<FilterType>('all');
  
  // Restaurant configuration hook
  const { config, saving: configSaving, saveConfig, isFirstTimeSetup } = useRestaurantConfig();

  useEffect(() => {
    client.models.Reservation.observeQuery().subscribe({
      next: (data) => setReservations([...data.items]),
    });
  }, []);

  // Gating: si la suscripción no está activa, forzar /payment (excepto cuando ya estamos en rutas de pago)
  useEffect(() => {
    // Si estamos en el flujo de primer setup, este componente devuelve el wizard y no llega aquí
    if (!config) return; // aún cargando o sin config
    const status = config.subscriptionStatus;
    const path = location.pathname;
    const isOnPaymentRoute = path.startsWith('/payment');
    if (status !== 'active' && !isOnPaymentRoute) {
      navigate('/payment');
    }
  }, [config, location.pathname, navigate]);

  async function handleSave(input: Partial<Schema["Reservation"]["type"]>) {
    try {
      if (editingReservation) {
        // Solo enviamos los campos que se pueden actualizar, no metadatos del sistema
        const updateData = {
          id: editingReservation.id,
          datetime: input.datetime,
          customerName: input.customerName,
          phoneNumber: input.phoneNumber,
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
  const handleFirstTimeSetup = async (configData: Omit<RestaurantConfig, 'id'>) => {
    const success = await saveConfig(configData);
    if (success) {
      // Redirigir a la pantalla de pago para crear la suscripción
      navigate('/payment');
    }
    return success;
  };

  const handleConfigUpdate = async (configData: Omit<RestaurantConfig, 'id'>) => {
    await saveConfig(configData);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleBasicSettingsClick = () => {
    setBasicSettingsOpen(true);
    handleMenuClose();
  };

  const handleScheduleSettingsClick = () => {
    setScheduleSettingsOpen(true);
    handleMenuClose();
  };

  const handleAdvancedSettingsClick = () => {
    setAdvancedSettingsOpen(true);
    handleMenuClose();
  };

  const handleLogoutClick = () => {
    signOut();
    handleMenuClose();
  };

  const handleOpenBillingPortal = async () => {
    try {
      handleMenuClose();
      const base = BILLING_ENDPOINT.replace(/\/$/, '');
      const res = await fetch(`${base}/portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnUrl: window.location.origin }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'No se pudo abrir el portal de facturación');
      }
      const data: { url?: string } = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error('Respuesta inesperada del backend');
    } catch (e) {
      console.error('Billing portal error', e);
      toast.error('No se pudo abrir el portal de facturación');
    }
  };

  // Filter reservations based on current filter
  const filteredReservations = useMemo(() => {
    if (reservationFilter === 'all') {
      return reservations;
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    const lunchCutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 18, 0, 0);

    return reservations.filter(reservation => {
      const reservationDate = new Date(reservation.datetime);
      
      // Check if reservation is today
      const isToday = reservationDate >= todayStart && reservationDate <= todayEnd;
      
      if (!isToday) {
        return false;
      }

      // Filter by lunch or dinner
      if (reservationFilter === 'lunch') {
        return reservationDate < lunchCutoff;
      } else if (reservationFilter === 'dinner') {
        return reservationDate >= lunchCutoff;
      }

      return false;
    });
  }, [reservations, reservationFilter]);

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
              {/* Restaurant name and assigned phone display */}
              {config?.businessName && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    px: 2,
                    py: 1,
                    bgcolor: 'rgba(0, 201, 167, 0.1)',
                    borderRadius: 2,
                    border: '1px solid rgba(0, 201, 167, 0.2)'
                  }}>
                    <Restaurant sx={{ fontSize: 20, color: 'primary.main' }} />
                    <Box sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.primary' }}>
                      {config.businessName}
                    </Box>
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    px: 2,
                    py: 1,
                    bgcolor: 'rgba(0,  0, 0, 0.04)',
                    borderRadius: 2,
                    border: '1px solid rgba(0,0,0,0.08)'
                  }}>
                    <Call sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      Número de teléfono de la centralita:
                    </Box>
                    <Box sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.primary' }}>
                      {config.assignedPhoneNumber || 'Número de teléfono no asignado aún'}
                    </Box>
                  </Box>
                </Box>
              )}
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
                <MenuItem onClick={handleOpenBillingPortal}>
                  <ListItemIcon>
                    <CreditCard fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Facturación</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleBasicSettingsClick}>
                  <ListItemIcon>
                    <Restaurant fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Configuración Básica</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleScheduleSettingsClick}>
                  <ListItemIcon>
                    <Schedule fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Horarios</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleAdvancedSettingsClick}>
                  <ListItemIcon>
                    <Tune fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Configuración Avanzada</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleLogoutClick}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Cerrar sesión</ListItemText>
                </MenuItem>
              </Menu>
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

          {/* Filter buttons */}
          <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.secondary', mr: 1 }}>
              Filtrar por:
            </Box>
            <Chip
              label="Todas las reservas"
              variant={reservationFilter === 'all' ? 'filled' : 'outlined'}
              color={reservationFilter === 'all' ? 'primary' : 'default'}
              onClick={() => setReservationFilter('all')}
              sx={{ cursor: 'pointer' }}
            />
            <Chip
              label="Comidas hoy"
              variant={reservationFilter === 'lunch' ? 'filled' : 'outlined'}
              color={reservationFilter === 'lunch' ? 'primary' : 'default'}
              onClick={() => setReservationFilter('lunch')}
              sx={{ cursor: 'pointer' }}
            />
            <Chip
              label="Cenas hoy"
              variant={reservationFilter === 'dinner' ? 'filled' : 'outlined'}
              color={reservationFilter === 'dinner' ? 'primary' : 'default'}
              onClick={() => setReservationFilter('dinner')}
              sx={{ cursor: 'pointer' }}
            />
            <Box sx={{ fontSize: '0.75rem', color: 'text.secondary', ml: 2 }}>
              {filteredReservations.length} {filteredReservations.length === 1 ? 'reserva' : 'reservas'}
            </Box>
          </Box>

          <ReservationTable
            reservations={filteredReservations}
            onEdit={handleEdit}
            onDelete={handleDelete}
            timezone={config?.timezone || undefined}
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

        {/* Restaurant Settings Dialogs */}
        <RestaurantSettings
          config={config}
          onUpdate={handleConfigUpdate}
          loading={configSaving}
          open={basicSettingsOpen}
          onClose={() => setBasicSettingsOpen(false)}
        />
        
        <ScheduleSettings
          config={config}
          onUpdate={handleConfigUpdate}
          loading={configSaving}
          open={scheduleSettingsOpen}
          onClose={() => setScheduleSettingsOpen(false)}
        />
        
        <AdvancedSettings
          config={config}
          onUpdate={handleConfigUpdate}
          loading={configSaving}
          open={advancedSettingsOpen}
          onClose={() => setAdvancedSettingsOpen(false)}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
