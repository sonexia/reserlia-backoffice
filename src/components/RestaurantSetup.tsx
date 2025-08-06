import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  CircularProgress,
  Stack
} from '@mui/material';
import { Restaurant, TableBar } from '@mui/icons-material';

// Importamos la interfaz RestaurantConfig del hook para mantener consistencia
import { RestaurantConfig } from '../hooks/useRestaurantConfig';

interface RestaurantSetupProps {
  onComplete: (config: Omit<RestaurantConfig, 'id'>) => void;
  loading?: boolean;
}

const RestaurantSetup: React.FC<RestaurantSetupProps> = ({ onComplete, loading = false }) => {
  const [activeStep, setActiveStep] = useState(0);
  // Mantenemos los valores del formulario como strings para permitir campos vacíos durante la edición
  const [inputValues, setInputValues] = useState({
    salonTables: '0',
    salonCapacity: '0',
    highTables: '0',
    highTablesCapacity: '0',
    terraceTables: '0',
    terraceCapacity: '0',
    barSeats: '0',
  });

  // Estado real del config con valores numéricos
  const [config, setConfig] = useState<Omit<RestaurantConfig, 'id'>>({
    salonTables: 0,
    salonCapacity: 0,
    highTables: 0,
    highTablesCapacity: 0,
    terraceTables: 0,
    terraceCapacity: 0,
    barSeats: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Mesas de salón
        if (!config.salonTables || config.salonTables <= 0) {
          newErrors.salonTables = 'Debe tener al menos 1 mesa en el salón';
        }
        if (!config.salonCapacity || config.salonCapacity <= 0) {
          newErrors.salonCapacity = 'La capacidad del salón debe ser mayor a 0';
        }
        if (config.salonCapacity && config.salonTables && config.salonCapacity < config.salonTables) {
          newErrors.salonCapacity = 'La capacidad no puede ser menor al número de mesas';
        }
        break;
      case 1: // Mesas altas (opcional)
        if (config.highTables && config.highTables > 0) {
          if (!config.highTablesCapacity || config.highTablesCapacity <= 0) {
            newErrors.highTablesCapacity = 'Debe especificar la capacidad de las mesas altas';
          }
          if (config.highTablesCapacity && config.highTablesCapacity < config.highTables) {
            newErrors.highTablesCapacity = 'La capacidad no puede ser menor al número de mesas altas';
          }
        }
        break;
      case 2: // Terraza (opcional)
        if (config.terraceTables && config.terraceTables > 0) {
          if (!config.terraceCapacity || config.terraceCapacity <= 0) {
            newErrors.terraceCapacity = 'Debe especificar la capacidad de la terraza';
          }
          if (config.terraceCapacity && config.terraceCapacity < config.terraceTables) {
            newErrors.terraceCapacity = 'La capacidad no puede ser menor al número de mesas de terraza';
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleComplete = () => {
    if (validateStep(activeStep)) {
      onComplete(config);
    }
  };

  // Función para actualizar solo el valor del input (como string)
  const handleInputChange = (field: keyof typeof inputValues, value: string) => {
    // Permitimos que el campo esté vacío durante la edición
    setInputValues(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Si el campo está vacío, usamos 0 para el config real, sino parseamos el valor
    const numValue = value.trim() === '' ? 0 : parseInt(value);
    setConfig(prev => ({
      ...prev,
      [field]: numValue
    }));
    
    // Limpiar errores del campo cuando se modifica
    if (errors[field as keyof RestaurantConfig]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof RestaurantConfig];
        return newErrors;
      });
    }
  };

  const steps = [
    {
      label: 'Mesas de salón',
      description: 'Configure las mesas principales de su restaurante',
      icon: <Restaurant />
    },
    {
      label: 'Mesas altas (opcional)',
      description: 'Configure las mesas altas si las tiene',
      icon: <TableBar />
    },
    {
      label: 'Terraza (opcional)',
      description: 'Configure su terraza si tiene una',
      icon: <Restaurant />
    },
    {
      label: 'Barra (opcional)',
      description: 'Configure la barra si tiene una',
      icon: <TableBar />
    }
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 1, sm: 2 },
        width: '100%'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, sm: 3 },
          maxWidth: 600,
          mx: 'auto',
          width: '100%',
          overflow: 'hidden'
        }}
      >
        <Typography variant="h4" align="center" sx={{ mb: 2, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          ¡Bienvenido a Reserlia!
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 3, px: { xs: 1, sm: 2 } }}>
          Para comenzar, necesitamos conocer la configuración de su restaurante.
          Esta información nos ayudará a gestionar mejor sus reservas.
        </Typography>

        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                optional={
                  index > 0 ? (
                    <Typography variant="caption">Opcional</Typography>
                  ) : null
                }
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {step.icon}
                  {step.label}
                </Box>
              </StepLabel>
              <StepContent sx={{ py: { xs: 1, sm: 1.5 } }}>
                <Typography sx={{ mb: { xs: 1, sm: 2 } }}>{step.description}</Typography>
                
                {index === 0 && (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
                    <Box sx={{ width: '100%' }}>
                      <TextField
                        fullWidth
                        label="Número de mesas de salón"
                        type="number"
                        value={inputValues.salonTables}
                        onChange={(e) => handleInputChange('salonTables', e.target.value)}
                        error={!!errors.salonTables}
                        helperText={errors.salonTables}
                        inputProps={{ min: 1 }}
                      />
                    </Box>
                    <Box sx={{ width: '100%' }}>
                      <TextField
                        fullWidth
                        label="Capacidad total del salón"
                        type="number"
                        value={inputValues.salonCapacity}
                        onChange={(e) => handleInputChange('salonCapacity', e.target.value)}
                        error={!!errors.salonCapacity}
                        helperText={errors.salonCapacity}
                        inputProps={{ min: 1 }}
                      />
                    </Box>
                  </Stack>
                )}

                {index === 1 && (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
                    <Box sx={{ width: '100%' }}>
                      <TextField
                        fullWidth
                        label="Número de mesas altas"
                        type="number"
                        value={inputValues.highTables}
                        onChange={(e) => handleInputChange('highTables', e.target.value)}
                        helperText="Deje en 0 si no tiene mesas altas"
                        inputProps={{ min: 0 }}
                      />
                    </Box>
                    <Box sx={{ width: '100%' }}>
                      <TextField
                        fullWidth
                        label="Capacidad de mesas altas"
                        type="number"
                        value={inputValues.highTablesCapacity}
                        onChange={(e) => handleInputChange('highTablesCapacity', e.target.value)}
                        error={!!errors.highTablesCapacity}
                        helperText={errors.highTablesCapacity || "Total de personas en mesas altas"}
                        inputProps={{ min: 0 }}
                        disabled={!config.highTables || config.highTables === 0}
                      />
                    </Box>
                  </Stack>
                )}

                {index === 2 && (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
                    <Box sx={{ width: '100%' }}>
                      <TextField
                        fullWidth
                        label="Número de mesas de terraza"
                        type="number"
                        value={inputValues.terraceTables}
                        onChange={(e) => handleInputChange('terraceTables', e.target.value)}
                        helperText="Deje en 0 si no tiene terraza"
                        inputProps={{ min: 0 }}
                      />
                    </Box>
                    <Box sx={{ width: '100%' }}>
                      <TextField
                        fullWidth
                        label="Capacidad de terraza"
                        type="number"
                        value={inputValues.terraceCapacity}
                        onChange={(e) => handleInputChange('terraceCapacity', e.target.value)}
                        error={!!errors.terraceCapacity}
                        helperText={errors.terraceCapacity || "Total de personas en la terraza"}
                        inputProps={{ min: 0 }}
                        disabled={!config.terraceTables || config.terraceTables === 0}
                      />
                    </Box>
                  </Stack>
                )}

                {index === 3 && (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
                    <Box sx={{ width: '100%' }}>
                      <TextField
                        fullWidth
                        label="Plazas en la barra"
                        type="number"
                        value={inputValues.barSeats}
                        onChange={(e) => handleInputChange('barSeats', e.target.value)}
                        helperText="Deje en 0 si no tiene barra"
                        inputProps={{ min: 0 }}
                      />
                    </Box>
                  </Stack>
                )}

                <Box sx={{ mt: 0, mb: 0 }}>
                  <div style={{ marginTop: '8px' }}>
                    {index === steps.length - 1 ? (
                      <Button
                        variant="contained"
                        onClick={handleComplete}
                        disabled={loading}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        {loading ? (
                          <>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Guardando...
                          </>
                        ) : (
                          'Finalizar configuración'
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        Continuar
                      </Button>
                    )}
                    <Button
                      disabled={index === 0}
                      onClick={handleBack}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      Atrás
                    </Button>
                  </div>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {activeStep === steps.length && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success">
              ¡Configuración completada! Su restaurante está listo para gestionar reservas.
            </Alert>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default RestaurantSetup;
