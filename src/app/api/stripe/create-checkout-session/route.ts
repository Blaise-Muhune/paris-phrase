import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { createCheckoutSession, createStripeCustomer } from '@/lib/stripe';
import { getUserCredits } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, mode, planId } = await request.json();

    if (!priceId || !mode || !planId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Get user credits to check if they have a Stripe customer ID
    const userCredits = await getUserCredits(user.uid);
    let customerId = userCredits?.subscription?.stripeCustomerId;

    // Create Stripe customer if they don't have one
    if (!customerId) {
      customerId = await createStripeCustomer(user.email!, user.displayName || 'User');
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/payment/cancel`;

    const checkoutUrl = await createCheckoutSession(
      customerId,
      priceId,
      mode as 'payment' | 'subscription',
      successUrl,
      cancelUrl,
      {
        userId: user.uid,
        planId,
        userEmail: user.email!,
      }
    );

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
