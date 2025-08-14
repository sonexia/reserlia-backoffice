import React from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  TextField,
  IconButton,
  Button,
  Alert
} from '@mui/material';
import { Add, Remove, AccessTime } from '@mui/icons-material';

// Tipos simplificados para horarios
export interface TimeRange {
  start: string;
  end: string;
}

export interface ScheduleGroup {
  enabled: boolean;
  ranges: TimeRange[];
}

export interface SimplifiedSchedule {
  weekdays: ScheduleGroup; // Lunes a Viernes
  saturday: ScheduleGroup; // Sábado
  sunday: ScheduleGroup;   // Domingo
  // Días individuales habilitados/deshabilitados
  enabledDays: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
}

interface SimplifiedScheduleConfigProps {
  title: string;
  description: string;
  schedule: SimplifiedSchedule;
  onChange: (schedule: SimplifiedSchedule) => void;
  error?: string;
}

const dayNames = {
  monday: 'Lunes',
  tuesday: 'Martes', 
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
};

const SimplifiedScheduleConfig: React.FC<SimplifiedScheduleConfigProps> = ({
  title,
  description,
  schedule,
  onChange,
  error
}) => {
  
  const updateScheduleGroup = (groupKey: 'weekdays' | 'saturday' | 'sunday', updates: Partial<ScheduleGroup>) => {
    const currentGroup = schedule[groupKey];
    
    // If enabling the group and it has no time ranges, add a default one
    const finalUpdates = updates.enabled === true && currentGroup.ranges.length === 0
      ? { ...updates, ranges: [{ start: '09:00', end: '22:00' }] }
      : updates;
    
    onChange({
      ...schedule,
      [groupKey]: {
        ...currentGroup,
        ...finalUpdates
      }
    });
  };

  const updateEnabledDay = (day: keyof SimplifiedSchedule['enabledDays'], enabled: boolean) => {
    onChange({
      ...schedule,
      enabledDays: {
        ...schedule.enabledDays,
        [day]: enabled
      }
    });
  };

  const addTimeRange = (groupKey: 'weekdays' | 'saturday' | 'sunday') => {
    const group = schedule[groupKey];
    updateScheduleGroup(groupKey, {
      ranges: [...group.ranges, { start: '09:00', end: '22:00' }]
    });
  };

  const removeTimeRange = (groupKey: 'weekdays' | 'saturday' | 'sunday', index: number) => {
    const group = schedule[groupKey];
    updateScheduleGroup(groupKey, {
      ranges: group.ranges.filter((_, i) => i !== index)
    });
  };

  const updateTimeRange = (
    groupKey: 'weekdays' | 'saturday' | 'sunday',
    index: number,
    field: 'start' | 'end',
    value: string
  ) => {
    const group = schedule[groupKey];
    const newRanges = [...group.ranges];
    newRanges[index] = { ...newRanges[index], [field]: value };
    updateScheduleGroup(groupKey, { ranges: newRanges });
  };

  // Helper function to generate dynamic weekday label
  const getWeekdayLabel = () => {
    const weekdayKeys: (keyof SimplifiedSchedule['enabledDays'])[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const enabledWeekdays = weekdayKeys.filter(day => schedule.enabledDays[day]);
    
    if (enabledWeekdays.length === 5) {
      return 'De lunes a viernes';
    } else if (enabledWeekdays.length === 0) {
      return 'Ningún día seleccionado';
    } else {
      const dayLabels = enabledWeekdays.map(day => dayNames[day]);
      if (dayLabels.length === 1) {
        return dayLabels[0];
      } else if (dayLabels.length === 2) {
        return dayLabels.join(' y ');
      } else {
        const lastDay = dayLabels.pop();
        return `${dayLabels.join(', ')} y ${lastDay}`;
      }
    }
  };

  const renderScheduleGroup = (
    groupKey: 'weekdays' | 'saturday' | 'sunday',
    groupTitle: string,
    groupSubtitle: string
  ) => {
    const group = schedule[groupKey];
    const isWeekdaysGroup = groupKey === 'weekdays';
    
    return (
      <Card key={groupKey} sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AccessTime sx={{ mr: 1, color: 'primary.main' }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6">
                {isWeekdaysGroup ? getWeekdayLabel() : groupTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {groupSubtitle}
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={group.enabled}
                  onChange={(e) => updateScheduleGroup(groupKey, { enabled: e.target.checked })}
                />
              }
              label="Activar"
            />
          </Box>

          {group.enabled && (
            <>
              {group.ranges.map((range, index) => (
                <Box key={index} sx={{ 
                  mb: 2, 
                  display: 'flex', 
                  gap: { xs: 1.5, sm: 2 }, 
                  alignItems: { xs: 'stretch', sm: 'center' },
                  flexDirection: { xs: 'column', sm: 'row' }
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: { xs: 1.5, sm: 2 }, 
                    flex: 1,
                    alignItems: 'center'
                  }}>
                    <TextField
                      type="time"
                      label="Desde"
                      value={range.start}
                      onChange={(e) => updateTimeRange(groupKey, index, 'start', e.target.value)}
                      sx={{ flex: 1 }}
                      inputProps={{ step: 300 }}
                    />
                    <TextField
                      type="time"
                      label="Hasta"
                      value={range.end}
                      onChange={(e) => updateTimeRange(groupKey, index, 'end', e.target.value)}
                      sx={{ flex: 1 }}
                      inputProps={{ step: 300 }}
                    />
                  </Box>
                  {group.ranges.length > 1 && (
                    <IconButton
                      onClick={() => removeTimeRange(groupKey, index)}
                      color="error"
                      size="small"
                      sx={{ 
                        alignSelf: { xs: 'center', sm: 'auto' },
                        mt: { xs: 0, sm: 0 }
                      }}
                    >
                      <Remove />
                    </IconButton>
                  )}
                </Box>
              ))}
              
              <Button
                onClick={() => addTimeRange(groupKey)}
                color="primary"
                startIcon={<Add />}
                size="small"
                sx={{ mt: 1 }}
              >
                Añadir horario
              </Button>

              {/* Individual weekday toggles for weekdays group only */}
              {isWeekdaysGroup && (
                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Días de semana individuales
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Puedes desactivar días específicos (ej: cerrado los lunes)
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: { xs: 0.5, sm: 1 },
                    flexDirection: { xs: 'column', sm: 'row' }
                  }}>
                    {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const).map((day) => (
                      <FormControlLabel
                        key={day}
                        control={
                          <Switch
                            checked={schedule.enabledDays[day]}
                            onChange={(e) => updateEnabledDay(day, e.target.checked)}
                            size="small"
                          />
                        }
                        label={dayNames[day]}
                        sx={{ 
                          m: 0, 
                          minWidth: { xs: '100%', sm: 'auto' },
                          width: { xs: '100%', sm: 'auto' }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  };



  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>{title}</strong><br />
          {description}
        </Typography>
      </Alert>

      {renderScheduleGroup('weekdays', 'Lunes a Viernes', 'Horarios para días laborables')}
      {renderScheduleGroup('saturday', 'Sábado', 'Horarios para el sábado')}
      {renderScheduleGroup('sunday', 'Domingo', 'Horarios para el domingo')}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default SimplifiedScheduleConfig;
