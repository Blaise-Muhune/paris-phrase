# Environment Variables Setup Guide

## Quick Setup

I've created your `.env.local` file with the Firebase configuration template. Now you need to replace the placeholder values with your actual Firebase project credentials.

## Step 1: Get Firebase Configuration

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project** (or create a new one if you haven't already)
3. **Click the gear icon** (Project Settings) in the left sidebar
4. **Scroll down** to the "Your apps" section
5. **Click the Web icon** (`</>`) to add a web app
6. **Register your app** with a nickname (e.g., "Text Humanizer")
7. **Copy the configuration object** that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};
```

## Step 2: Update Your .env.local File

Open your `.env.local` file and replace the placeholder values:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_actual_openai_api_key_here

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcdef
```

## Step 3: Enable Google Authentication

1. **In Firebase Console**, go to "Authentication" in the left sidebar
2. **Click "Get started"**
3. **Go to the "Sign-in method" tab**
4. **Click on "Google" provider**
5. **Toggle "Enable"**
6. **Add your project's support email**
7. **Click "Save"**

## Step 4: Test the Setup

1. **Start your development server**: `npm run dev`
2. **Open your app** in the browser
3. **Click "Sign in with Google"**
4. **Complete the sign-in flow**
5. **Verify you see your profile picture and name**

## Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key for AI features | `sk-...` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Your Firebase auth domain | `project-id.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Your Firebase project ID | `your-project-id` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `project-id.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | `123456789012` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | `1:123456789012:web:...` |

## Security Notes

- **Never commit** `.env.local` to version control
- **The `NEXT_PUBLIC_` prefix** makes these variables available in the browser
- **These are safe to expose** as they're meant for client-side Firebase configuration
- **Keep your OpenAI API key private** - it's not prefixed with `NEXT_PUBLIC_`

## Troubleshooting

### Common Issues:

1. **"Firebase not initialized"**
   - Check that all environment variables are set correctly
   - Restart your development server after updating `.env.local`

2. **"Google sign-in not working"**
   - Ensure Google provider is enabled in Firebase Console
   - Check that your domain is authorized (localhost is included by default)

3. **"Authentication required" error**
   - Make sure you're signed in before using AI features
   - Check browser console for any Firebase errors

### Debug Steps:

1. **Check environment variables**: Open browser dev tools → Network tab → look for any failed requests
2. **Verify Firebase config**: Check browser console for Firebase initialization errors
3. **Test authentication**: Try signing in and out to verify the flow works

## Production Deployment

For production deployment, you'll need to:

1. **Add your production domain** to Firebase authorized domains
2. **Set environment variables** in your hosting platform (Vercel, Netlify, etc.)
3. **Update Firebase security rules** if needed

Your environment is now ready for Firebase authentication! 🚀
