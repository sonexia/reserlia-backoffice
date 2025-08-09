import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { defineFunction } from '@aws-amplify/backend';

// Stripe checkout function (HTTP handler inside Lambda)
const createCheckout = defineFunction({
  name: 'createCheckout',
  entry: './functions/createCheckout/handler.ts',
  environment: {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
    STRIPE_SUBSCRIPTION_PRICE_ID: process.env.STRIPE_SUBSCRIPTION_PRICE_ID!,
    STRIPE_SETUP_FEE_PRICE_ID: process.env.STRIPE_SETUP_FEE_PRICE_ID || '',
    STRIPE_SUCCESS_URL: process.env.STRIPE_SUCCESS_URL!,
    STRIPE_CANCEL_URL: process.env.STRIPE_CANCEL_URL!,
  },
});

defineBackend({
  auth,
  data,
  createCheckout,
});
