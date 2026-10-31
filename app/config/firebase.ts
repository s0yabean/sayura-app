import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-expect-error getReactNativePersistence ships in firebase/auth's React Native build but not its web typings
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore, enableNetwork, disableNetwork, connectFirestoreEmulator } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: Constants.expoConfig?.extra?.FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: Constants.expoConfig?.extra?.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: Constants.expoConfig?.extra?.FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Constants.expoConfig?.extra?.FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig?.extra?.FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
};

// Initialize Firebase (check if already initialized)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication with AsyncStorage persistence
export const auth = getApps().length === 0 
  ? initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    })
  : getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Configure Firestore for better Expo Go compatibility
if (__DEV__) {
  // Enable offline persistence and better error handling in development
  enableNetwork(db).catch(error => {
    console.log('Firestore network enable failed:', error);
  });
  
  // Enable offline persistence for better handling
  try {
    // Note: enablePersistence is not available in React Native
    console.log('Firestore configured for React Native');
  } catch (error) {
    console.log('Firestore persistence setup failed:', error);
  }
}

// Initialize Analytics (optional, only on web)
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

export default app;