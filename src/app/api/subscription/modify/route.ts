import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { stripe } from '@/lib/stripe';
import { SUBSCRIPTION_PLANS } from '@/types/user';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscriptionId, newPlanId, newPriceId } = await request.json();

    if (!subscriptionId || !newPlanId || !newPriceId) {
      return NextResponse.json({ 
        error: 'Subscription ID, new plan ID, and new price ID are required' 
      }, { status: 400 });
    }

    // Find the new plan configuration
    const newPlan = SUBSCRIPTION_PLANS.find(p => p.id === newPlanId);
    if (!newPlan) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // Get the current subscription from Stripe
    const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    if (!currentSubscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Update the subscription with the new price
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: currentSubscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'always_invoice', // Prorate the charges
    });

    return NextResponse.json({
      message: 'Subscription updated successfully',
      subscription: updatedSubscription,
      newPlan: newPlan,
    });

  } catch (error) {
    console.error('Error modifying subscription:', error);
    return NextResponse.json({ 
      error: 'Failed to modify subscription' 
    }, { status: 500 });
  }
}
