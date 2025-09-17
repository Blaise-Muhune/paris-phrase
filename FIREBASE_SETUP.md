# Firebase Authentication Setup Guide

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "text-humanizer")
4. Enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Click on "Google" provider
5. Toggle "Enable"
6. Add your project's support email
7. Click "Save"

## 3. Get Firebase Configuration

1. Go to Project Settings (gear icon) in the left sidebar
2. Scroll down to "Your apps" section
3. Click "Web" icon to add a web app
4. Register your app with a nickname (e.g., "Text Humanizer Web")
5. Copy the Firebase configuration object

## 4. Add Environment Variables

Create or update your `.env.local` file with the following variables:

```env
# Your existing OpenAI API key
OPENAI_API_KEY=your_openai_api_key_here

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

Replace the placeholder values with your actual Firebase configuration values.

## 5. Configure Authorized Domains (Optional)

For production deployment:

1. In Firebase Console, go to Authentication > Settings
2. Add your domain to "Authorized domains"
3. For local development, `localhost` is already included

## 6. Test the Setup

1. Start your development server: `npm run dev`
2. Open your app in the browser
3. Click "Sign in with Google"
4. Complete the Google sign-in flow
5. You should see your profile picture and name in the header

## Features Added

✅ **Google Authentication**: Users can sign in with their Google accounts
✅ **Protected API Routes**: Humanization and critique features require authentication
✅ **User Profile Display**: Shows user's profile picture and name
✅ **Secure Logout**: Users can sign out safely
✅ **Authentication State Management**: Real-time auth state updates

## Security Benefits

- **API Protection**: All AI features are now protected and require authentication
- **User Tracking**: You can track usage per user (if needed for analytics)
- **Rate Limiting**: Easier to implement per-user rate limiting
- **Data Privacy**: Users' data is tied to their authenticated sessions

## Next Steps (Optional)

You can extend this further by:
- Adding user preferences storage
- Implementing usage tracking
- Adding user-specific style samples storage
- Creating user dashboards
- Implementing premium features

## Troubleshooting

**Common Issues:**

1. **"Firebase not initialized"**: Check that all environment variables are set correctly
2. **"Google sign-in not working"**: Ensure Google provider is enabled in Firebase Console
3. **"Authentication required" error**: Make sure you're signed in before using features

**Debug Mode:**
- Check browser console for Firebase errors
- Verify environment variables are loaded (check Network tab)
- Ensure Firebase project has proper permissions set up
