import { useEffect, useMemo, useState } from 'react';
import { Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const CHECKOUT_ENDPOINT = (import.meta.env.VITE_CHECKOUT_ENDPOINT as string) || 'http://localhost:8787/createCheckout'; // base URL of Lambda (local default)

function mapStripeStatusToApp(status?: string): 'none' | 'active' | 'past_due' | 'canceled' {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
    case 'incomplete':
    case 'incomplete_expired':
    case 'unpaid':
      return 'past_due';
    case 'canceled':
      return 'canceled';
    default:
      return 'none';
  }
}

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const sessionId = useMemo(() => searchParams.get('session_id') || searchParams.get('sessionId'), [searchParams]);

  useEffect(() => {
    const run = async () => {
      try {
        if (!CHECKOUT_ENDPOINT) throw new Error('VITE_CHECKOUT_ENDPOINT no está configurado');
        if (!sessionId) throw new Error('Falta session_id en la URL');

        // 1) Confirmar la sesión en el backend
        const res = await fetch(`${CHECKOUT_ENDPOINT.replace(/\/$/, '')}/confirm?session_id=${encodeURIComponent(sessionId)}`, {
          method: 'GET',
        });
        if (!res.ok) throw new Error(`Error confirmando el pago: ${await res.text()}`);
        const data: {
          session: { id: string; status: string | null; payment_status: string | null };
          subscription: { id: string; status: string; current_period_end?: number } | null;
          customer: { id: string; email?: string | null } | null;
        } = await res.json();

        // 2) Determinar estados/ids a guardar
        const appStatus = mapStripeStatusToApp(data.subscription?.status);
        const stripeCustomerId = data.customer?.id;
        const stripeSubscriptionId = data.subscription?.id;

        // 3) Actualizar el RestaurantConfig del usuario
        const client = generateClient<Schema>();
        // Listar configs del usuario autenticado (regla owner); escoger la primera
        const { data: configs } = await client.models.RestaurantConfig.list({
          selectionSet: ['id'],
        });

        if (configs.length === 0) {
          // Si no existe, crear una con valores base + campos de suscripción
          await client.models.RestaurantConfig.create({
            salonTables: 0,
            salonCapacity: 0,
            highTables: 0,
            highTablesCapacity: 0,
            terraceTables: 0,
            terraceCapacity: 0,
            barSeats: 0,
            requiresDeposit: false,
            askReservationReason: false,
            askAllergies: false,
            askFoodType: false,
            subscriptionStatus: appStatus,
            stripeCustomerId: stripeCustomerId ?? null,
            stripeSubscriptionId: stripeSubscriptionId ?? null,
          });
        } else {
          const cfg = configs[0];
          await client.models.RestaurantConfig.update({
            id: cfg.id,
            subscriptionStatus: appStatus,
            stripeCustomerId: stripeCustomerId ?? null,
            stripeSubscriptionId: stripeSubscriptionId ?? null,
          });
        }

        setDone(true);
      } catch (e: unknown) {
        console.error(e);
        const msg = typeof e === 'object' && e !== null && 'message' in e ? String((e as { message?: unknown }).message) : 'Error desconocido al procesar el pago';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [sessionId]);

  const goHome = () => navigate('/');

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Paper sx={{ p: 4, maxWidth: 560, width: '100%' }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {done ? '¡Pago completado!' : 'Confirmando pago...'}
        </Typography>

        {loading && (
          <Typography variant="body1" color="text.secondary" gutterBottom>
            <CircularProgress size={18} sx={{ mr: 1 }} /> Procesando
          </Typography>
        )}

        {!loading && error && (
          <Typography variant="body2" color="error" gutterBottom>
            {error}
          </Typography>
        )}

        {!loading && !error && done && (
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Tu suscripción ha sido activada correctamente. Ya puedes acceder al panel.
          </Typography>
        )}

        <Box sx={{ mt: 2 }}>
          <Button variant="contained" onClick={goHome} disabled={loading}>
            Ir al panel
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default PaymentSuccess;
