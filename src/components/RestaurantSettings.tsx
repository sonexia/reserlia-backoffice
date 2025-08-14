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
  // Solo configuración básica: nombre del negocio, mesas, capacidades y zonas
  const [editConfig, setEditConfig] = useState({
    businessName: '',
    salonTables: 0,
    salonCapacity: 0,
    highTables: 0,
    highTablesCapacity: 0,
    terraceTables: 0,
    terraceCapacity: 0,
    barSeats: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (config) {
      setEditConfig({
        businessName: config.businessName || '',
        salonTables: config.salonTables,
        salonCapacity: config.salonCapacity,
        highTables: config.highTables || 0,
        highTablesCapacity: config.highTablesCapacity || 0,
        terraceTables: config.terraceTables || 0,
        terraceCapacity: config.terraceCapacity || 0,
        barSeats: config.barSeats || 0
      });
    }
  }, [config]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!editConfig.businessName || editConfig.businessName.trim() === '') {
      newErrors.businessName = 'El nombre del negocio es obligatorio';
    }

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
      // CRITICAL: Merge with existing config to preserve subscription and advanced settings
      const updatedConfig = {
        ...config, // Preserve ALL existing fields (subscription, advanced settings, etc.)
        ...editConfig // Override only the fields we're editing (basic settings + businessName)
      };
      onUpdate(updatedConfig);
      onClose?.(); // Close the popup after saving
    }
  };

  const handleCancel = () => {
    if (config) {
      // Resetear solo los campos básicos
      setEditConfig({
        businessName: config.businessName || '',
        salonTables: config.salonTables,
        salonCapacity: config.salonCapacity,
        highTables: config.highTables || 0,
        highTablesCapacity: config.highTablesCapacity || 0,
        terraceTables: config.terraceTables || 0,
        terraceCapacity: config.terraceCapacity || 0,
        barSeats: config.barSeats || 0
      });
    }
    setErrors({});
    onClose?.(); // Close the popup after canceling
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

          <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Nombre del negocio */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Settings color="primary" />
                <Typography variant="h6" fontWeight="600">
                  Información del Negocio
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 }, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 100%', minWidth: 0 }}>
                  <TextField
                    fullWidth
                    label="Nombre del negocio"
                    value={editConfig.businessName}
                    onChange={(e) => setEditConfig(prev => ({ ...prev, businessName: e.target.value }))}
                    error={!!errors.businessName}
                    helperText={errors.businessName}
                    required
                  />
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Mesas de salón */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Restaurant color="primary" />
                <Typography variant="h6" fontWeight="600">
                  Salón Principal
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                gap: { xs: 1.5, sm: 2 }, 
                flexWrap: 'wrap',
                flexDirection: { xs: 'column', sm: 'row' }
              }}>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 250px' }, minWidth: 0 }}>
                  <TextField
                    fullWidth
                    label="Número de mesas de salón"
                    type="number"
                    value={editConfig.salonTables}
                    onChange={(e) => updateConfig('salonTables', parseInt(e.target.value))}
                    error={!!errors.salonTables}
                    helperText={errors.salonTables}
                    inputProps={{ min: 1 }}
                  />
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 250px' }, minWidth: 0 }}>
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
              <Box sx={{ 
                display: 'flex', 
                gap: { xs: 1.5, sm: 2 }, 
                flexWrap: 'wrap',
                flexDirection: { xs: 'column', sm: 'row' }
              }}>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 250px' }, minWidth: 0 }}>
                  <TextField
                    fullWidth
                    label="Número de mesas altas"
                    type="number"
                    value={editConfig.highTables || 0}
                    onChange={(e) => updateConfig('highTables', parseInt(e.target.value))}
                    inputProps={{ min: 0 }}
                  />
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 250px' }, minWidth: 0 }}>
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
              <Box sx={{ 
                display: 'flex', 
                gap: { xs: 1.5, sm: 2 }, 
                flexWrap: 'wrap',
                flexDirection: { xs: 'column', sm: 'row' }
              }}>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 250px' }, minWidth: 0 }}>
                  <TextField
                    fullWidth
                    label="Número de mesas de terraza"
                    type="number"
                    value={editConfig.terraceTables || 0}
                    onChange={(e) => updateConfig('terraceTables', parseInt(e.target.value))}
                    inputProps={{ min: 0 }}
                  />
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 250px' }, minWidth: 0 }}>
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
              <Box sx={{ 
                display: 'flex', 
                gap: { xs: 1.5, sm: 2 }, 
                flexWrap: 'wrap',
                flexDirection: { xs: 'column', sm: 'row' }
              }}>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 250px' }, minWidth: 0 }}>
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
      fullScreen={false} // Prevent fullscreen on mobile for better UX
      PaperProps={{
        sx: { 
          borderRadius: { xs: 0, sm: 2 }, // No border radius on mobile
          margin: { xs: 1, sm: 2 }, // Reduced margin on mobile
          width: { xs: 'calc(100% - 16px)', sm: 'auto' }, // Full width with small margins on mobile
          maxHeight: { xs: 'calc(100vh - 32px)', sm: '90vh' } // Constrain height on mobile
        }
      }}
    >
      <DialogTitle sx={{ pb: { xs: 1, sm: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings color="primary" />
          <Box sx={{ 
            fontSize: { xs: '1.1rem', sm: '1.25rem' },
            fontWeight: 600 
          }}>
            Configuración del Restaurante
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 2 } }}>
        {content}
      </DialogContent>
      <DialogActions sx={{ 
        px: { xs: 2, sm: 3 }, 
        pb: { xs: 2, sm: 3 },
        pt: { xs: 1, sm: 2 },
        gap: { xs: 1.5, sm: 1 },
        flexDirection: { xs: 'column-reverse', sm: 'row' },
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
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RestaurantSettings;
