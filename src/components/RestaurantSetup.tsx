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
  FormControl,
  FormControlLabel,
  Switch,
  RadioGroup,
  Radio,
  FormLabel,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Tooltip
} from '@mui/material';
import { 
  Restaurant, 
  TableBar, 
  Settings, 
  Schedule, 
  Phone, 
  Group, 
  Timer, 
  InfoOutlined 
} from '@mui/icons-material';

// Importamos la interfaz RestaurantConfig del hook para mantener consistencia
import { RestaurantConfig } from '../hooks/useRestaurantConfig';
import SimplifiedScheduleConfig, { SimplifiedSchedule } from './SimplifiedScheduleConfig';
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
  // Mantener opción de "Mismo que el horario de reservas" para redirección de llamadas
  const [sameCallsAsReservations, setSameCallsAsReservations] = useState<boolean>(true);
  // Teléfono para redirección de llamadas
  const [callRedirectionPhone, setCallRedirectionPhone] = useState<string>('');
  // Activación de redirección de llamadas (por defecto: siempre BOT)
  const [enableCallRedirection, setEnableCallRedirection] = useState<boolean>(false);
  // Teléfono para período de gracia si se redirige
  const [gracePeriodRedirectPhone, setGracePeriodRedirectPhone] = useState<string>('');

  // Sincronizar automáticamente cuando la opción está activa
  useEffect(() => {
    if (sameCallsAsReservations) {
      setCallRedirectionSchedule(reservationSchedule);
    }
  }, [sameCallsAsReservations, reservationSchedule]);

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
        // Validar que al menos un grupo tenga horarios configurados y días habilitados
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
        break;
      }
      case 3: { // Horarios de redirección de llamadas
        if (enableCallRedirection) {
          // Validar que al menos un grupo tenga horarios configurados y días habilitados
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
          // Validar teléfono con regex simple
          const phone = (callRedirectionPhone || '').trim();
          const simplePhoneRegex = /^[+]?[- 0-9()]{7,}$/;
          if (!phone || !simplePhoneRegex.test(phone)) {
            newErrors.callRedirectionPhone = 'Introduzca un teléfono válido (validación simple)';
          }
        }
        break;
      }
      case 4: // Configuración del bot
        if (!config.maxDinersPerBot || config.maxDinersPerBot <= 0) {
          newErrors.maxDinersPerBot = 'El número máximo de comensales debe ser mayor a 0';
        }
        if (!config.reservationDuration || config.reservationDuration <= 0) {
          newErrors.reservationDuration = 'El tiempo de reserva debe ser mayor a 0';
        }
        // Validación de teléfono para período de gracia cuando se elige REDIRECT
        if (config.actionDuringReservationGracePeriod === 'REDIRECT') {
          const phone = (gracePeriodRedirectPhone || '').trim();
          const simplePhoneRegex = /^[+]?[- 0-9()]{7,}$/;
          if (!phone || !simplePhoneRegex.test(phone)) {
            newErrors.gracePeriodRedirectPhone = 'Introduzca un teléfono válido (validación simple)';
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
      // Actualizar config con los horarios antes de completar
      const finalConfig = {
        ...config,
        reservationSchedule,
        callRedirectionSchedule,
        maxDinersPerBot: parseInt(inputValues.maxDinersPerBot) || 6,
        reservationDuration: parseInt(inputValues.reservationDuration) || 120,
        // Persistir el número de redirección de llamadas
        callRedirectionPhone: callRedirectionPhone || undefined,
        enableCallRedirection,
        gracePeriodRedirectPhone: gracePeriodRedirectPhone || undefined,
      };
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
      description: 'Configure cuándo redirigir llamadas a personal',
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
                    {/* Atención de llamadas: BOT siempre vs redirigir algunas */}
                    <FormControl component="fieldset" sx={{ mb: 1 }}>
                      <FormLabel component="legend">Atención de llamadas</FormLabel>
                      <RadioGroup
                        value={enableCallRedirection ? 'REDIRECT_SOME' : 'ALWAYS_BOT'}
                        onChange={(e) => {
                          const v = e.target.value;
                          const enabled = v === 'REDIRECT_SOME';
                          setEnableCallRedirection(enabled);
                          if (!enabled) {
                            // Limpia errores relacionados
                            setErrors(prev => ({ ...prev, callRedirectionSchedule: '', callRedirectionPhone: '' }));
                          }
                        }}
                        row
                      >
                        <FormControlLabel value="ALWAYS_BOT" control={<Radio />} label="Siempre las atiende el bot" />
                        <FormControlLabel value="REDIRECT_SOME" control={<Radio />} label="Quiero redirigir algunas llamadas" />
                      </RadioGroup>
                    </FormControl>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={sameCallsAsReservations}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSameCallsAsReservations(checked);
                            if (checked) {
                              setCallRedirectionSchedule(reservationSchedule);
                            }
                          }}
                          disabled={!enableCallRedirection}
                        />
                      }
                      label="Mismo que el horario de reservas"
                    />

                    {/* Número para redirigir */}
                    <Box sx={{ mt: 2, mb: 2 }}>
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

                    {sameCallsAsReservations ? (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        Usando el mismo horario que el de reservas. Desactiva la opción para personalizar este horario.
                      </Alert>
                    ) : (
                      enableCallRedirection && (
                        <SimplifiedScheduleConfig
                          title="Horarios de Redirección de Llamadas"
                          description="Configure los horarios en los que las llamadas serán redirigidas a una persona responsable en lugar del bot."
                          schedule={callRedirectionSchedule}
                          onChange={setCallRedirectionSchedule}
                          error={errors.callRedirectionSchedule}
                        />
                      )
                    )}
                  </Box>
                )}

                {/* Paso 5: Configuración del bot */}
                {index === 4 && (
                  <Stack spacing={3}>
                    <Alert severity="info">
                      Configure los límites y tiempos del bot para gestionar las reservas de manera eficiente.
                    </Alert>
                    
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Group />
                          Número máximo de comensales por bot
                          <Tooltip title="El bot redirigirá las llamadas a personal cuando el número de comensales sea superior a este límite">
                            <InfoOutlined fontSize="small" color="info" />
                          </Tooltip>
                        </Typography>
                        <TextField
                          fullWidth
                          label="Máximo de comensales que atenderá el bot"
                          type="number"
                          value={inputValues.maxDinersPerBot}
                          onChange={(e) => handleInputChange('maxDinersPerBot', e.target.value)}
                          error={!!errors.maxDinersPerBot}
                          helperText={errors.maxDinersPerBot || "Si una reserva supera este número, se redirigirá a una persona responsable"}
                          inputProps={{ min: 1, max: 20 }}
                          sx={{ maxWidth: { sm: '50%' } }}
                        />
                      </CardContent>
                    </Card>
                    
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Timer />
                          Tiempo de reserva
                          <Tooltip title="Tiempo que el restaurante da a los comensales para comer. Necesario para saber cuándo puede entrar una nueva reserva en la misma mesa">
                            <InfoOutlined fontSize="small" color="info" />
                          </Tooltip>
                        </Typography>
                        <TextField
                          fullWidth
                          label="Tiempo de reserva (minutos)"
                          type="number"
                          value={inputValues.reservationDuration}
                          onChange={(e) => handleInputChange('reservationDuration', e.target.value)}
                          error={!!errors.reservationDuration}
                          helperText={errors.reservationDuration || "Tiempo que dura una reserva para calcular disponibilidad de mesas"}
                          inputProps={{ min: 30, max: 480, step: 15 }}
                          sx={{ maxWidth: { sm: '50%' } }}
                        />
                      </CardContent>
                    </Card>
                  </Stack>
                )}

                {/* Paso 6: Configuración avanzada */}
                {index === 5 && (
                  <Stack spacing={3} sx={{ width: '100%' }}>
                    {/* Configuración de paga y señal */}
                    <Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.requiresDeposit || false}
                            onChange={(e) => setConfig(prev => ({ ...prev, requiresDeposit: e.target.checked }))}
                          />
                        }
                        label="¿Quieres que el cliente realice una paga y señal?"
                      />
                      
                      {config.requiresDeposit && (
                        <Box sx={{ mt: 2, ml: 2 }}>
                          <FormControl component="fieldset">
                            <FormLabel component="legend" sx={{ mb: 1 }}>Tipo de paga y señal:</FormLabel>
                            <RadioGroup
                              value={config.depositType}
                              onChange={(e) => setConfig(prev => ({ ...prev, depositType: e.target.value as 'FIXED_PER_RESERVATION' | 'PER_PERSON' }))}
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
                            label={`Cantidad (€) ${config.depositType === 'PER_PERSON' ? 'por persona' : 'por reserva'}`}
                            type="number"
                            value={inputValues.depositAmount}
                            onChange={(e) => handleInputChange('depositAmount', e.target.value)}
                            sx={{ mt: 2 }}
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </Box>
                      )}
                    </Box>

                    {/* Configuración de margen de reserva (opcional) */}
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Margen de Reserva (Opcional)
                        <Tooltip title="Configure el tiempo mínimo de antelación para aceptar reservas. Este campo es opcional y puede configurarse más tarde.">
                          <InfoOutlined sx={{ ml: 1, fontSize: 18, color: 'text.secondary' }} />
                        </Tooltip>
                      </Typography>
                      
                      <Stack spacing={2}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={enableReservationMargin}
                              onChange={(e) => {
                                setEnableReservationMargin(e.target.checked);
                                if (e.target.checked) {
                                  // Establecer valores por defecto cuando se habilita
                                  setInputValues(prev => ({ ...prev, minTimeForReservations: '15' }));
                                  setConfig(prev => ({
                                    ...prev,
                                    minTimeForReservations: 15,
                                    actionDuringReservationGracePeriod: 'DISCARD'
                                  }));
                                } else {
                                  // Limpiar cuando se deshabilita
                                  setInputValues(prev => ({ ...prev, minTimeForReservations: '' }));
                                  setConfig(prev => ({
                                    ...prev,
                                    minTimeForReservations: undefined,
                                    actionDuringReservationGracePeriod: 'DISCARD'
                                  }));
                                }
                              }}
                            />
                          }
                          label="Habilitar margen mínimo de reserva"
                        />
                        
                        {enableReservationMargin && (
                          <Box sx={{ ml: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, maxWidth: 400 }}>
                              <TextField
                                label="Tiempo mínimo de antelación (minutos)"
                                type="text"
                                value={inputValues.minTimeForReservations}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // Permitir solo números
                                  if (value === '' || /^\d+$/.test(value)) {
                                    setInputValues(prev => ({ ...prev, minTimeForReservations: value }));
                                    const numValue = value === '' ? 15 : Math.max(1, parseInt(value) || 1);
                                    setConfig(prev => ({ ...prev, minTimeForReservations: numValue }));
                                  }
                                }}
                                onBlur={() => {
                                  if ((inputValues.minTimeForReservations || '').trim() === '') {
                                    setInputValues(prev => ({ ...prev, minTimeForReservations: '15' }));
                                    setConfig(prev => ({ ...prev, minTimeForReservations: 15 }));
                                  } else {
                                    const parsed = Math.max(1, parseInt(inputValues.minTimeForReservations, 10) || 15);
                                    setConfig(prev => ({ ...prev, minTimeForReservations: parsed }));
                                  }
                                }}
                                helperText="Por defecto: 15 minutos"
                                sx={{ flexGrow: 1 }}
                              />
                            </Box>
                            
                            <FormControl component="fieldset" sx={{ mt: 1 }}>
                              <FormLabel component="legend">
                                ¿Qué hacer cuando una reserva no cumple el tiempo mínimo?
                              </FormLabel>
                              <RadioGroup
                                value={config.actionDuringReservationGracePeriod}
                                onChange={(e) => {
                                  const value = e.target.value as 'DISCARD' | 'REDIRECT';
                                  setConfig(prev => ({ 
                                    ...prev, 
                                    actionDuringReservationGracePeriod: value
                                  }));
                                  if (value === 'REDIRECT' && !gracePeriodRedirectPhone && callRedirectionPhone) {
                                    setGracePeriodRedirectPhone(callRedirectionPhone);
                                  }
                                }}
                                sx={{ mt: 1 }}
                              >
                                <FormControlLabel
                                  value="DISCARD"
                                  control={<Radio />}
                                  label="Descartar la reserva (informar al cliente que no se puede reservar con tan poca antelación)"
                                />
                                <FormControlLabel
                                  value="REDIRECT"
                                  control={<Radio />}
                                  label="Redireccionar a la persona de contacto del restaurante"
                                />
                              </RadioGroup>
                              {config.actionDuringReservationGracePeriod === 'REDIRECT' && (
                                <Box sx={{ mt: 2 }}>
                                  <TextField
                                    label="Número para redirigir durante el período de gracia"
                                    placeholder="Ej: +34 612 345 678"
                                    fullWidth
                                    value={gracePeriodRedirectPhone}
                                    onChange={(e) => setGracePeriodRedirectPhone(e.target.value)}
                                    error={Boolean(errors.gracePeriodRedirectPhone)}
                                    helperText={errors.gracePeriodRedirectPhone || 'Si no se indica, se usará el de redirección general'}
                                  />
                                </Box>
                              )}
                            </FormControl>
                          </Box>
                        )}
                      </Stack>
                    </Box>

                    {/* Preguntas adicionales */}
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
