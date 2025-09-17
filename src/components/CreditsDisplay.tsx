'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface CreditsData {
  credits: number;
  freeCreditsUsed: number;
  freeCreditsRemaining: number;
  lastFreeCreditReset: string;
  customOpenAIKey: boolean;
  subscription?: {
    status: string;
    plan: string;
    creditsPerMonth: number;
    currentPeriodEnd: string;
    stripeSubscriptionId: string;
  };
}

interface CreditsDisplayProps {
  onOpenPaymentModal: () => void;
}

export default function CreditsDisplay({ onOpenPaymentModal }: CreditsDisplayProps) {
  const { user } = useAuth();
  const [credits, setCredits] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/user/credits', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCredits(data);
      } else {
        console.error('Failed to fetch credits:', response.status);
        setCredits(null);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
      setCredits(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCredits();
    }
  }, [user, fetchCredits]);

  if (!user || loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!credits) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
        <p className="text-gray-500 dark:text-gray-400">Failed to load credits</p>
      </div>
    );
  }

  const nextFreeCreditReset = new Date(credits.lastFreeCreditReset);
  nextFreeCreditReset.setDate(nextFreeCreditReset.getDate() + 7);

  const totalCredits = credits?.customOpenAIKey ? '∞' : ((credits?.credits || 0) + (credits?.freeCreditsRemaining || 0));

  return (
    <button
      onClick={onOpenPaymentModal}
      className="text-white font-semibold text-lg hover:text-blue-200 transition-colors duration-200"
      title="View credits and subscription details"
    >
      {totalCredits} credits
    </button>
  );
}
