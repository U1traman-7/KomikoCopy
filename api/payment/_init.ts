import { Stripe } from 'stripe';
const STRIPE_API_KEY = process.env.STRIPE_API_KEY!;

export const createStripe = () => new Stripe(STRIPE_API_KEY);

