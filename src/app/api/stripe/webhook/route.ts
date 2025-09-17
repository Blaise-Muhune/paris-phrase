import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { addCredits, createSubscription } from '@/lib/firestore';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata;
  if (!metadata?.userId || !metadata?.planId) {
    console.error('Missing metadata in checkout session');
    return;
  }

  const { userId, planId } = metadata;

  if (session.mode === 'payment') {
    // One-time credit purchase
    const creditsToAdd = getCreditsFromPlanId(planId);
    if (creditsToAdd > 0) {
      await addCredits(userId, creditsToAdd);
    }
  } else if (session.mode === 'subscription' && session.subscription) {
    // Subscription creation
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    await createSubscription(userId, session.customer as string, subscription.id, planId as 'basic' | 'premium');
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // You might need to store customer ID to user ID mapping
  // For now, we'll handle this in the subscription management
  console.log('Subscription updated:', subscription.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  try {
    // Find user by customer ID and update subscription status
    const { collection, query, where, getDocs, updateDoc } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase');
    
    const creditsQuery = query(
      collection(db, 'userCredits'),
      where('subscription.stripeCustomerId', '==', customerId)
    );
    
    const querySnapshot = await getDocs(creditsQuery);
    
    for (const creditsDoc of querySnapshot.docs) {
      await updateDoc(creditsDoc.ref, {
        'subscription.status': 'canceled'
      });
      console.log(`Subscription canceled for user: ${creditsDoc.id}`);
    }
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Monthly subscription payment succeeded
  // Add monthly credits to user
  console.log('Invoice payment succeeded:', invoice.id);
  // You'll need to implement user credit addition based on subscription
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Update subscription status to past_due
  // You'll need to get userId from customerId
  console.log('Invoice payment failed:', invoice.id);
}

function getCreditsFromPlanId(planId: string): number {
  const creditPackages = {
    'starter': 10,
    'popular': 50,
    'pro': 150,
  };
  return creditPackages[planId as keyof typeof creditPackages] || 0;
}

// function getCreditsFromSubscriptionPlan(planId: string): number {
//   const subscriptionPlans = {
//     'basic': 100,
//     'premium': 500,
//   };
//   return subscriptionPlans[planId as keyof typeof subscriptionPlans] || 0;
// }
