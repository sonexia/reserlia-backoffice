import React, { useState, useEffect } from 'react';
import { Box, FormControlLabel, Radio, RadioGroup, Switch, TextField, FormLabel } from '@mui/material';
import { DEFAULT_MIN_TIME_FOR_RESERVATIONS } from '../../config/rest-config-defaults';

export interface ReservationMarginValue {
  enabled: boolean;
  minTimeForReservations?: number;
  actionDuringReservationGracePeriod?: 'DISCARD' | 'REDIRECT';
  gracePeriodRedirectPhone?: string;
}

export interface ReservationMarginFormProps {
  value: ReservationMarginValue;
  onChange: (value: Partial<ReservationMarginValue>) => void;
  errors?: Record<string, string>;
}

const ReservationMarginForm: React.FC<ReservationMarginFormProps> = ({ value, onChange, errors = {} }) => {
  const { enabled, minTimeForReservations, actionDuringReservationGracePeriod = 'DISCARD', gracePeriodRedirectPhone } = value;
  const [minText, setMinText] = useState<string>('');

  useEffect(() => {
    if (enabled) {
      const v = (minTimeForReservations ?? DEFAULT_MIN_TIME_FOR_RESERVATIONS).toString();
      setMinText(v);
    } else {
      setMinText(minTimeForReservations !== undefined ? String(minTimeForReservations) : '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => {
    if (minTimeForReservations !== undefined && minTimeForReservations !== null) {
      setMinText(String(minTimeForReservations));
    }
  }, [minTimeForReservations]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControlLabel
        control={
          <Switch
            checked={enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
          />
        }
        label="Exigir antelación mínima para reservar"
      />

      {enabled && (
        <Box sx={{ ml: { xs: 1, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Tiempo mínimo de antelación (minutos)"
            type="text"
            value={minText}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^\d+$/.test(value)) {
                setMinText(value);
              }
            }}
            onBlur={() => {
              const normalized = minText.trim() === '' ? DEFAULT_MIN_TIME_FOR_RESERVATIONS : Math.max(1, parseInt(minText, 10) || DEFAULT_MIN_TIME_FOR_RESERVATIONS);
              onChange({ minTimeForReservations: normalized });
              setMinText(String(normalized));
            }}
            error={Boolean(errors.minTimeForReservations)}
            helperText={errors.minTimeForReservations || `Si está vacío, usaremos el valor recomendado: ${DEFAULT_MIN_TIME_FOR_RESERVATIONS} minutos`}
            sx={{ maxWidth: { xs: '100%', sm: 300 } }}
          />

          <Box>
            <FormLabel component="legend">Si no se cumple la antelación mínima</FormLabel>
            <RadioGroup
              value={actionDuringReservationGracePeriod}
              onChange={(e) => onChange({ actionDuringReservationGracePeriod: e.target.value as 'DISCARD' | 'REDIRECT' })}
              sx={{ gap: { xs: 1, sm: 0.5 } }}
            >
              <FormControlLabel value="DISCARD" control={<Radio />} label="Descartar la reserva" />
              <FormControlLabel value="REDIRECT" control={<Radio />} label="Redirigir la llamada a un responsable" />
            </RadioGroup>
          </Box>

          {actionDuringReservationGracePeriod === 'REDIRECT' && (
            <TextField
              label="Número para redirigir durante el período de gracia"
              placeholder="Ej: +34 612 345 678"
              fullWidth
              value={gracePeriodRedirectPhone ?? ''}
              onChange={(e) => onChange({ gracePeriodRedirectPhone: e.target.value })}
              error={Boolean(errors.gracePeriodRedirectPhone)}
              helperText={errors.gracePeriodRedirectPhone || 'Si no lo indicas, usaremos el número de redirección general'}
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default ReservationMarginForm;
