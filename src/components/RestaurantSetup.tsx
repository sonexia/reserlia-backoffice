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
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import { Restaurant, TableBar } from '@mui/icons-material';

interface RestaurantConfig {
  salonTables: number;
  salonCapacity: number;
  highTables?: number;
  highTablesCapacity?: number;
  terraceTables?: number;
  terraceCapacity?: number;
  barSeats?: number;
}

interface RestaurantSetupProps {
  onComplete: (config: RestaurantConfig) => void;
  loading?: boolean;
}

const RestaurantSetup: React.FC<RestaurantSetupProps> = ({ onComplete, loading = false }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [config, setConfig] = useState<RestaurantConfig>({
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

  const updateConfig = (field: keyof RestaurantConfig, value: number) => {
    setConfig(prev => ({
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
        bgcolor: 'grey.50',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 800,
          p: 4,
          borderRadius: 3
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Restaurant sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" fontWeight="600" gutterBottom>
            ¡Bienvenido a Reserlia!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Para comenzar, necesitamos conocer la configuración de su restaurante.
            Esta información nos ayudará a gestionar mejor sus reservas.
          </Typography>
        </Box>

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
              <StepContent>
                <Typography sx={{ mb: 2 }}>{step.description}</Typography>
                
                {index === 0 && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Número de mesas de salón"
                        type="number"
                        value={config.salonTables}
                        onChange={(e) => updateConfig('salonTables', parseInt(e.target.value))}
                        error={!!errors.salonTables}
                        helperText={errors.salonTables}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Capacidad total de salón"
                        type="number"
                        value={config.salonCapacity}
                        onChange={(e) => updateConfig('salonCapacity', parseInt(e.target.value))}
                        error={!!errors.salonCapacity}
                        helperText={errors.salonCapacity || "Total de personas que pueden sentarse en el salón"}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                  </Grid>
                )}

                {index === 1 && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Número de mesas altas"
                        type="number"
                        value={config.highTables}
                        onChange={(e) => updateConfig('highTables', parseInt(e.target.value))}
                        helperText="Deje en 0 si no tiene mesas altas"
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Capacidad de mesas altas"
                        type="number"
                        value={config.highTablesCapacity}
                        onChange={(e) => updateConfig('highTablesCapacity', parseInt(e.target.value))}
                        error={!!errors.highTablesCapacity}
                        helperText={errors.highTablesCapacity || "Total de personas en mesas altas"}
                        inputProps={{ min: 0 }}
                        disabled={!config.highTables || config.highTables === 0}
                      />
                    </Grid>
                  </Grid>
                )}

                {index === 2 && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Número de mesas de terraza"
                        type="number"
                        value={config.terraceTables}
                        onChange={(e) => updateConfig('terraceTables', parseInt(e.target.value))}
                        helperText="Deje en 0 si no tiene terraza"
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Capacidad de terraza"
                        type="number"
                        value={config.terraceCapacity}
                        onChange={(e) => updateConfig('terraceCapacity', parseInt(e.target.value))}
                        error={!!errors.terraceCapacity}
                        helperText={errors.terraceCapacity || "Total de personas en la terraza"}
                        inputProps={{ min: 0 }}
                        disabled={!config.terraceTables || config.terraceTables === 0}
                      />
                    </Grid>
                  </Grid>
                )}

                {index === 3 && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Plazas en la barra"
                        type="number"
                        value={config.barSeats}
                        onChange={(e) => updateConfig('barSeats', parseInt(e.target.value))}
                        helperText="Deje en 0 si no tiene barra"
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                  </Grid>
                )}

                <Box sx={{ mb: 2, mt: 3 }}>
                  <div>
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
