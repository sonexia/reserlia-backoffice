import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Divider,
  FormControlLabel,
  Checkbox,
  CircularProgress
} from '@mui/material';
import TextField from '@mui/material/TextField';
import { Schedule, Save, Cancel } from '@mui/icons-material';
import SimplifiedScheduleConfig, { SimplifiedSchedule } from './SimplifiedScheduleConfig';
import { RestaurantConfig } from '../hooks/useRestaurantConfig';

interface ScheduleSettingsProps {
  config: RestaurantConfig | null;
  onUpdate: (config: Omit<RestaurantConfig, 'id'>) => void;
  loading?: boolean;
  open?: boolean;
  onClose?: () => void;
}

const ScheduleSettings: React.FC<ScheduleSettingsProps> = ({
  config,
  onUpdate,
  loading = false,
  open = false,
  onClose
}) => {
  const [reservationSchedule, setReservationSchedule] = useState<SimplifiedSchedule>({
    weekdays: { enabled: false, ranges: [] },
    saturday: { enabled: false, ranges: [] },
    sunday: { enabled: false, ranges: [] },
    enabledDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    }
  });

  const [callRedirectionSchedule, setCallRedirectionSchedule] = useState<SimplifiedSchedule>({
    weekdays: { enabled: false, ranges: [] },
    saturday: { enabled: false, ranges: [] },
    sunday: { enabled: false, ranges: [] },
    enabledDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    }
  });

  const [useSameSchedule, setUseSameSchedule] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [callRedirectionPhone, setCallRedirectionPhone] = useState<string>('');
  const [enableCallRedirection, setEnableCallRedirection] = useState<boolean>(false);

  // Helper function to check if two schedules are the same
  const schedulesAreEqual = (schedule1: SimplifiedSchedule, schedule2: SimplifiedSchedule): boolean => {
    return JSON.stringify(schedule1) === JSON.stringify(schedule2);
  };

  // Cargar configuración existente
  useEffect(() => {
    if (config) {
      if (config.reservationSchedule) {
        setReservationSchedule(config.reservationSchedule as SimplifiedSchedule);
      }
      if (config.callRedirectionSchedule) {
        const callSchedule = config.callRedirectionSchedule as SimplifiedSchedule;
        setCallRedirectionSchedule(callSchedule);
        
        // Check if schedules are the same to determine initial state
        if (config.reservationSchedule && schedulesAreEqual(config.reservationSchedule as SimplifiedSchedule, callSchedule)) {
          setUseSameSchedule(true);
        }
      }
      if (config.callRedirectionPhone) {
        setCallRedirectionPhone(config.callRedirectionPhone);
      }
      if (typeof config.enableCallRedirection === 'boolean') {
        setEnableCallRedirection(config.enableCallRedirection);
      }
    }
  }, [config]);

  // Sync call redirection schedule when reservation schedule changes and useSameSchedule is true
  useEffect(() => {
    if (useSameSchedule) {
      setCallRedirectionSchedule(reservationSchedule);
    }
  }, [reservationSchedule, useSameSchedule]);

  // Handle toggle of "use same schedule"
  const handleUseSameScheduleChange = (checked: boolean) => {
    setUseSameSchedule(checked);
    if (checked) {
      // Copy reservation schedule to call redirection schedule
      setCallRedirectionSchedule(reservationSchedule);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar horarios de reservas
    const hasReservationSchedule = (
      (reservationSchedule.weekdays.enabled && reservationSchedule.weekdays.ranges.length > 0 && 
       (reservationSchedule.enabledDays.monday || reservationSchedule.enabledDays.tuesday || 
        reservationSchedule.enabledDays.wednesday || reservationSchedule.enabledDays.thursday || 
        reservationSchedule.enabledDays.friday)) ||
      (reservationSchedule.saturday.enabled && reservationSchedule.saturday.ranges.length > 0 && 
       reservationSchedule.enabledDays.saturday) ||
      (reservationSchedule.sunday.enabled && reservationSchedule.sunday.ranges.length > 0 && 
       reservationSchedule.enabledDays.sunday)
    );
    if (!hasReservationSchedule) {
      newErrors.reservationSchedule = 'Debe configurar horarios de reservas para al menos un día';
    }

    // Validar horarios de redirección de llamadas
    const hasCallSchedule = (
      (callRedirectionSchedule.weekdays.enabled && callRedirectionSchedule.weekdays.ranges.length > 0 && 
       (callRedirectionSchedule.enabledDays.monday || callRedirectionSchedule.enabledDays.tuesday || 
        callRedirectionSchedule.enabledDays.wednesday || callRedirectionSchedule.enabledDays.thursday || 
        callRedirectionSchedule.enabledDays.friday)) ||
      (callRedirectionSchedule.saturday.enabled && callRedirectionSchedule.saturday.ranges.length > 0 && 
       callRedirectionSchedule.enabledDays.saturday) ||
      (callRedirectionSchedule.sunday.enabled && callRedirectionSchedule.sunday.ranges.length > 0 && 
       callRedirectionSchedule.enabledDays.sunday)
    );
    if (!hasCallSchedule) {
      newErrors.callRedirectionSchedule = 'Debe configurar horarios de redirección para al menos un día';
    }

    // Validaciones sólo aplican si la redirección está activada
    if (enableCallRedirection) {
      if (!hasCallSchedule) {
        newErrors.callRedirectionSchedule = 'Debe configurar horarios de redirección para al menos un día';
      }
      // Validar número con regex simple
      const phone = (callRedirectionPhone || '').trim();
      const simplePhoneRegex = /^[+]?[- 0-9()]{7,}$/; // validación sencilla
      if (!phone || !simplePhoneRegex.test(phone)) {
        newErrors.callRedirectionPhone = 'Introduzca un teléfono válido (validación simple)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate() && config) {
      // Crear configuración actualizada manteniendo todos los campos existentes
      const updatedConfig: Omit<RestaurantConfig, 'id'> = {
        ...config,
        reservationSchedule,
        callRedirectionSchedule,
        // Campo añadido para persistir el teléfono de redirección
        ...(callRedirectionPhone !== undefined ? { callRedirectionPhone } : {}),
        enableCallRedirection,
      };
      onUpdate(updatedConfig);
      onClose?.(); // Close the popup after saving
    }
  };

  const handleCancel = () => {
    // Resetear a los valores originales
    if (config) {
      if (config.reservationSchedule) {
        setReservationSchedule(config.reservationSchedule as SimplifiedSchedule);
      }
      if (config.callRedirectionSchedule) {
        setCallRedirectionSchedule(config.callRedirectionSchedule as SimplifiedSchedule);
      }
    }
    setErrors({});
    if (onClose) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={false}
      PaperProps={{
        sx: { 
          borderRadius: { xs: 0, sm: 2 },
          margin: { xs: 1, sm: 2 },
          width: { xs: 'calc(100% - 16px)', sm: 'auto' },
          // ALTURA REDUCIDA PARA NO CORTARSE EN IPHONE
          maxHeight: { xs: '85vh', sm: '85vh', md: '85vh' }
        }
      }}
    >
      <DialogTitle sx={{ pb: { xs: 1, sm: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Schedule color="primary" />
          <Box sx={{ 
            fontSize: { xs: '1.1rem', sm: '1.25rem' },
            fontWeight: 600 
          }}>
            Configuración de Horarios
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 2 } }}>
        <Box sx={{ py: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 2, sm: 3 } }}>
            Configura los horarios de tu restaurante para reservas y redirección de llamadas
          </Typography>

          {/* Horarios de Reservas */}
          <Box sx={{ mb: 4 }}>
            <SimplifiedScheduleConfig
              title="Horarios de Reservas"
              description="Configura cuándo los clientes pueden hacer reservas en tu restaurante"
              schedule={reservationSchedule}
              onChange={setReservationSchedule}
              error={errors.reservationSchedule}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Horarios de Redirección de Llamadas */}
          <Box>
            {/* Paso 1: ¿Redirigir algunas llamadas o siempre bot? */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Atención de llamadas</Typography>
              <FormControlLabel
                control={<Checkbox checked={!enableCallRedirection} onChange={(e) => setEnableCallRedirection(!e.target.checked)} />}
                label="Siempre las atiende el bot"
              />
              <FormControlLabel
                control={<Checkbox checked={enableCallRedirection} onChange={(e) => setEnableCallRedirection(e.target.checked)} />}
                label="Quiero redirigir algunas llamadas"
              />
            </Box>

            {/* Checkbox para usar el mismo horario */}
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={useSameSchedule}
                    onChange={(e) => handleUseSameScheduleChange(e.target.checked)}
                    disabled={!enableCallRedirection}
                  />
                }
                label="Usar el mismo horario que las reservas"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                La mayoría de restaurantes tienen los mismos horarios para ambos
              </Typography>
            </Box>

            {/* Número de teléfono para redirección de llamadas */}
            <Box sx={{ mb: 2 }}>
              <TextField
                label="Número para redirigir llamadas"
                placeholder="Ej: +34 612 345 678"
                fullWidth
                value={callRedirectionPhone}
                onChange={(e) => setCallRedirectionPhone(e.target.value)}
                error={Boolean(errors.callRedirectionPhone)}
                helperText={errors.callRedirectionPhone || 'Se usará este número cuando toque redirigir llamadas'}
                disabled={!enableCallRedirection}
              />
            </Box>

            {enableCallRedirection && !useSameSchedule && (
              <SimplifiedScheduleConfig
                title="Horarios de Redirección de Llamadas"
                description="Configura cuándo las llamadas deben ser redirigidas al bot de atención"
                schedule={callRedirectionSchedule}
                onChange={setCallRedirectionSchedule}
                error={errors.callRedirectionSchedule}
                sx={{
                  borderRadius: { xs: 0, sm: 2 },
                  margin: { xs: 1, sm: 2 },
                  width: { xs: 'calc(100% - 16px)', sm: 'auto' },
                  maxHeight: { xs: '70vh', sm: '80vh', md: '85vh' }
                }}
              />
            )}
          </Box>

          {/* Errores generales */}
          {Object.keys(errors).length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Por favor, corrige los errores antes de guardar.
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        px: { xs: 2, sm: 3 }, 
        pb: { xs: 2, sm: 3 },
        pt: { xs: 1, sm: 2 },
        gap: { xs: 1.5, sm: 1 },
        flexDirection: 'row',
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Button
          onClick={handleCancel}
          startIcon={<Cancel />}
          disabled={loading}
          variant="outlined"
          sx={{ 
            width: { xs: '100%', sm: 'auto' },
            minWidth: { sm: 120 }
          }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          disabled={loading}
          sx={{ 
            width: { xs: '100%', sm: 'auto' },
            minWidth: { sm: 140 }
          }}
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScheduleSettings;
