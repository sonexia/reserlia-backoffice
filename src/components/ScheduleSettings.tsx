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
  CircularProgress
} from '@mui/material';
import { Schedule, Save, Cancel } from '@mui/icons-material';
import SimplifiedScheduleConfig, { SimplifiedSchedule } from './SimplifiedScheduleConfig';
import CallRedirectionSettingsForm from './config/CallRedirectionSettingsForm';
import { validateSchedules, validateCallRedirection } from '../utils/restaurantConfigValidators';
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [callRedirectionPhone, setCallRedirectionPhone] = useState<string>('');
  const [enableCallRedirection, setEnableCallRedirection] = useState<boolean>(false);

  // Cargar configuración existente
  useEffect(() => {
    if (config) {
      if (config.reservationSchedule) {
        setReservationSchedule(config.reservationSchedule as SimplifiedSchedule);
      }
      if (config.callRedirectionSchedule) {
        const callSchedule = config.callRedirectionSchedule as SimplifiedSchedule;
        setCallRedirectionSchedule(callSchedule);
      }
      if (config.callRedirectionPhone) {
        setCallRedirectionPhone(config.callRedirectionPhone);
      }
      if (typeof config.enableCallRedirection === 'boolean') {
        setEnableCallRedirection(config.enableCallRedirection);
      }
    }
  }, [config]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar horarios de reservas (reutilizable)
    const schedErr = validateSchedules(reservationSchedule);
    if (schedErr) newErrors.reservationSchedule = 'Debe configurar horarios de reservas para al menos un día';

    // Validar redirección de llamadas (reutilizable)
    const callErrs = validateCallRedirection({
      enable: enableCallRedirection,
      phone: callRedirectionPhone,
      schedule: callRedirectionSchedule,
    });
    Object.assign(newErrors, callErrs);

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

          {/* Horarios de Redirección de Llamadas (Reutilizable) */}
          <Box>
            <CallRedirectionSettingsForm
              value={{
                enableCallRedirection,
                callRedirectionPhone,
                reservationSchedule,
                callRedirectionSchedule,
              }}
              onChange={(patch) => {
                if (patch.enableCallRedirection !== undefined) setEnableCallRedirection(!!patch.enableCallRedirection);
                if (patch.callRedirectionPhone !== undefined) setCallRedirectionPhone(patch.callRedirectionPhone);
                if (patch.callRedirectionSchedule) setCallRedirectionSchedule(patch.callRedirectionSchedule);
                if (patch.reservationSchedule) setReservationSchedule(patch.reservationSchedule);
              }}
              errors={errors}
              allowUseSameScheduleToggle={true}
            />
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
