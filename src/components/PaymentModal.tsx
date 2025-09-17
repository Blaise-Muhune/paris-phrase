'use client';

import { useState, useEffect } from 'react';
import { CREDIT_PACKAGES, SUBSCRIPTION_PLANS } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';


interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'credits' | 'subscription'>('credits');
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState<CreditsData | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [modifying, setModifying] = useState(false);
  const [removingKey, setRemovingKey] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchCredits();
    }
  }, [isOpen, user]);

  const fetchCredits = async () => {
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
      setCreditsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!credits?.subscription?.stripeSubscriptionId) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to cancel your subscription? This action cannot be undone and no refunds will be processed.'
    );
    
    if (!confirmed) return;

    setCanceling(true);
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ 
          subscriptionId: credits.subscription.stripeSubscriptionId 
        })
      });

      if (response.ok) {
        onClose();
        router.push('/subscription/canceled');
      } else {
        alert('Failed to cancel subscription. Please try again.');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setCanceling(false);
    }
  };

  const handleSubscriptionModification = async (newPlanId: string, newPriceId: string) => {
    if (!credits?.subscription?.stripeSubscriptionId) return;
    
    setModifying(true);
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/subscription/modify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ 
          subscriptionId: credits.subscription.stripeSubscriptionId,
          newPlanId,
          newPriceId
        })
      });

      if (response.ok) {
        // Refresh credits to show updated subscription
        await fetchCredits();
        alert('Subscription updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to update subscription: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error modifying subscription:', error);
      alert('Failed to update subscription. Please try again.');
    } finally {
      setModifying(false);
    }
  };

  const handleRemoveAPIKey = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to remove your OpenAI API key? You will need to use credits for future requests.'
    );
    
    if (!confirmed) return;

    setRemovingKey(true);
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/user/update-openai-key', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        // Refresh credits to show updated status
        await fetchCredits();
        alert('OpenAI API key removed successfully! You can now use credits or add a new key.');
      } else {
        const errorData = await response.json();
        alert(`Failed to remove API key: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error removing API key:', error);
      alert('Failed to remove API key. Please try again.');
    } finally {
      setRemovingKey(false);
    }
  };

  const handleAddTestCredits = async () => {
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/test/add-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ credits: 10 })
      });
      
      if (response.ok) {
        await fetchCredits();
        alert('Added 10 test credits successfully!');
      } else {
        alert('Failed to add test credits. Please try again.');
      }
    } catch (error) {
      console.error('Error adding test credits:', error);
      alert('Failed to add test credits. Please try again.');
    }
  };

  const handlePurchase = async (priceId: string, mode: 'payment' | 'subscription', planId: string) => {
    setLoading(true);
    try {
      // Get the current user's ID token
      const { auth } = await import('@/lib/firebase');
      const user = auth.currentUser;
      
      if (!user) {
        alert('Please sign in to make a purchase');
        return;
      }
      
      const idToken = await user.getIdToken();
      
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          priceId,
          mode,
          planId,
        }),
      });

      const { checkoutUrl } = await response.json();
      
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to create checkout session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Get More Credits
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-6">
            <button
              onClick={() => setSelectedTab('credits')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
                selectedTab === 'credits'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Credit Packs
            </button>
            <button
              onClick={() => setSelectedTab('subscription')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
                selectedTab === 'subscription'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Monthly Plans
            </button>
          </div>

          {/* Credit Packages */}
          {selectedTab === 'credits' && (
            <div className="grid md:grid-cols-3 gap-4">
              {CREDIT_PACKAGES.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`relative p-6 rounded-lg border-2 transition-all duration-200 ${
                    pkg.popular
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {pkg.name}
                    </h3>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      ${pkg.price}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 mb-4">
                      {pkg.credits} credits
                    </div>
                    <button
                      onClick={() => handlePurchase(pkg.stripePriceId, 'payment', pkg.id)}
                      disabled={loading}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${
                        pkg.popular
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-600 hover:bg-gray-700 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {loading ? 'Processing...' : 'Purchase'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Subscription Plans */}
          {selectedTab === 'subscription' && (
            <div className="space-y-6">
              {/* Current Subscription Management */}
              {credits?.subscription && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Current Subscription
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">Plan:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {credits.subscription.plan.charAt(0).toUpperCase() + credits.subscription.plan.slice(1)} Plan
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">Status:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          credits.subscription.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {credits.subscription.status.charAt(0).toUpperCase() + credits.subscription.status.slice(1)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">Credits/Month:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {credits.subscription.creditsPerMonth}
                      </p>
                    </div>
                    {credits.subscription.status === 'active' && (
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">Renews:</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(credits.subscription.currentPeriodEnd).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Cancel Subscription Button */}
                  {credits.subscription.status === 'active' && (
                    <div className="pt-4 border-t border-blue-200 dark:border-blue-700">
                      <button
                        onClick={handleCancelSubscription}
                        disabled={canceling}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                      >
                        {canceling ? 'Canceling...' : 'Cancel Subscription'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Current Credits Display */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Your Credits
                </h3>
                {creditsLoading ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                ) : credits ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Total Credits:</span>
                      <span className="font-semibold text-gray-900 dark:text-white text-lg">
                        {credits.customOpenAIKey ? '∞' : ((credits.credits || 0) + (credits.freeCreditsRemaining || 0))} credits
                      </span>
                    </div>
                    
                    {!credits.customOpenAIKey && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Paid Credits:</span>
                          <span className="text-gray-900 dark:text-white">{credits.credits}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Free Credits:</span>
                          <span className="text-gray-900 dark:text-white">
                            {credits.freeCreditsRemaining}/1
                          </span>
                        </div>
                      </>
                    )}

                    {credits.customOpenAIKey && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-green-600 dark:text-green-400 text-sm">
                          Custom OpenAI Key - Unlimited Usage
                        </span>
                      </div>
                    )}

                    {/* Test Credits Button for Development */}
                    {!credits.customOpenAIKey && (
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                        <button
                          onClick={handleAddTestCredits}
                          className="w-full bg-green-100 hover:bg-green-200 dark:bg-green-800 dark:hover:bg-green-700 text-green-800 dark:text-green-100 text-sm font-medium py-2 rounded-lg transition-colors duration-200"
                        >
                          Add 10 Test Credits (Development)
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-red-500">Failed to load credits information</p>
                )}
              </div>

              {/* New Subscription Plans */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Available Plans
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const isCurrentPlan = credits?.subscription?.plan === plan.id;
                const isActive = credits?.subscription?.status === 'active' && isCurrentPlan;
                const isUpgrade = credits?.subscription?.plan === 'basic' && plan.id === 'premium';
                const isDowngrade = credits?.subscription?.plan === 'premium' && plan.id === 'basic';
                
                return (
                  <div
                    key={plan.id}
                    className={`relative p-6 rounded-lg border-2 transition-all duration-200 ${
                      isActive
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : plan.popular
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Current Plan
                        </span>
                      </div>
                    )}
                    {plan.popular && !isActive && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Most Popular
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {plan.name}
                      </h3>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        ${plan.price}
                        <span className="text-sm font-normal text-gray-600 dark:text-gray-400">/month</span>
                      </div>
                      <div className="text-gray-600 dark:text-gray-400 mb-4">
                        {plan.creditsPerMonth} credits per month
                      </div>
                      
                      <ul className="text-left text-sm text-gray-600 dark:text-gray-400 mb-6 space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      
                      {isActive ? (
                        <div className="w-full py-2 px-4 rounded-lg font-medium bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-600">
                          ✓ Active Plan
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (credits?.subscription) {
                              // Modify existing subscription
                              handleSubscriptionModification(plan.id, plan.stripePriceId);
                            } else {
                              // Create new subscription
                              handlePurchase(plan.stripePriceId, 'subscription', plan.id);
                            }
                          }}
                          disabled={loading || modifying}
                          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isUpgrade
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : isDowngrade
                              ? 'bg-orange-600 hover:bg-orange-700 text-white'
                              : plan.popular
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-gray-600 hover:bg-gray-700 text-white'
                          }`}
                        >
                          {modifying ? 'Processing...' : 
                           isUpgrade ? 'Upgrade' :
                           isDowngrade ? 'Downgrade' :
                           'Subscribe'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
                </div>
              </div>
            </div>
          )}

          {/* API Key Status Section */}
          {credits?.customOpenAIKey && (
            <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200">
                    🔑 Custom OpenAI API Key Active
                  </h3>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="text-sm text-green-700 dark:text-green-300">
                  <p className="mb-2">You&apos;re using your own OpenAI API key with unlimited usage:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>No credit limits or restrictions</li>
                    <li>Direct billing from OpenAI</li>
                    <li>Full control over your usage</li>
                    <li>Can still purchase credits as backup</li>
                  </ul>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      onClose();
                      // Trigger the OpenAI key modal from parent
                      window.dispatchEvent(new Event('openOpenAIKeyModal'));
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    Manage API Key
                  </button>
                  
                  <button
                    onClick={handleRemoveAPIKey}
                    disabled={removingKey}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    {removingKey ? 'Removing...' : 'Remove API Key'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Custom OpenAI Key Option (when no key is set) */}
          {!credits?.customOpenAIKey && (
            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                💡 Alternative: Use Your Own OpenAI API Key
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Already have an OpenAI API key? Use it for unlimited usage without purchasing credits.
              </p>
              <button
                onClick={() => {
                  onClose();
                  // Trigger the OpenAI key modal from parent
                  window.dispatchEvent(new Event('openOpenAIKeyModal'));
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Add API Key
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
