import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  increment 
} from 'firebase/firestore';
import { db } from './firebase';
import { UserCredits, CREDIT_PACKAGES, SUBSCRIPTION_PLANS, UsageHistory } from '@/types/user';

const CREDITS_COLLECTION = 'userCredits';

export async function getUserCredits(userId: string): Promise<UserCredits | null> {
  try {
    const creditsDoc = await getDoc(doc(db, CREDITS_COLLECTION, userId));
    
    if (!creditsDoc.exists()) {
      // Initialize new user with default credits
      const newUserCredits: UserCredits = {
        userId,
        credits: 0,
        lastFreeCreditReset: new Date(),
        freeCreditsUsed: 0,
        usageHistory: []
      };
      
      await setDoc(doc(db, CREDITS_COLLECTION, userId), {
        ...newUserCredits,
        lastFreeCreditReset: serverTimestamp(),
      });
      
      return newUserCredits;
    }
    
    const data = creditsDoc.data();
    return {
      userId: data.userId,
      credits: data.credits || 0,
      lastFreeCreditReset: data.lastFreeCreditReset?.toDate() || new Date(),
      freeCreditsUsed: data.freeCreditsUsed || 0,
      customOpenAIKey: data.customOpenAIKey,
      subscription: data.subscription ? {
        ...data.subscription,
        currentPeriodStart: data.subscription.currentPeriodStart?.toDate() || new Date(),
        currentPeriodEnd: data.subscription.currentPeriodEnd?.toDate() || new Date(),
      } : undefined,
      usageHistory: data.usageHistory?.map((usage: UsageHistory) => ({
        ...usage,
        date: usage.date || new Date(),
      })) || []
    };
  } catch (error) {
    console.error('Error getting user credits:', error);
    return null;
  }
}

export async function resetFreeCredits(userId: string): Promise<void> {
  try {
    await updateDoc(doc(db, CREDITS_COLLECTION, userId), {
      lastFreeCreditReset: serverTimestamp(),
      freeCreditsUsed: 0,
    });
  } catch (error) {
    console.error('Error resetting free credits:', error);
  }
}

export async function checkFreeCreditEligibility(userCredits: UserCredits): Promise<boolean> {
  const now = new Date();
  const lastReset = userCredits.lastFreeCreditReset;
  const weekInMs = 7 * 24 * 60 * 60 * 1000;
  
  // Check if a week has passed since last reset
  if (now.getTime() - lastReset.getTime() >= weekInMs) {
    await resetFreeCredits(userCredits.userId);
    return true;
  }
  
  // Check if user has used their free credit this week
  return userCredits.freeCreditsUsed < 1;
}

export async function useCredit(
  userId: string, 
  type: 'humanize' | 'critique',
  useFreeCredit: boolean = false
): Promise<{ success: boolean; message: string; creditsRemaining: number }> {
  try {
    const userCredits = await getUserCredits(userId);
    if (!userCredits) {
      return { success: false, message: 'Failed to load user credits', creditsRemaining: 0 };
    }

    // Check if user has custom OpenAI key (unlimited usage)
    if (userCredits.customOpenAIKey) {
      // Just track usage for analytics
      await updateDoc(doc(db, CREDITS_COLLECTION, userId), {
        usageHistory: [...userCredits.usageHistory, {
          date: new Date(),
          creditsUsed: 0,
          type
        }]
      });
      return { success: true, message: 'Using custom API key', creditsRemaining: userCredits.credits };
    }

    // Check free credit eligibility first
    if (useFreeCredit) {
      const freeCreditEligible = await checkFreeCreditEligibility(userCredits);
      if (freeCreditEligible) {
        await updateDoc(doc(db, CREDITS_COLLECTION, userId), {
          freeCreditsUsed: increment(1),
          usageHistory: [...userCredits.usageHistory, {
            date: new Date(),
            creditsUsed: 0,
            type
          }]
        });
        return { success: true, message: 'Used free credit', creditsRemaining: userCredits.credits };
      }
    }

    // Check paid credits
    if (userCredits.credits <= 0) {
      return { success: false, message: 'No credits remaining. Please purchase more credits or subscribe.', creditsRemaining: 0 };
    }

    // Use paid credit
    await updateDoc(doc(db, CREDITS_COLLECTION, userId), {
      credits: increment(-1),
      usageHistory: [...userCredits.usageHistory, {
        date: new Date(),
        creditsUsed: 1,
        type
      }]
    });

    return { success: true, message: 'Credit used successfully', creditsRemaining: userCredits.credits - 1 };
  } catch (error) {
    console.error('Error using credit:', error);
    return { success: false, message: 'Failed to use credit', creditsRemaining: 0 };
  }
}

export async function addCredits(userId: string, credits: number): Promise<void> {
  try {
    await updateDoc(doc(db, CREDITS_COLLECTION, userId), {
      credits: increment(credits),
    });
  } catch (error) {
    console.error('Error adding credits:', error);
  }
}

export async function updateCustomOpenAIKey(userId: string, apiKey: string): Promise<void> {
  try {
    await updateDoc(doc(db, CREDITS_COLLECTION, userId), {
      customOpenAIKey: apiKey,
    });
  } catch (error) {
    console.error('Error updating OpenAI key:', error);
  }
}

export async function createSubscription(
  userId: string, 
  stripeCustomerId: string, 
  stripeSubscriptionId: string, 
  plan: 'basic' | 'premium'
): Promise<void> {
  try {
    const planData = SUBSCRIPTION_PLANS.find(p => p.id === plan);
    if (!planData) throw new Error('Invalid plan');
    
    await updateDoc(doc(db, CREDITS_COLLECTION, userId), {
      subscription: {
        stripeCustomerId,
        stripeSubscriptionId,
        status: 'active',
        plan,
        creditsPerMonth: planData.creditsPerMonth,
        creditsUsed: 0,
        currentPeriodStart: serverTimestamp(),
        currentPeriodEnd: serverTimestamp(),
      }
    });
    
    // Add monthly credits
    await addCredits(userId, planData.creditsPerMonth);
  } catch (error) {
    console.error('Error creating subscription:', error);
  }
}

export async function updateSubscriptionStatus(
  userId: string, 
  status: 'active' | 'canceled' | 'past_due' | 'unpaid'
): Promise<void> {
  try {
    await updateDoc(doc(db, CREDITS_COLLECTION, userId), {
      'subscription.status': status,
    });
  } catch (error) {
    console.error('Error updating subscription status:', error);
  }
}

export { CREDIT_PACKAGES, SUBSCRIPTION_PLANS };
