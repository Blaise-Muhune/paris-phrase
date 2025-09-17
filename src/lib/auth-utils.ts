import { auth } from './firebase';
import { adminAuth } from './firebase-admin';
import { User } from 'firebase/auth';

export async function getCurrentUser(request?: Request): Promise<User | null> {
  // For server-side API routes, verify the ID token from headers
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name,
        photoURL: decodedToken.picture,
      } as User;
    } catch (error) {
      console.error('Error verifying ID token:', error);
      return null;
    }
  }
  
  // For client-side usage
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

export async function getIdToken(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  
  try {
    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
}
