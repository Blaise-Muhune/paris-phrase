# Payment System Documentation

## Overview

The application now includes a comprehensive paywall system with Stripe integration, credit-based usage, and the option for users to use their own OpenAI API keys for unlimited usage.

## Features

### 🎯 Credit System
- **Weekly Free Credits**: Users get 1 free credit every 7 days
- **Paid Credits**: Users can purchase credit packs (10, 50, 150 credits)
- **Monthly Subscriptions**: Users can subscribe for monthly credit allocations (100 or 500 credits)
- **Custom API Key**: Users can add their own OpenAI API key for unlimited usage

### 💳 Payment Integration
- **Stripe Checkout**: Secure payment processing
- **Credit Packs**: One-time purchases for immediate credits
- **Subscriptions**: Monthly recurring billing with automatic credit allocation
- **Webhook Handling**: Automatic credit distribution and subscription management

### 🔐 Security Features
- **API Key Validation**: Custom OpenAI keys are validated before storage
- **Secure Storage**: API keys are stored securely in Firebase
- **Usage Tracking**: Complete audit trail of credit usage

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env.local` file:

```env
# Firebase Admin Configuration (Server-side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe dashboard
3. Create the following products and prices:

#### Credit Packages
- **Starter Pack**: 10 credits for $5 (price_starter_pack)
- **Popular Pack**: 50 credits for $20 (price_popular_pack)
- **Pro Pack**: 150 credits for $50 (price_pro_pack)

#### Subscription Plans
- **Basic Plan**: 100 credits/month for $15 (price_basic_monthly)
- **Premium Plan**: 500 credits/month for $45 (price_premium_monthly)

### 3. Firebase Admin Setup

1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Extract the following values and add them to your `.env.local`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the quotes and newlines)

### 4. Stripe Webhook Setup

1. Create a webhook endpoint in your Stripe dashboard
2. Point it to: `https://yourdomain.com/api/stripe/webhook`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook secret to your environment variables

### 5. Firebase Setup

The system automatically creates the following Firestore collections:

- `userCredits`: Stores user credit information, subscriptions, and usage history
- `users`: Standard Firebase Auth user data

## Usage Flow

### For New Users
1. User signs in with Google
2. Gets 1 free credit automatically
3. Can use the app once for free
4. After using free credit, must purchase credits or subscribe

### For Credit Purchases
1. User clicks "Credits" button in header
2. Selects credit pack or subscription
3. Redirected to Stripe Checkout
4. After payment, credits are automatically added
5. User can continue using the app

### For Custom API Keys
1. User clicks "API Key" button in header
2. Enters their OpenAI API key
3. Key is validated with OpenAI
4. User gets unlimited usage
5. Can remove key anytime to return to credit system

## API Endpoints

### Credit Management
- `GET /api/user/credits` - Get user credit information
- `POST /api/user/update-openai-key` - Add/update custom OpenAI key
- `DELETE /api/user/update-openai-key` - Remove custom OpenAI key

### Payment Processing
- `POST /api/stripe/create-checkout-session` - Create Stripe checkout session
- `POST /api/stripe/webhook` - Handle Stripe webhooks

### Text Processing (Updated)
- `POST /api/humanize` - Humanize text (now includes credit checking)
- `POST /api/critique` - Critique text (now includes credit checking)

## Credit Usage Rules

### Free Credits
- 1 free credit per week
- Resets every 7 days from first use
- Cannot accumulate free credits

### Paid Credits
- Purchased credits never expire
- Used for both humanization and critique features
- 1 credit = 1 API call

### Custom API Keys
- Unlimited usage
- No credit consumption
- User pays OpenAI directly
- Can be added/removed anytime

### Subscriptions
- Monthly recurring billing
- Credits reset monthly
- Unused credits don't roll over
- Can be canceled anytime

## Error Handling

### Insufficient Credits
- Returns HTTP 402 (Payment Required)
- Shows payment modal automatically
- User can purchase credits or add API key

### Invalid API Key
- Validates with OpenAI before storing
- Shows clear error messages
- Prevents invalid keys from being stored

### Payment Failures
- Handled by Stripe webhooks
- Subscription status updated automatically
- User notified of payment issues

## Security Considerations

### API Key Storage
- Keys are stored securely in Firebase
- Only used for user's own requests
- Can be removed by user anytime

### Payment Security
- All payments processed by Stripe
- No credit card data stored locally
- PCI compliant payment handling

### Usage Tracking
- Complete audit trail of all usage
- Prevents credit fraud
- Enables usage analytics

## Testing

### Test Mode
- Use Stripe test keys for development
- Test cards: 4242 4242 4242 4242
- Test webhooks with Stripe CLI

### Credit System Testing
1. Create test user
2. Verify free credit allocation
3. Test credit purchase flow
4. Test subscription flow
5. Test custom API key flow

## Monitoring

### Key Metrics to Track
- Credit usage patterns
- Payment conversion rates
- API key adoption rate
- Subscription churn rate

### Stripe Dashboard
- Monitor payment success rates
- Track subscription metrics
- Handle failed payments
- Analyze revenue data

## Troubleshooting

### Common Issues
1. **Credits not updating**: Check webhook configuration
2. **Payment failures**: Verify Stripe keys and webhook secrets
3. **API key validation**: Ensure OpenAI API key is valid
4. **Free credit not resetting**: Check Firebase timestamp handling

### Support
- Check Stripe dashboard for payment issues
- Monitor Firebase logs for credit system issues
- Use browser dev tools for frontend debugging
