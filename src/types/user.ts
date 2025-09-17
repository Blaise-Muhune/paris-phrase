export interface UsageHistory {
  date: Date;
  creditsUsed: number;
  type: 'humanize' | 'critique';
}

export interface UserCredits {
  userId: string;
  credits: number;
  lastFreeCreditReset: Date;
  freeCreditsUsed: number;
  customOpenAIKey?: string;
  subscription?: {
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    status: 'active' | 'canceled' | 'past_due' | 'unpaid';
    plan: 'basic' | 'premium';
    creditsPerMonth: number;
    creditsUsed: number;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  };
  usageHistory: UsageHistory[];
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  stripePriceId: string;
  popular?: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  creditsPerMonth: number;
  price: number;
  stripePriceId: string;
  features: string[];
  popular?: boolean;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 10,
    price: 5,
    stripePriceId: 'price_1S7mWUCglJSxh88XhuTNUx9c',
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    credits: 50,
    price: 20,
    stripePriceId: 'price_1S7mWVCglJSxh88XvPcwyszU',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    credits: 150,
    price: 50,
    stripePriceId: 'price_1S7mWVCglJSxh88XUellrVN7',
  },
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic Plan',
    creditsPerMonth: 100,
    price: 15,
    stripePriceId: 'price_1S7mWWCglJSxh88XiFtK6TtE',
    features: ['100 credits per month', 'All writing modes', 'Basic support'],
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    creditsPerMonth: 500,
    price: 45,
    stripePriceId: 'price_1S7mWWCglJSxh88X8p2oULb1',
    features: ['500 credits per month', 'All writing modes', 'Priority support', 'Advanced features'],
    popular: true,
  },
];
