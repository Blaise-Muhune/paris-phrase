import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { getUserCredits, checkFreeCreditEligibility } from '@/lib/firestore';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userCredits = await getUserCredits(user.uid);
    if (!userCredits) {
      return NextResponse.json(
        { error: 'Failed to load user credits' },
        { status: 500 }
      );
    }

    const freeCreditEligible = await checkFreeCreditEligibility(userCredits);

    return NextResponse.json({
      credits: userCredits.credits,
      freeCreditsUsed: userCredits.freeCreditsUsed,
      freeCreditsRemaining: freeCreditEligible ? 1 : 0,
      lastFreeCreditReset: userCredits.lastFreeCreditReset,
      customOpenAIKey: !!userCredits.customOpenAIKey,
      subscription: userCredits.subscription,
      usageHistory: userCredits.usageHistory.slice(-10) // Last 10 usage records
    });

  } catch (error) {
    console.error('Error getting user credits:', error);
    return NextResponse.json(
      { error: 'Failed to load credits' },
      { status: 500 }
    );
  }
}
