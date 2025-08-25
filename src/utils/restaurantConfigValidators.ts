import { DEFAULT_MIN_TIME_FOR_RESERVATIONS } from '../config/rest-config-defaults';
import { SimplifiedSchedule } from '../components/SimplifiedScheduleConfig';

export type ValidationErrors = Record<string, string>;

export function validateSchedules(schedule: SimplifiedSchedule | undefined): string | undefined {
  if (!schedule) return 'Debe configurar horarios para al menos un día';
  const hasWeekdays = schedule.weekdays.enabled && schedule.weekdays.ranges.length > 0 && (
    schedule.enabledDays.monday || schedule.enabledDays.tuesday || schedule.enabledDays.wednesday ||
    schedule.enabledDays.thursday || schedule.enabledDays.friday
  );
  const hasSaturday = schedule.saturday.enabled && schedule.saturday.ranges.length > 0 && schedule.enabledDays.saturday;
  const hasSunday = schedule.sunday.enabled && schedule.sunday.ranges.length > 0 && schedule.enabledDays.sunday;
  const ok = hasWeekdays || hasSaturday || hasSunday;
  return ok ? undefined : 'Debe configurar horarios para al menos un día';
}

export function validateBotSettings(params: { maxDinersPerBot?: number; reservationDuration?: number }): ValidationErrors {
  const errors: ValidationErrors = {};
  if (params.maxDinersPerBot !== undefined && params.maxDinersPerBot <= 0) {
    errors.maxDinersPerBot = 'El número máximo de comensales debe ser mayor a 0';
  }
  if (params.reservationDuration !== undefined && params.reservationDuration <= 0) {
    errors.reservationDuration = 'La duración de reserva debe ser mayor a 0';
  }
  return errors;
}

export function validateDepositSettings(params: { requiresDeposit?: boolean; depositAmount?: number | undefined }): ValidationErrors {
  const errors: ValidationErrors = {};
  if (params.requiresDeposit) {
    if (params.depositAmount === undefined || params.depositAmount === null || params.depositAmount <= 0) {
      errors.depositAmount = 'Debe especificar una cantidad válida para el depósito';
    }
  }
  return errors;
}

export function validateReservationMargin(params: {
  enabled?: boolean;
  minTimeForReservations?: number | undefined;
  action?: 'DISCARD' | 'REDIRECT' | undefined;
  gracePeriodRedirectPhone?: string | undefined;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  if (params.enabled) {
    const min = params.minTimeForReservations ?? DEFAULT_MIN_TIME_FOR_RESERVATIONS;
    if (min <= 0) {
      errors.minTimeForReservations = 'El tiempo mínimo debe ser mayor a 0 minutos';
    }
    if (params.action === 'REDIRECT') {
      const phone = (params.gracePeriodRedirectPhone || '').trim();
      const simplePhoneRegex = /^[+]?[- 0-9()]{7,}$/;
      if (!phone || !simplePhoneRegex.test(phone)) {
        errors.gracePeriodRedirectPhone = 'Introduzca un teléfono válido (validación simple)';
      }
    }
  }
  return errors;
}

export function validateCallRedirection(params: {
  enable: boolean;
  phone?: string;
  schedule?: SimplifiedSchedule;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!params.enable) return errors;

  // schedule
  const schedError = validateSchedules(params.schedule);
  if (schedError) errors.callRedirectionSchedule = schedError;

  // phone
  const phone = (params.phone || '').trim();
  const simplePhoneRegex = /^[+]?[- 0-9()]{7,}$/;
  if (!phone || !simplePhoneRegex.test(phone)) {
    errors.callRedirectionPhone = 'Introduzca un teléfono válido (validación simple)';
  }
  return errors;
}
