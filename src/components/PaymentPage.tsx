import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Paper, Typography } from '@mui/material';

// Frontend needs publishable key to use redirectToCheckout if we choose to, but here we will rely on session.url redirect.
// If you prefer to use redirectToCheckout, set VITE_STRIPE_PUBLISHABLE_KEY and uncomment relevant lines.

const CHECKOUT_ENDPOINT = (import.meta.env.VITE_CHECKOUT_ENDPOINT as string) || 'http://localhost:8787/createCheckout'; // local default

const PaymentPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!CHECKOUT_ENDPOINT) {
        setError('Falta configurar VITE_CHECKOUT_ENDPOINT');
        setLoading(false);
        return;
      }

      const res = await fetch(`${CHECKOUT_ENDPOINT.replace(/\/$/, '')}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Error al iniciar pago: ${t}`);
      }

      const data: { url?: string; id?: string } = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error('Respuesta inesperada del backend');
    } catch (e: unknown) {
      console.error(e);
      const msg = typeof e === 'object' && e !== null && 'message' in e ? String((e as { message?: unknown }).message) : 'Error desconocido';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // opcional: auto-iniciar
    // startCheckout();
  }, []);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Paper sx={{ p: 4, maxWidth: 520, width: '100%' }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Activar suscripción
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Para acceder a la plataforma, completa el pago de la suscripción. Se cobrará un setup fee solo el primer mes.
        </Typography>
        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
        <Button variant="contained" onClick={startCheckout} disabled={loading} sx={{ mt: 2 }}>
          {loading ? (<><CircularProgress size={18} sx={{ mr: 1 }} /> Redirigiendo...</>) : 'Proceder al pago'}
        </Button>
      </Paper>
    </Box>
  );
};

export default PaymentPage;
