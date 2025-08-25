import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Alert,
  Card,
  CardContent,
  Tooltip,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Tune, Help, Save, Cancel } from '@mui/icons-material';
import { RestaurantConfig } from '../hooks/useRestaurantConfig';
import { DEFAULT_MIN_TIME_FOR_RESERVATIONS } from '../config/rest-config-defaults';
import BotSettingsForm from './config/BotSettingsForm';
import DepositSettingsForm from './config/DepositSettingsForm';
import ReservationMarginForm from './config/ReservationMarginForm';
import { validateBotSettings, validateDepositSettings, validateReservationMargin } from '../utils/restaurantConfigValidators';

interface AdvancedSettingsProps {
  config: RestaurantConfig | null;
  onUpdate: (config: Omit<RestaurantConfig, 'id'>) => void;
  loading?: boolean;
  open?: boolean;
  onClose?: () => void;
}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  config,
  onUpdate,
  loading = false,
  open = false,
  onClose
}) => {
  const [editConfig, setEditConfig] = useState({
    // Configuración del bot
    maxDinersPerBot: undefined as number | undefined,
    reservationDuration: undefined as number | undefined,
    timezone: 'Europe/Madrid' as string,
    
    // Configuración de depósitos
    requiresDeposit: false,
    depositType: 'FIXED_PER_RESERVATION' as 'FIXED_PER_RESERVATION' | 'PER_PERSON',
    depositAmount: undefined as number | undefined,
    
    // Configuración de margen de reserva
    enableReservationMargin: false,
    minTimeForReservations: undefined as number | undefined,
    actionDuringReservationGracePeriod: 'DISCARD' as 'DISCARD' | 'REDIRECT',
    
    // Preguntas adicionales
    askReservationReason: false,
    askAllergies: false,
    askFoodType: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  // Teléfono para redirección durante el período de gracia
  const [gracePeriodRedirectPhone, setGracePeriodRedirectPhone] = useState<string>('');

  // Cargar configuración existente
  useEffect(() => {
    if (config) {
      setEditConfig({
        maxDinersPerBot: config.maxDinersPerBot || undefined,
        reservationDuration: config.reservationDuration || undefined,
        timezone: config.timezone || 'Europe/Madrid',
        requiresDeposit: config.requiresDeposit || false,
        depositType: config.depositType || 'FIXED_PER_RESERVATION',
        depositAmount: config.depositAmount || undefined,
        enableReservationMargin: Boolean(config.minTimeForReservations),
        minTimeForReservations: config.minTimeForReservations ?? undefined,
        actionDuringReservationGracePeriod: config.actionDuringReservationGracePeriod || 'DISCARD',
        askReservationReason: config.askReservationReason || false,
        askAllergies: config.askAllergies || false,
        askFoodType: config.askFoodType || false
      });
      // Cargar teléfono de redirección del período de gracia
      setGracePeriodRedirectPhone((config as { gracePeriodRedirectPhone?: string | null }).gracePeriodRedirectPhone || '');
    }
  }, [config]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validaciones centralizadas
    Object.assign(newErrors, validateBotSettings({
      maxDinersPerBot: editConfig.maxDinersPerBot,
      reservationDuration: editConfig.reservationDuration,
    }));

    Object.assign(newErrors, validateDepositSettings({
      requiresDeposit: editConfig.requiresDeposit,
      depositAmount: editConfig.depositAmount,
    }));

    Object.assign(newErrors, validateReservationMargin({
      enabled: editConfig.enableReservationMargin,
      minTimeForReservations: editConfig.minTimeForReservations,
      action: editConfig.actionDuringReservationGracePeriod,
      gracePeriodRedirectPhone,
    }));

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate() && config) {
      // Crear configuración actualizada manteniendo todos los campos existentes
      const updatedConfig: Omit<RestaurantConfig, 'id'> = {
        ...config,
        maxDinersPerBot: editConfig.maxDinersPerBot,
        reservationDuration: editConfig.reservationDuration,
        timezone: editConfig.timezone,
        requiresDeposit: editConfig.requiresDeposit,
        depositType: editConfig.depositType,
        depositAmount: editConfig.depositAmount,
        // Margen de reserva
        minTimeForReservations: editConfig.enableReservationMargin
          ? (editConfig.minTimeForReservations ?? DEFAULT_MIN_TIME_FOR_RESERVATIONS)
          : undefined,
        actionDuringReservationGracePeriod: editConfig.enableReservationMargin ? editConfig.actionDuringReservationGracePeriod : undefined,
        // Guardar teléfono de redirección del período de gracia cuando aplica
        gracePeriodRedirectPhone: (editConfig.enableReservationMargin && editConfig.actionDuringReservationGracePeriod === 'REDIRECT')
          ? (gracePeriodRedirectPhone || undefined)
          : undefined,
        askReservationReason: editConfig.askReservationReason,
        askAllergies: editConfig.askAllergies,
        askFoodType: editConfig.askFoodType
      };
      onUpdate(updatedConfig);
      onClose?.(); // Close the popup after saving
    }
  };

  const handleCancel = () => {
    // Resetear a los valores originales
    if (config) {
      setEditConfig({
        maxDinersPerBot: config.maxDinersPerBot || undefined,
        reservationDuration: config.reservationDuration || undefined,
        timezone: config.timezone || 'Europe/Madrid',
        requiresDeposit: config.requiresDeposit || false,
        depositType: config.depositType || 'FIXED_PER_RESERVATION',
        depositAmount: config.depositAmount || undefined,
        enableReservationMargin: Boolean(config.minTimeForReservations),
        minTimeForReservations: config.minTimeForReservations ?? undefined,
        actionDuringReservationGracePeriod: config.actionDuringReservationGracePeriod || 'DISCARD',
        askReservationReason: config.askReservationReason || false,
        askAllergies: config.askAllergies || false,
        askFoodType: config.askFoodType || false
      });
      setGracePeriodRedirectPhone((config as { gracePeriodRedirectPhone?: string | null }).gracePeriodRedirectPhone || '');
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
          <Tune color="primary" />
          <Box sx={{ 
            fontSize: { xs: '1.1rem', sm: '1.25rem' },
            fontWeight: 600 
          }}>
            Configuración Avanzada
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 2 } }}>
        <Box sx={{ py: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 2, sm: 3 } }}>
            Configura opciones avanzadas para tu restaurante: límites del bot, depósitos y preguntas adicionales
          </Typography>

          {/* Configuración del Bot */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  Configuración del Bot de Reservas
                </Typography>
                <Tooltip title="Estos parámetros controlan cómo funciona el bot de atención automática">
                  <IconButton size="small">
                    <Help fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <BotSettingsForm
                value={{
                  maxDinersPerBot: editConfig.maxDinersPerBot,
                  reservationDuration: editConfig.reservationDuration,
                  timezone: editConfig.timezone,
                }}
                onChange={(patch) => setEditConfig(prev => ({ ...prev, ...patch }))}
                errors={errors}
              />
            </CardContent>
          </Card>

          {/* Configuración de Depósitos */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Configuración de Paga y Señal
              </Typography>
              <DepositSettingsForm
                value={{
                  requiresDeposit: editConfig.requiresDeposit,
                  depositType: editConfig.depositType,
                  depositAmount: editConfig.depositAmount,
                }}
                onChange={(patch) => setEditConfig(prev => ({ ...prev, ...patch }))}
                errors={errors}
              />
            </CardContent>
          </Card>

          {/* Configuración de Margen de Reserva */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  Margen de Reserva
                </Typography>
                <Tooltip title="Configure el tiempo mínimo de antelación para aceptar reservas y qué hacer cuando no se cumple">
                  <IconButton size="small">
                    <Help fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <ReservationMarginForm
                value={{
                  enabled: editConfig.enableReservationMargin,
                  minTimeForReservations: editConfig.minTimeForReservations,
                  actionDuringReservationGracePeriod: editConfig.actionDuringReservationGracePeriod,
                  gracePeriodRedirectPhone,
                }}
                onChange={(patch) => {
                  // Si el usuario cambia a REDIRECT y no hay teléfono local, pre-cargar con el general si existe
                  if (patch.actionDuringReservationGracePeriod === 'REDIRECT' && !gracePeriodRedirectPhone && (config?.callRedirectionPhone || '')) {
                    setGracePeriodRedirectPhone(config!.callRedirectionPhone!);
                  }
                  if (patch.gracePeriodRedirectPhone !== undefined) {
                    setGracePeriodRedirectPhone(patch.gracePeriodRedirectPhone);
                  }
                  if (patch.enabled !== undefined) {
                    setEditConfig(prev => ({ ...prev, enableReservationMargin: !!patch.enabled }));
                  }
                  setEditConfig(prev => ({ ...prev, 
                    minTimeForReservations: patch.minTimeForReservations ?? prev.minTimeForReservations,
                    actionDuringReservationGracePeriod: patch.actionDuringReservationGracePeriod ?? prev.actionDuringReservationGracePeriod,
                  }));
                }}
                errors={errors}
              />
            </CardContent>
          </Card>

          {/* Preguntas Adicionales */}
          <Card sx={{ mb: { xs: 2, sm: 3 } }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" sx={{ 
                mb: 2,
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}>
                Preguntas Adicionales para las Reservas
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 1 } }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editConfig.askReservationReason}
                      onChange={(e) => setEditConfig(prev => ({ ...prev, askReservationReason: e.target.checked }))}
                    />
                  }
                  label="¿Preguntar por el motivo de la reserva? (cumpleaños, aniversario, etc.)"
                  sx={{ 
                    alignItems: 'flex-start',
                    '& .MuiFormControlLabel-label': { 
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      lineHeight: 1.4,
                      mt: 0.25
                    }
                  }}
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={editConfig.askAllergies}
                      onChange={(e) => setEditConfig(prev => ({ ...prev, askAllergies: e.target.checked }))}
                    />
                  }
                  label="¿Preguntar por alergias o intolerancias?"
                  sx={{ 
                    alignItems: 'flex-start',
                    '& .MuiFormControlLabel-label': { 
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      lineHeight: 1.4,
                      mt: 0.25
                    }
                  }}
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={editConfig.askFoodType}
                      onChange={(e) => setEditConfig(prev => ({ ...prev, askFoodType: e.target.checked }))}
                    />
                  }
                  label="¿Preguntar por el tipo de comida? (menú, carta, degustación, etc.)"
                  sx={{ 
                    alignItems: 'flex-start',
                    '& .MuiFormControlLabel-label': { 
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      lineHeight: 1.4,
                      mt: 0.25
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>

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

export default AdvancedSettings;
