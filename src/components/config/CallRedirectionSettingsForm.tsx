import React, { useEffect, useState } from 'react';
import { Box, FormControlLabel, Checkbox, TextField } from '@mui/material';
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
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={<Checkbox checked={!enableCallRedirection} onChange={(e) => onChange({ enableCallRedirection: !e.target.checked })} />}
          label="Atender todas las llamadas con el bot"
        />
        <FormControlLabel
          control={<Checkbox checked={enableCallRedirection} onChange={(e) => onChange({ enableCallRedirection: e.target.checked })} />}
          label="Redirigir algunas llamadas a un número"
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={<Checkbox checked={useSame} onChange={(e) => setUseSame(e.target.checked)} disabled={!enableCallRedirection || !allowUseSameScheduleToggle} />}
          label="Usar el mismo horario que las reservas"
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          label="Número para redirigir llamadas"
          placeholder="Ej: +34 612 345 678"
          fullWidth
          value={callRedirectionPhone ?? ''}
          onChange={(e) => onChange({ callRedirectionPhone: e.target.value })}
          error={Boolean(errors.callRedirectionPhone)}
          helperText={errors.callRedirectionPhone || 'Usaremos este número cuando corresponda redirigir llamadas'}
          disabled={!enableCallRedirection}
        />
      </Box>

      {enableCallRedirection && !useSame && (
        <SimplifiedScheduleConfig
          title="Horario de redirección de llamadas"
          description="Indica en qué franjas se redirigen las llamadas"
          schedule={callRedirectionSchedule || reservationSchedule}
          onChange={(s) => onChange({ callRedirectionSchedule: s })}
          error={errors.callRedirectionSchedule}
        />
      )}
    </Box>
  );
};

export default CallRedirectionSettingsForm;
