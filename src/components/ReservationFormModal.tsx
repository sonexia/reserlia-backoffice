import { useState, FormEvent, useEffect } from "react";
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  Box, 
  Alert,
  CircularProgress,
  Typography
} from '@mui/material';
import { Save, Cancel, AddCircleOutline, EditOutlined } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import type { Schema } from "../../amplify/data/resource";

export interface ReservationFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (input: Partial<Schema["Reservation"]["type"]>) => void;
  reservation?: Schema["Reservation"]["type"] | null;
}

// Configurar dayjs en español
dayjs.locale('es');

export default function ReservationFormModal({
  open,
  onClose,
  onSave,
  reservation,
}: ReservationFormModalProps) {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(
    reservation?.datetime ? dayjs(reservation.datetime) : dayjs()
  );

  const [customerName, setCustomerName] = useState(reservation?.customerName || "");
  const [phoneNumber, setPhoneNumber] = useState(reservation?.phoneNumber || "");
  const [partySize, setPartySize] = useState<number>(
    reservation?.partySize || 2
  );
  const [tableNumber, setTableNumber] = useState(reservation?.tableNumber || "");
  const [location, setLocation] = useState(reservation?.location || "");
  const [notes, setNotes] = useState(reservation?.notes || "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  // Initialize form when reservation changes
  useEffect(() => {
    if (reservation) {
      setSelectedDate(dayjs(reservation.datetime));
      setCustomerName(reservation.customerName ?? "");
      setPhoneNumber(reservation.phoneNumber ?? "");
      setPartySize(reservation.partySize ?? 1);
      setTableNumber(reservation.tableNumber ?? "");
      setLocation(reservation.location ?? "");
      setNotes(reservation.notes ?? "");
    } else {
      setSelectedDate(dayjs());
      setCustomerName("");
      setPhoneNumber("");
      setPartySize(1);
      setTableNumber("");
      setLocation("");
      setNotes("");
    }
    setError(null);
  }, [reservation, open]);

  if (!open) return null;

  const handleSave = async () => {
    // Basic validation
    if (!selectedDate || !customerName || !partySize) {
      setError("Por favor completa los campos obligatorios.");
      return;
    }
    
    try {
      setLoading(true);
      // Convertir a formato ISO8601 completo (lo que espera AWS AppSync/DynamoDB)
      const isoDateTime = selectedDate.toISOString();
      await onSave({ datetime: isoDateTime, customerName, phoneNumber, partySize, tableNumber, location, notes });
      onClose();
    } catch (err) {
      console.error("Error al formatear la fecha:", err);
      setError("Formato de fecha incorrecto. Por favor verifica.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    handleSave();
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="sm" 
        fullWidth
        fullScreen={false} // Prevent fullscreen on mobile for better UX
        PaperProps={{
          sx: { 
            borderRadius: { xs: 0, sm: 2 }, // No border radius on mobile
            margin: { xs: 1, sm: 2 }, // Reduced margin on mobile
            width: { xs: 'calc(100% - 16px)', sm: 'auto' }, // Full width with small margins on mobile
            maxHeight: { xs: 'calc(100vh - 32px)', sm: '90vh' } // Constrain height on mobile
          }
        }}
      >
        <DialogTitle sx={{ pb: { xs: 1, sm: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {reservation ? <EditOutlined color="primary" /> : <AddCircleOutline color="primary" />}
            <Typography sx={{ 
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              fontWeight: 600 
            }}>
              {reservation ? "Editar reserva" : "Nueva reserva"}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 2 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ pt: 1 }}>
            <Box sx={{ mb: 3 }}>
              <DateTimePicker
                label="Fecha y hora *"
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                format="DD/MM/YYYY HH:mm"
                ampm={false}
                minutesStep={15}
                shouldDisableTime={(value, view) => {
                  if (view === 'minutes') {
                    const minutes = value.minute();
                    return ![0, 15, 30, 45].includes(minutes);
                  }
                  return false;
                }}
                views={['year', 'month', 'day', 'hours', 'minutes']}
                closeOnSelect={true}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    variant: "outlined",
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        }
                      }
                    }
                  },
                  actionBar: {
                    actions: ['accept', 'cancel', 'clear']
                  },
                  layout: {
                    sx: {
                      '& .MuiPickersLayout-actionBar': {
                        '& .MuiButton-root': {
                          borderRadius: 2
                        }
                      }
                    }
                  },
                  digitalClockSectionItem: {
                    sx: {
                      backgroundColor: 'white !important',
                      color: 'text.primary !important',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 201, 167, 0.1) !important',
                        color: 'rgb(0, 161, 134) !important',
                        fontWeight: 500
                      },
                      '&.Mui-selected, &[aria-selected="true"]': {
                        backgroundColor: 'rgb(0, 201, 167) !important',
                        color: 'white !important',
                        fontWeight: 600,
                        '&:hover': {
                          backgroundColor: 'rgb(0, 161, 134) !important',
                          color: 'white !important'
                        }
                      }
                    }
                  },
                  popper: {
                    sx: {
                      '& .MuiPaper-root': {
                        backgroundColor: 'white',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                        border: '1px solid #e5e7eb',
                        '& .MuiMultiSectionDigitalClock-root': {
                          backgroundColor: 'white !important',
                          '& .MuiList-root': {
                            backgroundColor: 'white !important',
                            '& .MuiMenuItem-root': {
                              backgroundColor: 'white !important',
                              color: 'rgb(31, 41, 55) !important',
                              '&:hover': {
                                backgroundColor: 'rgba(0, 201, 167, 0.1) !important',
                                color: 'rgb(0, 161, 134) !important'
                              },
                              '&.Mui-selected, &[aria-selected="true"]': {
                                backgroundColor: 'rgb(0, 201, 167) !important',
                                color: 'white !important',
                                '&:hover': {
                                  backgroundColor: 'rgb(0, 161, 134) !important',
                                  color: 'white !important'
                                }
                              },
                              // Ocultar minutos no disponibles (elementos deshabilitados)
                              '&.Mui-disabled': {
                                display: 'none !important'
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }}
              />
            </Box>
            
            <TextField
              fullWidth
              label="Nombre del cliente"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              variant="outlined"
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label="Teléfono"
              placeholder="Ej: +34 600 123 456"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              variant="outlined"
              sx={{ mb: 3 }}
            />
            
            <TextField
              fullWidth
              label="Número de personas"
              type="number"
              value={partySize}
              onChange={(e) => setPartySize(parseInt(e.target.value) || 1)}
              required
              variant="outlined"
              inputProps={{ min: 1 }}
              sx={{ mb: 3 }}
            />
            
            <TextField
              fullWidth
              label="Mesa asignada"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              variant="outlined"
              sx={{ mb: 3 }}
            />
            
            <TextField
              fullWidth
              label="Ubicación (salón, terraza, barra, etc.)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              variant="outlined"
              sx={{ mb: 3 }}
            />
            
            <TextField
              fullWidth
              label="Observaciones"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              variant="outlined"
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          px: { xs: 2, sm: 3 }, 
          pb: { xs: 2, sm: 3 },
          pt: { xs: 1, sm: 2 },
          gap: { xs: 1.5, sm: 1 },
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <Button
            onClick={handleCancel}
            startIcon={<Cancel />}
            disabled={loading}
            variant="outlined"
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              minWidth: { sm: 120 }
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
            disabled={loading}
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              minWidth: { sm: 140 }
            }}
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
