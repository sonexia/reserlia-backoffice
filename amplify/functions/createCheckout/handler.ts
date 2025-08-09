import Stripe from 'stripe';

// Handler supports two operations:
// - POST /create: creates a Stripe Checkout Session (mode=subscription) with a one-time setup fee on first invoice
// - GET /confirm?session_id=...: fetches the Checkout Session and returns subscription + customer info

const stripeSecretKey = process.env.STRIPE_SECRET_KEY as string;
const subscriptionPriceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID as string; // recurring price
const setupFeePriceId = process.env.STRIPE_SETUP_FEE_PRICE_ID as string; // one-time price
const successUrl = process.env.STRIPE_SUCCESS_URL as string; // e.g. https://app.example.com/payment/success?session_id={CHECKOUT_SESSION_ID}
const cancelUrl = process.env.STRIPE_CANCEL_URL as string; // e.g. https://app.example.com/payment/cancel

if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

type JwtClaims = Record<string, string>;
type JwtAuthorizer = { jwt?: { claims?: JwtClaims } };

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const method = event.requestContext?.http?.method;
    const rawPath = event.requestContext?.http?.path;

    // CORS preflight: respond to OPTIONS with 204 and CORS headers
    if (method === 'OPTIONS') {
      return response(204, '');
    }

    if (method === 'POST' && rawPath?.endsWith('/create')) {
      const body = (parseJson<{ subscriptionPriceId?: string; setupFeePriceId?: string; email?: string }>(event.body) || {});

      const priceId = body.subscriptionPriceId || subscriptionPriceId;
      const setupPriceId = body.setupFeePriceId || setupFeePriceId;
      const claims = (event.requestContext as unknown as { authorizer?: JwtAuthorizer }).authorizer?.jwt?.claims;
      const customerEmail = body.email || claims?.email;
      const userSub = claims?.sub;

      if (!priceId) return response(400, { message: 'Missing subscription price id' });
      if (!successUrl || !cancelUrl) return response(500, { message: 'Missing success/cancel URLs in env' });

      // Create or reuse customer by email (optional)
      let customerId: string | undefined;
      if (customerEmail) {
        const existing = await stripe.customers.list({ email: customerEmail, limit: 1 });
        if (existing.data.length) customerId = existing.data[0].id;
      }

      if (!customerId) {
        const created = await stripe.customers.create({
          email: customerEmail,
          metadata: userSub ? { cognito_sub: String(userSub) } : undefined,
        });
        customerId = created.id;
      }

      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
        {
          price: priceId,
          quantity: 1,
        },
      ];
      if (setupPriceId) {
        lineItems.push({ price: setupPriceId, quantity: 1 });
      }

      const params: Stripe.Checkout.SessionCreateParams = {
        mode: 'subscription',
        customer: customerId,
        line_items: lineItems,
        subscription_data: {
          metadata: userSub ? { cognito_sub: String(userSub) } : undefined,
        },
        success_url: successUrl.replace('{CHECKOUT_SESSION_ID}', '{CHECKOUT_SESSION_ID}'),
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
      };

      const session = await stripe.checkout.sessions.create(params);
      return response(200, { url: session.url, id: session.id });
    }

    if (method === 'GET' && rawPath?.endsWith('/confirm')) {
      const qs = event.queryStringParameters ?? {};
      const sessionId = (qs as Record<string, string | undefined>).session_id || (qs as Record<string, string | undefined>).sessionId;
      if (!sessionId) return response(400, { message: 'Missing session_id' });

      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'customer'],
      });

      const sub = session.subscription as Stripe.Subscription | null;
      const cust = session.customer as Stripe.Customer | null;

      return response(200, {
        session: { id: session.id, status: session.status, payment_status: session.payment_status },
        subscription: sub
          ? { id: sub.id, status: sub.status, current_period_end: sub.current_period_end }
          : null,
        customer: cust ? { id: cust.id, email: cust.email ?? null } : null,
      });
    }

    return response(404, { message: 'Not found' });
  } catch (err: unknown) {
    console.error('Stripe handler error', err);
    const message = typeof err === 'object' && err !== null && 'message' in err ? String((err as { message?: unknown }).message) : String(err);
    return response(500, { message: 'Internal error', error: message });
  }
};

function parseJson<T = unknown>(x: unknown): T | undefined {
  try {
    return typeof x === 'string' ? JSON.parse(x) as T : (x as T | undefined);
  } catch {
    return undefined;
  }
}

function response(statusCode: number, body: unknown): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}
