import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  Switch,
  RadioGroup,
  Radio,
  FormLabel
} from '@mui/material';
import {
  Restaurant,
  TableBar,
  Save,
  Cancel,
  Settings
} from '@mui/icons-material';

// Importamos la interfaz de nuestro hook para mantener consistencia
import { RestaurantConfig } from '../hooks/useRestaurantConfig';

interface RestaurantSettingsProps {
  config: RestaurantConfig | null;
  onUpdate: (config: Omit<RestaurantConfig, 'id'>) => void;
  loading?: boolean;
  open?: boolean;
  onClose?: () => void;
}

const RestaurantSettings: React.FC<RestaurantSettingsProps> = ({
  config,
  onUpdate,
  loading = false,
  open = false,
  onClose
}) => {
  // Removed editing state - fields are always editable now
  // Usamos Omit<RestaurantConfig, 'id'> para omitir el id en el estado inicial
  const [editConfig, setEditConfig] = useState<Omit<RestaurantConfig, 'id'>>({
    salonTables: 0,
    salonCapacity: 0,
    highTables: 0,
    highTablesCapacity: 0,
    terraceTables: 0,
    terraceCapacity: 0,
    barSeats: 0,
    // Configuración avanzada
    requiresDeposit: false,
    depositType: 'FIXED_PER_RESERVATION',
    depositAmount: undefined,
    askReservationReason: false,
    askAllergies: false,
    askFoodType: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (config) {
      setEditConfig({
        ...config,
        highTables: config.highTables || 0,
        highTablesCapacity: config.highTablesCapacity || 0,
        terraceTables: config.terraceTables || 0,
        terraceCapacity: config.terraceCapacity || 0,
        barSeats: config.barSeats || 0,
        // Configuración avanzada
        requiresDeposit: config.requiresDeposit || false,
        depositType: config.depositType || 'FIXED_PER_RESERVATION',
        depositAmount: config.depositAmount || undefined,
        askReservationReason: config.askReservationReason || false,
        askAllergies: config.askAllergies || false,
        askFoodType: config.askFoodType || false,
      });
    }
  }, [config]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!editConfig.salonTables || editConfig.salonTables <= 0) {
      newErrors.salonTables = 'Debe tener al menos 1 mesa en el salón';
    }
    if (!editConfig.salonCapacity || editConfig.salonCapacity <= 0) {
      newErrors.salonCapacity = 'La capacidad del salón debe ser mayor a 0';
    }
    if (editConfig.salonCapacity && editConfig.salonTables && editConfig.salonCapacity < editConfig.salonTables) {
      newErrors.salonCapacity = 'La capacidad no puede ser menor al número de mesas';
    }

    if (editConfig.highTables && editConfig.highTables > 0) {
      if (!editConfig.highTablesCapacity || editConfig.highTablesCapacity <= 0) {
        newErrors.highTablesCapacity = 'Debe especificar la capacidad de las mesas altas';
      }
      if (editConfig.highTablesCapacity && editConfig.highTablesCapacity < editConfig.highTables) {
        newErrors.highTablesCapacity = 'La capacidad no puede ser menor al número de mesas altas';
      }
    }

    if (editConfig.terraceTables && editConfig.terraceTables > 0) {
      if (!editConfig.terraceCapacity || editConfig.terraceCapacity <= 0) {
        newErrors.terraceCapacity = 'Debe especificar la capacidad de la terraza';
      }
      if (editConfig.terraceCapacity && editConfig.terraceCapacity < editConfig.terraceTables) {
        newErrors.terraceCapacity = 'La capacidad no puede ser menor al número de mesas de terraza';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onUpdate(editConfig);
    }
  };

  const handleCancel = () => {
    if (config) {
      // Reestablecer el formulario al estado actual de la configuración
      // Usamos spread para extraer todos los campos excepto el id
      // El prefijo _ indica a ESLint que esta variable se ignora intencionalmente
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _, ...configWithoutId } = config;
      setEditConfig(configWithoutId);
    }
    setErrors({});
  };

  const updateConfig = (field: keyof RestaurantConfig, value: number) => {
    setEditConfig(prev => ({
      ...prev,
      [field]: value || 0
    }));
    // Limpiar errores del campo cuando se modifica
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const getTotalCapacity = () => {
    if (!config) return 0;
    return (config.salonCapacity || 0) + 
           (config.highTablesCapacity || 0) + 
           (config.terraceCapacity || 0) + 
           (config.barSeats || 0);
  };

  const getTotalTables = () => {
    if (!config) return 0;
    return (config.salonTables || 0) + 
           (config.highTables || 0) + 
           (config.terraceTables || 0);
  };

  const content = (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Settings color="primary" sx={{ mr: 1 }} />
        <Typography variant="h5" fontWeight="600">
          Configuración del Restaurante
        </Typography>
      </Box>

      {!config && !loading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No se encontró configuración del restaurante. Esto debería haberse configurado durante el primer inicio de sesión.
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {config && (
        <>
          {/* Resumen */}
          <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Restaurant sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" fontWeight="600">
                    {getTotalTables()}
                  </Typography>
                  <Typography color="text.secondary">
                    Total de mesas
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <TableBar sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4" fontWeight="600">
                    {getTotalCapacity()}
                  </Typography>
                  <Typography color="text.secondary">
                    Capacidad total
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Settings sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                  <Typography variant="h4" fontWeight="600">
                    {((config.salonTables || 0) > 0 ? 1 : 0) + 
                     ((config.highTables || 0) > 0 ? 1 : 0) + 
                     ((config.terraceTables || 0) > 0 ? 1 : 0) + 
                     ((config.barSeats || 0) > 0 ? 1 : 0)}
                  </Typography>
                  <Typography color="text.secondary">
                    Zonas configuradas
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>

          <Paper variant="outlined" sx={{ p: 3 }}>
            {/* Mesas de salón */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Restaurant color="primary" />
                <Typography variant="h6" fontWeight="600">
                  Salón Principal
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
                  <TextField
                    fullWidth
                    label="Número de mesas de salón"
                    type="number"
                    value={editConfig.salonTables}
                    onChange={(e) => updateConfig('salonTables', parseInt(e.target.value))}
                    error={!!errors.salonTables}
                    helperText={errors.salonTables}
                    inputProps={{ min: 1 }}
                    sx={{ maxWidth: 300 }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
                  <TextField
                    fullWidth
                    label="Capacidad total del salón (personas)"
                    type="number"
                    value={editConfig.salonCapacity}
                    onChange={(e) => updateConfig('salonCapacity', parseInt(e.target.value))}
                    error={!!errors.salonCapacity}
                    helperText={errors.salonCapacity}
                    inputProps={{ min: 1 }}
                    sx={{ maxWidth: 300 }}
                  />
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Mesas altas */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TableBar color="primary" />
                <Typography variant="h6" fontWeight="600">
                  Mesas Altas
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  (opcional)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
                  <TextField
                    fullWidth
                    label="Número de mesas altas"
                    type="number"
                    value={editConfig.highTables || 0}
                    onChange={(e) => updateConfig('highTables', parseInt(e.target.value))}
                    inputProps={{ min: 0 }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
                  <TextField
                    fullWidth
                    label="Capacidad de mesas altas"
                    type="number"
                    value={editConfig.highTablesCapacity || 0}
                    onChange={(e) => updateConfig('highTablesCapacity', parseInt(e.target.value))}
                    error={!!errors.highTablesCapacity}
                    helperText={errors.highTablesCapacity}
                    inputProps={{ min: 0 }}
                  />
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Terraza */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Restaurant color="primary" />
                <Typography variant="h6" fontWeight="600">
                  Terraza
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  (opcional)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
                  <TextField
                    fullWidth
                    label="Número de mesas de terraza"
                    type="number"
                    value={editConfig.terraceTables || 0}
                    onChange={(e) => updateConfig('terraceTables', parseInt(e.target.value))}
                    inputProps={{ min: 0 }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
                  <TextField
                    fullWidth
                    label="Capacidad de terraza"
                    type="number"
                    value={editConfig.terraceCapacity || 0}
                    onChange={(e) => updateConfig('terraceCapacity', parseInt(e.target.value))}
                    error={!!errors.terraceCapacity}
                    helperText={errors.terraceCapacity}
                    inputProps={{ min: 0 }}
                  />
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Barra */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TableBar color="primary" />
                <Typography variant="h6" fontWeight="600">
                  Barra
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  (opcional)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
                  <TextField
                    fullWidth
                    label="Plazas en la barra"
                    type="number"
                    value={editConfig.barSeats || 0}
                    onChange={(e) => updateConfig('barSeats', parseInt(e.target.value))}
                    inputProps={{ min: 0 }}
                  />
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Configuración Avanzada */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Settings color="primary" />
                <Typography variant="h6" fontWeight="600">
                  Configuración Avanzada
                </Typography>
              </Box>

              {/* Paga y señal */}
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(editConfig.requiresDeposit)}
                      onChange={(e) => setEditConfig(prev => ({ ...prev, requiresDeposit: e.target.checked }))}
                    />
                  }
                  label="¿Requiere paga y señal?"
                  sx={{ mb: 2 }}
                />
                
                {Boolean(editConfig.requiresDeposit) && (
                  <Box sx={{ ml: 2 }}>
                    <FormControl component="fieldset" sx={{ mb: 2 }}>
                      <FormLabel component="legend">Tipo de paga y señal:</FormLabel>
                      <RadioGroup
                        value={editConfig.depositType || 'FIXED_PER_RESERVATION'}
                        onChange={(e) => setEditConfig(prev => ({ ...prev, depositType: e.target.value as 'FIXED_PER_RESERVATION' | 'PER_PERSON' }))}
                        row
                      >
                        <FormControlLabel
                          value="FIXED_PER_RESERVATION"
                          control={<Radio />}
                          label="Valor fijo por reserva"
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
                      label={`Cantidad (€) ${(editConfig.depositType || 'FIXED_PER_RESERVATION') === 'PER_PERSON' ? 'por persona' : 'por reserva'}`}
                      type="number"
                      value={editConfig.depositAmount || ''}
                      onChange={(e) => setEditConfig(prev => ({ ...prev, depositAmount: parseFloat(e.target.value) || undefined }))}
                      inputProps={{ min: 0, step: 0.01 }}
                      sx={{ maxWidth: 300 }}
                    />
                  </Box>
                )}
              </Box>

              {/* Preguntas adicionales */}
              <Box>
                <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
                  Preguntas adicionales para las reservas:
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(editConfig.askReservationReason)}
                        onChange={(e) => setEditConfig(prev => ({ ...prev, askReservationReason: e.target.checked }))}
                      />
                    }
                    label="¿Preguntar por el motivo de la reserva? (cumpleaños, aniversario, etc.)"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(editConfig.askAllergies)}
                        onChange={(e) => setEditConfig(prev => ({ ...prev, askAllergies: e.target.checked }))}
                      />
                    }
                    label="¿Preguntar por alergias o intolerancias?"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(editConfig.askFoodType)}
                        onChange={(e) => setEditConfig(prev => ({ ...prev, askFoodType: e.target.checked }))}
                      />
                    }
                    label="¿Preguntar por el tipo de comida? (menú, carta, degustación, etc.)"
                  />
                </Box>
              </Box>
            </Box>

            {/* Always show save/cancel buttons - removed editing condition */}
              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
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
                  {loading ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </Box>
          </Paper>
        </>
      )}
    </Box>
  );

  // Always render as dialog, never as inline content
  return (
    <Dialog
      open={open || false}
      onClose={onClose || (() => {})}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings color="primary" />
          Configuración del Restaurante
        </Box>
      </DialogTitle>
      <DialogContent>
        {content}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default RestaurantSettings;
