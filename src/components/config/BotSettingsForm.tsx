import React from 'react';
import { Box, TextField } from '@mui/material';
import { DEFAULT_TIMEZONE } from '../../config/rest-config-defaults';

export interface BotSettingsValue {
  maxDinersPerBot?: number;
  reservationDuration?: number;
  timezone?: string;
}

export interface BotSettingsFormProps {
  value: BotSettingsValue;
  onChange: (value: Partial<BotSettingsValue>) => void;
  errors?: Record<string, string>;
}

const BotSettingsForm: React.FC<BotSettingsFormProps> = ({ value, onChange, errors = {} }) => {
  const { maxDinersPerBot, reservationDuration, timezone = DEFAULT_TIMEZONE } = value;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <TextField
        fullWidth
        label="Máximo de comensales por bot"
        type="number"
        value={maxDinersPerBot ?? ''}
        onChange={(e) => onChange({ maxDinersPerBot: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
        error={Boolean(errors.maxDinersPerBot)}
        helperText={errors.maxDinersPerBot || 'Número máximo de comensales que el bot puede gestionar por reserva'}
        inputProps={{ min: 1 }}
        sx={{ maxWidth: { xs: '100%', sm: 300 } }}
      />

      <TextField
        fullWidth
        label="Duración estimada por reserva (minutos)"
        type="number"
        value={reservationDuration ?? ''}
        onChange={(e) => onChange({ reservationDuration: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
        error={Boolean(errors.reservationDuration)}
        helperText={errors.reservationDuration || 'Tiempo estimado que ocupará cada mesa (ayuda a calcular disponibilidad)'}
        inputProps={{ min: 15, step: 15 }}
        sx={{ maxWidth: { xs: '100%', sm: 300 } }}
      />

      <TextField
        select
        fullWidth
        label="Zona horaria del restaurante"
        value={timezone}
        onChange={(e) => onChange({ timezone: e.target.value })}
        helperText="Todas las reservas se mostrarán en esta zona horaria"
        sx={{ maxWidth: 300 }}
        SelectProps={{ native: true }}
      >
        <option value="Europe/Madrid">España peninsular (CET/CEST)</option>
        <option value="Atlantic/Canary">España Canarias (WET/WEST)</option>
      </TextField>
    </Box>
  );
};

export default BotSettingsForm;
