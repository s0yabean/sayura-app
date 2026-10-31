import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './config/firebase';
import { View, ActivityIndicator } from 'react-native';
import { initializeRevenueCat } from './config/revenuecat';
import { initializeUserData, warmUpFirestore } from './services/firestore';

export default function RootLayout() {
  useFrameworkReady();
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Initialize RevenueCat immediately when app starts
    initializeRevenueCat();
  }, []);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.email);
      setUser(user);
      
      if (user) {
        // Re-initialize RevenueCat with user ID when user logs in
        await initializeRevenueCat(user.uid);
        
        // Warm up Firestore connection after login
        warmUpFirestore();
        
        // Initialize user data with default affirmations immediately
        try {
          console.log('Initializing user data for:', user.uid);
          await initializeUserData();
          console.log('User data initialized successfully');
        } catch (error) {
          console.error('Error initializing user data:', error);
        }
      }
      
      setInitializing(false);
    });

    return unsubscribe;
  }, []);
  
  useEffect(() => {
    // Handle navigation after initialization
    if (!initializing) {
      if (!user) {
        // Start with onboarding flow (onboarding → paywall → login)
        router.replace('/onboarding');
      } else {
        // User is logged in - go to main app
        router.replace('/(tabs)');
      }
    }
  }, [initializing, user]);

  // Show loading while checking auth state
  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fef7ed' }}>
        <ActivityIndicator size="large" color="#ec4899" />
      </View>
    );
  }

  return (
    <>
      <Stack 
        screenOptions={{ headerShown: false }}
        initialRouteName="onboarding"
      >
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="paywall" />
        <Stack.Screen name="login-simple" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
