import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  TextField,
  Stack,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  
} from '@mui/material';
import { 
  Restaurant, 
  TableBar, 
  Settings, 
  Schedule, 
  Phone, 
  Group 
} from '@mui/icons-material';

// Importamos la interfaz RestaurantConfig del hook para mantener consistencia
import { RestaurantConfig } from '../hooks/useRestaurantConfig';
import SimplifiedScheduleConfig, { SimplifiedSchedule } from './SimplifiedScheduleConfig';
import BotSettingsForm from './config/BotSettingsForm';
import DepositSettingsForm from './config/DepositSettingsForm';
import ReservationMarginForm from './config/ReservationMarginForm';
import CallRedirectionSettingsForm from './config/CallRedirectionSettingsForm';
import { validateSchedules, validateBotSettings, validateDepositSettings, validateReservationMargin, validateCallRedirection } from '../utils/restaurantConfigValidators';
import { DEFAULT_MIN_TIME_FOR_RESERVATIONS } from '../config/rest-config-defaults';
import { detectAndMapTimezone } from '../utils/timezoneUtils';

// Nota: Los tipos para horarios simplificados ahora se importan desde SimplifiedScheduleConfig

interface RestaurantSetupProps {
  onComplete: (config: Omit<RestaurantConfig, 'id'>) => void;
  loading?: boolean;
}

