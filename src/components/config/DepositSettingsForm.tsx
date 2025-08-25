import React from 'react';
import { Box, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Switch, TextField } from '@mui/material';

export interface DepositSettingsValue {
  requiresDeposit?: boolean;
  depositType?: 'FIXED_PER_RESERVATION' | 'PER_PERSON';
  depositAmount?: number;
}

export interface DepositSettingsFormProps {
  value: DepositSettingsValue;
  onChange: (value: Partial<DepositSettingsValue>) => void;
  errors?: Record<string, string>;
}

const DepositSettingsForm: React.FC<DepositSettingsFormProps> = ({ value, onChange, errors = {} }) => {
  const { requiresDeposit = false, depositType = 'FIXED_PER_RESERVATION', depositAmount } = value;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <FormControlLabel
        control={<Switch checked={requiresDeposit} onChange={(e) => onChange({ requiresDeposit: e.target.checked })} />}
        label="Solicitar paga y señal para confirmar reservas"
        sx={{ alignItems: 'flex-start' }}
      />

      {requiresDeposit && (
        <Box sx={{ ml: { xs: 1, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl>
            <FormLabel>Tipo de paga y señal</FormLabel>
            <RadioGroup
              value={depositType}
              onChange={(e) => onChange({ depositType: e.target.value as 'FIXED_PER_RESERVATION' | 'PER_PERSON' })}
            >
              <FormControlLabel value="FIXED_PER_RESERVATION" control={<Radio />} label="Cantidad fija por reserva" />
              <FormControlLabel value="PER_PERSON" control={<Radio />} label="Cantidad por persona" />
            </RadioGroup>
          </FormControl>

          <TextField
            fullWidth
            label={`Cantidad (€) ${depositType === 'PER_PERSON' ? 'por persona' : 'por reserva'}`}
            type="number"
            value={depositAmount ?? ''}
            onChange={(e) => onChange({ depositAmount: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
            error={Boolean(errors.depositAmount)}
            helperText={
              errors.depositAmount ||
              (depositType === 'PER_PERSON'
                ? 'Se cobrará esta cantidad por comensal'
                : 'Se cobrará esta cantidad por reserva')
            }
            inputProps={{ min: 0, step: 0.01 }}
            sx={{ maxWidth: { xs: '100%', sm: 300 } }}
          />
        </Box>
      )}
    </Box>
  );
};

export default DepositSettingsForm;
