import React, { useEffect, useState } from 'react';
import { Box, Typography, FormControlLabel, TextField, Checkbox, Alert } from '@mui/material';
import SimplifiedScheduleConfig, { SimplifiedSchedule } from '../SimplifiedScheduleConfig';

export interface CallRedirectionValue {
  enableCallRedirection?: boolean;
  callRedirectionPhone?: string;
  reservationSchedule: SimplifiedSchedule;
  callRedirectionSchedule?: SimplifiedSchedule;
}

export interface CallRedirectionSettingsFormProps {
  value: CallRedirectionValue;
  onChange: (value: Partial<CallRedirectionValue>) => void;
  errors?: Record<string, string>;
  allowUseSameScheduleToggle?: boolean; // when used in modal
}

const CallRedirectionSettingsForm: React.FC<CallRedirectionSettingsFormProps> = ({ value, onChange, errors = {}, allowUseSameScheduleToggle = true }) => {
  const { enableCallRedirection = false, callRedirectionPhone, reservationSchedule, callRedirectionSchedule } = value;
  const [useSame, setUseSame] = useState<boolean>(false);

  // Initialize useSame if schedules are equal
  useEffect(() => {
    if (!callRedirectionSchedule) return;
    const same = JSON.stringify(reservationSchedule) === JSON.stringify(callRedirectionSchedule);
    setUseSame(same);
  }, [reservationSchedule, callRedirectionSchedule]);

  useEffect(() => {
    if (useSame) {
      onChange({ callRedirectionSchedule: reservationSchedule });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useSame, reservationSchedule]);

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Redirección de Llamadas</strong><br />
          Configura cuándo las llamadas van directamente a tu teléfono en lugar del bot
        </Typography>
      </Alert>

      {/* Explicación específica de redirección de llamadas */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>💡 ¿Cómo funciona la redirección de llamadas?</Typography>
        <Typography variant="body2" color="text.secondary">
          Puedes elegir que <strong>dentro de ciertos horarios</strong>, las llamadas que lleguen a tu restaurante 
          se redirijan directamente <strong>a tu teléfono personal</strong> en lugar de ser atendidas por el bot. 
          Esto es útil cuando prefieres atender personalmente durante horas específicas.
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={<Checkbox checked={!enableCallRedirection} onChange={(e) => onChange({ enableCallRedirection: !e.target.checked })} />}
          label="🤖 El bot siempre atiende todas las llamadas"
        />
        <FormControlLabel
          control={<Checkbox checked={enableCallRedirection} onChange={(e) => onChange({ enableCallRedirection: e.target.checked })} />}
          label="📞 Redirigir llamadas a mi teléfono en horarios específicos"
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          label="Tu número de teléfono personal"
          placeholder="Ej: +34 612 345 678"
          fullWidth
          value={callRedirectionPhone ?? ''}
          onChange={(e) => onChange({ callRedirectionPhone: e.target.value })}
          error={Boolean(errors.callRedirectionPhone)}
          helperText={errors.callRedirectionPhone || 'A este número se redirigirán las llamadas durante los horarios que configures'}
          disabled={!enableCallRedirection}
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={<Checkbox checked={useSame} onChange={(e) => setUseSame(e.target.checked)} disabled={!enableCallRedirection || !allowUseSameScheduleToggle} />}
          label="⏰ Redirigir en el mismo horario que acepto reservas"
        />
      </Box>

      {enableCallRedirection && !useSame && (
        <SimplifiedScheduleConfig
          title="📅 Horario de redirección personalizado"
          description="Define exactamente cuándo quieres que las llamadas se redirijan a tu teléfono. Fuera de estos horarios, el bot atenderá automáticamente."
          schedule={callRedirectionSchedule || reservationSchedule}
          onChange={(s) => onChange({ callRedirectionSchedule: s })}
          error={errors.callRedirectionSchedule}
        />
      )}
    </Box>
  );
};

export default CallRedirectionSettingsForm;