const RestaurantSetup: React.FC<RestaurantSetupProps> = ({ onComplete, loading = false }) => {
  const [activeStep, setActiveStep] = useState(0);
  const { user } = useAuthenticator();
  
  // Helper function to create default simplified schedule
  const createDefaultSchedule = (): SimplifiedSchedule => ({
    weekdays: { enabled: true, ranges: [{ start: '09:00', end: '22:00' }] },
    saturday: { enabled: true, ranges: [{ start: '09:00', end: '22:00' }] },
    sunday: { enabled: false, ranges: [] },
    enabledDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: false
    }
  });

  // Mantenemos los valores del formulario como strings para permitir campos vacíos durante la edición
  const [inputValues, setInputValues] = useState({
    salonTables: '0',
    salonCapacity: '0',
    highTables: '0',
    highTablesCapacity: '0',
    terraceTables: '0',
    terraceCapacity: '0',
    barSeats: '0',
    depositAmount: '',
    maxDinersPerBot: '6',
    reservationDuration: '120',
    minTimeForReservations: '15',
  });

  // Schedule states
  const [reservationSchedule, setReservationSchedule] = useState<SimplifiedSchedule>(createDefaultSchedule());
  const [callRedirectionSchedule, setCallRedirectionSchedule] = useState<SimplifiedSchedule>(createDefaultSchedule());
  // Teléfono para redirección de llamadas
  const [callRedirectionPhone, setCallRedirectionPhone] = useState<string>('');
  // Activación de redirección de llamadas (por defecto: siempre BOT)
  const [enableCallRedirection, setEnableCallRedirection] = useState<boolean>(false);
  // Teléfono para período de gracia si se redirige
  const [gracePeriodRedirectPhone, setGracePeriodRedirectPhone] = useState<string>('');

  // La sincronización "mismo horario que reservas" ahora se maneja dentro de CallRedirectionSettingsForm

  // Estado real del config con valores numéricos
  const [config, setConfig] = useState<Omit<RestaurantConfig, 'id'>>({
    businessName: '',
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
    acceptsPhoneOrders: false,
    // Nuevos campos
    reservationSchedule: createDefaultSchedule(),
    callRedirectionSchedule: createDefaultSchedule(),
    maxDinersPerBot: 6,
    reservationDuration: 120,
    // Configuración de margen de reserva
    minTimeForReservations: undefined,
    actionDuringReservationGracePeriod: 'DISCARD',
    // Timezone detectado automáticamente del navegador
    timezone: detectAndMapTimezone(),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Estado local para el checkbox de margen de reserva
  const [enableReservationMargin, setEnableReservationMargin] = useState(false);

  // Auto-populate business name from Cognito user attributes
  useEffect(() => {
    console.log('🔍 DEBUG: RestaurantSetup useEffect triggered');
    console.log('🔍 DEBUG: user object (COMPLETE):', user);
    
    if (user) {
      console.log('🔍 DEBUG: Fetching user attributes with fetchUserAttributes...');
      
      // Use the proper Amplify API to fetch user attributes
      fetchUserAttributes()
        .then((attributes) => {
          console.log('🔍 DEBUG: Fetched user attributes (COMPLETE):', attributes);
          console.log('🔍 DEBUG: Available user attributes:');
          
          // Log all available attributes
          Object.keys(attributes).forEach(key => {
            console.log(`  - ${key}: ${attributes[key]}`);
          });
          
          // Try to extract business name from user attributes
          let businessName = '';
          businessName = attributes['custom:business_name'] || 
                        attributes['custom:company_name'] || 
                        attributes['custom:restaurant_name'] ||
                        attributes.name || 
                        attributes.given_name || 
                        attributes.family_name ||
                        attributes.nickname ||
                        '';
          
          console.log('🔍 DEBUG: Extracted businessName:', businessName);
          console.log('🔍 DEBUG: Current config.businessName:', config.businessName);
          
          // Only set if we found a business name and current businessName is empty
          if (businessName && !config.businessName) {
            console.log('✅ DEBUG: Setting businessName to:', businessName);
            setConfig(prev => ({ ...prev, businessName }));
          } else {
            console.log('⚠️ DEBUG: Not setting businessName. businessName:', businessName, 'config.businessName:', config.businessName);
          }
        })
        .catch((error) => {
          console.error('❌ DEBUG: Error fetching user attributes:', error);
        });
    } else {
      console.log('⚠️ DEBUG: No user object available');
    }
  }, [user, config.businessName]);

  // Nota: Las funciones helper de manipulación de horarios ahora se manejan dentro del SimplifiedScheduleConfig

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Información del negocio y mesas de salón
        if (!config.businessName || config.businessName.trim() === '') {
          newErrors.businessName = 'El nombre del negocio es obligatorio';
        }
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
      case 1: // Mesas altas y terraza (opcional)
        if (config.highTables && config.highTables > 0) {
          if (!config.highTablesCapacity || config.highTablesCapacity <= 0) {
            newErrors.highTablesCapacity = 'Debe especificar la capacidad de las mesas altas';
          }
          if (config.highTablesCapacity && config.highTablesCapacity < config.highTables) {
            newErrors.highTablesCapacity = 'La capacidad no puede ser menor al número de mesas altas';
          }
        }
        if (config.terraceTables && config.terraceTables > 0) {
          if (!config.terraceCapacity || config.terraceCapacity <= 0) {
            newErrors.terraceCapacity = 'Debe especificar la capacidad de la terraza';
          }
          if (config.terraceCapacity && config.terraceCapacity < config.terraceTables) {
            newErrors.terraceCapacity = 'La capacidad no puede ser menor al número de mesas de terraza';
          }
        }
        break;
      case 2: { // Horarios de reservas
        const schedErr = validateSchedules(reservationSchedule);
        if (schedErr) newErrors.reservationSchedule = 'Debe configurar horarios de reservas para al menos un día';
        break;
      }
      case 3: { // Horarios de redirección de llamadas
        const callErrs = validateCallRedirection({
          enable: enableCallRedirection,
          phone: callRedirectionPhone,
          schedule: callRedirectionSchedule,
        });
        Object.assign(newErrors, callErrs);
        break;
      }
      case 4: { // Configuración del bot
        const botErrs = validateBotSettings({
          maxDinersPerBot: config.maxDinersPerBot ?? undefined,
          reservationDuration: config.reservationDuration ?? undefined,
        });
        Object.assign(newErrors, botErrs);
        break;
      }
      case 5: // Configuración avanzada
        Object.assign(newErrors, validateDepositSettings({
          requiresDeposit: !!config.requiresDeposit,
          depositAmount: config.depositAmount ?? undefined,
        }));
        Object.assign(newErrors, validateReservationMargin({
          enabled: enableReservationMargin,
          minTimeForReservations: config.minTimeForReservations ?? undefined,
          action: config.actionDuringReservationGracePeriod === null ? undefined : config.actionDuringReservationGracePeriod,
          gracePeriodRedirectPhone,
        }));
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
      // Actualizar config con los horarios antes de completar
      const finalConfig = {
        ...config,
        reservationSchedule,
        callRedirectionSchedule,
        // usar valores del estado configurado por subformularios
        maxDinersPerBot: config.maxDinersPerBot,
        reservationDuration: config.reservationDuration,
        // Persistir el número de redirección de llamadas
        callRedirectionPhone: callRedirectionPhone || undefined,
        enableCallRedirection,
        // Si margen habilitado y sin valor, usar default
        minTimeForReservations: enableReservationMargin
          ? (config.minTimeForReservations ?? DEFAULT_MIN_TIME_FOR_RESERVATIONS)
          : undefined,
        gracePeriodRedirectPhone: gracePeriodRedirectPhone || undefined,
      } as Omit<RestaurantConfig, 'id'>;
      onComplete(finalConfig);
    }
  };

  // Función para actualizar solo el valor del input (como string)
  const handleInputChange = (field: string, value: string) => {
    // Actualizar el valor visible (string)
    setInputValues(prev => ({ ...prev, [field]: value }));
    
    // Manejar campos decimales (como depositAmount)
    if (field === 'depositAmount') {
      const numValue = value === '' ? undefined : parseFloat(value);
      setConfig(prev => ({ ...prev, [field]: numValue }));
    } else if (field === 'minTimeForReservations') {
      // Campo opcional de margen de reserva - permitir campo vacío
      const numValue = value === '' ? undefined : parseInt(value);
      setConfig(prev => ({ ...prev, [field]: numValue }));
    } else {
      // Campos enteros
      const numValue = value === '' ? 0 : parseInt(value);
      setConfig(prev => ({ ...prev, [field]: numValue }));
    }
    
    // Limpiar errores si el campo ahora tiene valor válido
    const numericValue = field === 'depositAmount' ? parseFloat(value) : parseInt(value);
    if (numericValue > 0) {
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
      label: 'Otras zonas',
      description: 'Configure mesas altas, terraza y barra (opcional)',
      icon: <TableBar />
    },
    {
      label: 'Horarios de reservas',
      description: 'Configure cuándo acepta reservas',
      icon: <Schedule />
    },
    {
      label: 'Redirección de llamadas',
      description: 'Configure cuándo las llamadas van a su teléfono en lugar del bot',
      icon: <Phone />
    },
    {
      label: 'Configuración del bot',
      description: 'Configure límites y tiempos del bot',
      icon: <Group />
    },
    {
      label: 'Configuración avanzada',
      description: 'Configure opciones adicionales para las reservas',
      icon: <Settings />
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
                
                {/* Paso 1: Información del negocio y mesas de salón */}
                {index === 0 && (
                  <Stack spacing={3} sx={{ width: '100%' }}>
                    {/* Nombre del negocio */}
                    <Box sx={{ width: '100%' }}>
                      <TextField
                        fullWidth
                        label="Nombre del negocio"
                        value={config.businessName}
                        onChange={(e) => setConfig(prev => ({ ...prev, businessName: e.target.value }))}
                        error={!!errors.businessName}
                        helperText={errors.businessName}
                        required
                        sx={{ mb: 2 }}
                      />
                    </Box>
                    
                    {/* Mesas de salón */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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
                  </Stack>
                )}

                {/* Paso 2: Otras zonas (mesas altas, terraza, barra) */}
                {index === 1 && (
                  <Stack spacing={3}>
                    {/* Mesas altas */}
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TableBar />
                          Mesas altas
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                          <TextField
                            fullWidth
                            label="Número de mesas altas"
                            type="number"
                            value={inputValues.highTables}
                            onChange={(e) => handleInputChange('highTables', e.target.value)}
                            helperText="Deje en 0 si no tiene mesas altas"
                            inputProps={{ min: 0 }}
                          />
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
                        </Stack>
                      </CardContent>
                    </Card>
                    
                    {/* Terraza */}
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Restaurant />
                          Terraza
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                          <TextField
                            fullWidth
                            label="Número de mesas de terraza"
                            type="number"
                            value={inputValues.terraceTables}
                            onChange={(e) => handleInputChange('terraceTables', e.target.value)}
                            helperText="Deje en 0 si no tiene terraza"
                            inputProps={{ min: 0 }}
                          />
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
                        </Stack>
                      </CardContent>
                    </Card>
                    
                    {/* Barra */}
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TableBar />
                          Barra
                        </Typography>
                        <TextField
                          fullWidth
                          label="Plazas en la barra"
                          type="number"
                          value={inputValues.barSeats}
                          onChange={(e) => handleInputChange('barSeats', e.target.value)}
                          helperText="Deje en 0 si no tiene barra"
                          inputProps={{ min: 0 }}
                          sx={{ maxWidth: { sm: '50%' } }}
                        />
                      </CardContent>
                    </Card>
                  </Stack>
                )}

                {/* Paso 3: Horarios de reservas */}
                {index === 2 && (
                  <SimplifiedScheduleConfig
                    title="Horarios de Reservas"
                    description="Configure los días y horarios en los que acepta reservas. El bot solo gestionará reservas durante estos horarios."
                    schedule={reservationSchedule}
                    onChange={setReservationSchedule}
                    error={errors.reservationSchedule}
                  />
                )}

                {/* Paso 4: Horarios de redirección de llamadas */}
                {index === 3 && (
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
                )}

                {/* Paso 5: Configuración del bot */}
                {index === 4 && (
                  <Stack spacing={3}>
                    <Alert severity="info">
                      Configure los límites, tiempos y zona horaria del bot para gestionar las reservas de manera eficiente.
                    </Alert>
                    <BotSettingsForm
                      value={{
                        maxDinersPerBot: config.maxDinersPerBot ?? undefined,
                        reservationDuration: config.reservationDuration ?? undefined,
                        timezone: (config.timezone ?? undefined) as string | undefined,
                      }}
                      onChange={(patch) => {
                        setConfig(prev => ({ ...prev, ...patch }));
                      }}
                      errors={errors}
                    />
                  </Stack>
                )}

                {/* Paso 6: Configuración avanzada */}
                {index === 5 && (
                  <Stack spacing={3} sx={{ width: '100%' }}>
                    {/* Configuración de paga y señal */}
                    <DepositSettingsForm
                      value={{
                        requiresDeposit: !!config.requiresDeposit,
                        depositType: (config.depositType ?? undefined) as 'FIXED_PER_RESERVATION' | 'PER_PERSON' | undefined,
                        depositAmount: config.depositAmount ?? undefined,
                      }}
                      onChange={(patch) => setConfig(prev => ({ ...prev, ...patch }))}
                      errors={errors}
                    />

                    {/* Configuración de margen de reserva (opcional) */}
                    <ReservationMarginForm
                      value={{
                        enabled: enableReservationMargin,
                        minTimeForReservations: config.minTimeForReservations ?? undefined,
                        actionDuringReservationGracePeriod: (config.actionDuringReservationGracePeriod === null
                          ? undefined
                          : (config.actionDuringReservationGracePeriod as 'DISCARD' | 'REDIRECT' | undefined)),
                        gracePeriodRedirectPhone,
                      }}
                      onChange={(patch) => {
                        if (patch.enabled !== undefined) setEnableReservationMargin(!!patch.enabled);
                        if (patch.minTimeForReservations !== undefined) setConfig(prev => ({ ...prev, minTimeForReservations: patch.minTimeForReservations }))
                        if (patch.actionDuringReservationGracePeriod !== undefined) setConfig(prev => ({ ...prev, actionDuringReservationGracePeriod: patch.actionDuringReservationGracePeriod }))
                        if (patch.gracePeriodRedirectPhone !== undefined) setGracePeriodRedirectPhone(patch.gracePeriodRedirectPhone)
                      }}
                      errors={errors}
                    />

                    {/* Configuración de pedidos por teléfono */}
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2 }}>Pedidos por teléfono:</Typography>
                      
                      <Stack spacing={1}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.acceptsPhoneOrders || false}
                              onChange={(e) => setConfig(prev => ({ ...prev, acceptsPhoneOrders: e.target.checked }))}
                            />
                          }
                          label="¿Tu restaurante recibe llamadas para encargar pedidos (a recoger en local o entregar a domicilio)?"
                        />
                      </Stack>
                    </Box>

                    {/* Preguntas adicionales - DESHABILITADO POR PETICIÓN DEL USUARIO
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2 }}>Preguntas adicionales para las reservas:</Typography>
                      
                      <Stack spacing={1}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.askReservationReason || false}
                              onChange={(e) => setConfig(prev => ({ ...prev, askReservationReason: e.target.checked }))}
                            />
                          }
                          label="¿Preguntar por el motivo de la reserva? (cumpleaños, aniversario, etc.)"
                        />
                        
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.askAllergies || false}
                              onChange={(e) => setConfig(prev => ({ ...prev, askAllergies: e.target.checked }))}
                            />
                          }
                          label="¿Preguntar por alergias o intolerancias?"
                        />
                        
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.askFoodType || false}
                              onChange={(e) => setConfig(prev => ({ ...prev, askFoodType: e.target.checked }))}
                            />
                          }
                          label="¿Preguntar por el tipo de comida? (menú, carta, degustación, etc.)"
                        />
                      </Stack>
                    </Box>
                    */}
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
