import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  FormControlLabel,
  Switch,
  RadioGroup,
  Radio,
  FormLabel,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Tooltip,
  IconButton
} from '@mui/material';
import { Settings, Save, Cancel, Help } from '@mui/icons-material';
import { RestaurantConfig } from '../hooks/useRestaurantConfig';

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
    
    // Preguntas adicionales
    askReservationReason: false,
    askAllergies: false,
    askFoodType: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
        askReservationReason: config.askReservationReason || false,
        askAllergies: config.askAllergies || false,
        askFoodType: config.askFoodType || false
      });
    }
  }, [config]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar configuración del bot
    if (editConfig.maxDinersPerBot !== undefined && editConfig.maxDinersPerBot <= 0) {
      newErrors.maxDinersPerBot = 'El número máximo de comensales debe ser mayor a 0';
    }

    if (editConfig.reservationDuration !== undefined && editConfig.reservationDuration <= 0) {
      newErrors.reservationDuration = 'La duración de reserva debe ser mayor a 0';
    }

    // Validar configuración de depósitos
    if (editConfig.requiresDeposit) {
      if (!editConfig.depositAmount || editConfig.depositAmount <= 0) {
        newErrors.depositAmount = 'Debe especificar una cantidad válida para el depósito';
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
        maxDinersPerBot: editConfig.maxDinersPerBot,
        reservationDuration: editConfig.reservationDuration,
        timezone: editConfig.timezone,
        requiresDeposit: editConfig.requiresDeposit,
        depositType: editConfig.depositType,
        depositAmount: editConfig.depositAmount,
        askReservationReason: editConfig.askReservationReason,
        askAllergies: editConfig.askAllergies,
        askFoodType: editConfig.askFoodType
      };
      onUpdate(updatedConfig);
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
        askReservationReason: config.askReservationReason || false,
        askAllergies: config.askAllergies || false,
        askFoodType: config.askFoodType || false
      });
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
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings color="primary" />
          Configuración Avanzada
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ py: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configura aspectos avanzados de tu restaurante como límites del bot, depósitos y preguntas adicionales
          </Typography>

          {/* Configuración del Bot */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="h6">
                  Configuración del Bot de Reservas
                </Typography>
                <Tooltip title="Estos parámetros controlan cómo funciona el bot de atención automática">
                  <IconButton size="small">
                    <Help fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  label="Máximo de comensales por bot"
                  type="number"
                  value={editConfig.maxDinersPerBot || ''}
                  onChange={(e) => setEditConfig(prev => ({ 
                    ...prev, 
                    maxDinersPerBot: parseInt(e.target.value) || undefined 
                  }))}
                  error={Boolean(errors.maxDinersPerBot)}
                  helperText={errors.maxDinersPerBot || 'Número máximo de comensales que el bot puede gestionar por reserva'}
                  inputProps={{ min: 1 }}
                  sx={{ maxWidth: 300 }}
                />

                <TextField
                  fullWidth
                  label="Duración estimada por reserva (minutos)"
                  type="number"
                  value={editConfig.reservationDuration || ''}
                  onChange={(e) => setEditConfig(prev => ({ 
                    ...prev, 
                    reservationDuration: parseInt(e.target.value) || undefined 
                  }))}
                  error={Boolean(errors.reservationDuration)}
                  helperText={errors.reservationDuration || 'Tiempo estimado que ocupará cada mesa (ayuda a calcular disponibilidad)'}
                  inputProps={{ min: 15, step: 15 }}
                  sx={{ maxWidth: 300 }}
                />
                
                <TextField
                  select
                  fullWidth
                  label="Zona horaria del restaurante"
                  value={editConfig.timezone}
                  onChange={(e) => setEditConfig(prev => ({ 
                    ...prev, 
                    timezone: e.target.value 
                  }))}
                  helperText="Todas las reservas se mostrarán en esta zona horaria"
                  sx={{ maxWidth: 300 }}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="Europe/Madrid">Europa/Madrid (CET/CEST)</option>
                  <option value="Europe/London">Europa/Londres (GMT/BST)</option>
                  <option value="Europe/Paris">Europa/París (CET/CEST)</option>
                  <option value="Europe/Berlin">Europa/Berlín (CET/CEST)</option>
                  <option value="Europe/Rome">Europa/Roma (CET/CEST)</option>
                  <option value="America/New_York">América/Nueva York (EST/EDT)</option>
                  <option value="America/Los_Angeles">América/Los Ángeles (PST/PDT)</option>
                  <option value="America/Mexico_City">América/Ciudad de México (CST/CDT)</option>
                  <option value="America/Buenos_Aires">América/Buenos Aires (ART)</option>
                  <option value="Asia/Tokyo">Asia/Tokio (JST)</option>
                  <option value="Australia/Sydney">Australia/Sídney (AEST/AEDT)</option>
                </TextField>
              </Box>
            </CardContent>
          </Card>

          {/* Configuración de Depósitos */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Configuración de Paga y Señal
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editConfig.requiresDeposit}
                      onChange={(e) => setEditConfig(prev => ({ ...prev, requiresDeposit: e.target.checked }))}
                    />
                  }
                  label="¿Requiere paga y señal para confirmar reservas?"
                />

                {editConfig.requiresDeposit && (
                  <Box sx={{ ml: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl>
                      <FormLabel>Tipo de depósito</FormLabel>
                      <RadioGroup
                        value={editConfig.depositType}
                        onChange={(e) => setEditConfig(prev => ({ 
                          ...prev, 
                          depositType: e.target.value as 'FIXED_PER_RESERVATION' | 'PER_PERSON' 
                        }))}
                      >
                        <FormControlLabel
                          value="FIXED_PER_RESERVATION"
                          control={<Radio />}
                          label="Cantidad fija por reserva"
                        />
                        <FormControlLabel
                          value="PER_PERSON"
                          control={<Radio />}
                          label="Valor por persona"
                        />
                      </RadioGroup>
                    </FormControl>
                    
                    <TextField
                      fullWidth
                      label={`Cantidad (€) ${editConfig.depositType === 'PER_PERSON' ? 'por persona' : 'por reserva'}`}
                      type="number"
                      value={editConfig.depositAmount || ''}
                      onChange={(e) => setEditConfig(prev => ({ 
                        ...prev, 
                        depositAmount: parseFloat(e.target.value) || undefined 
                      }))}
                      error={Boolean(errors.depositAmount)}
                      helperText={errors.depositAmount}
                      inputProps={{ min: 0, step: 0.01 }}
                      sx={{ maxWidth: 300 }}
                    />
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Preguntas Adicionales */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Preguntas Adicionales para las Reservas
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editConfig.askReservationReason}
                      onChange={(e) => setEditConfig(prev => ({ ...prev, askReservationReason: e.target.checked }))}
                    />
                  }
                  label="¿Preguntar por el motivo de la reserva? (cumpleaños, aniversario, etc.)"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={editConfig.askAllergies}
                      onChange={(e) => setEditConfig(prev => ({ ...prev, askAllergies: e.target.checked }))}
                    />
                  }
                  label="¿Preguntar por alergias o intolerancias?"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={editConfig.askFoodType}
                      onChange={(e) => setEditConfig(prev => ({ ...prev, askFoodType: e.target.checked }))}
                    />
                  }
                  label="¿Preguntar por el tipo de comida? (menú, carta, degustación, etc.)"
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

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleCancel}
          startIcon={<Cancel />}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdvancedSettings;
