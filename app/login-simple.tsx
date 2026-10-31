import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, OAuthProvider, signInWithCredential, fetchSignInMethodsForEmail, linkWithCredential } from 'firebase/auth';
import { auth } from './config/firebase';
import Purchases from './config/revenuecat';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  useEffect(() => {
    // Configure Google Sign-In
    const configureGoogleSignIn = async () => {
      try {
        // Check if GoogleSignin is available (native module exists)
        if (!GoogleSignin) {
          console.log('Google Sign-In not available in this environment');
          return;
        }
        // const iosClientId = "";
        // const webClientId = "";
        const iosClientId = Constants.expoConfig?.extra?.GOOGLE_IOS_CLIENT_ID;
        const webClientId = Constants.expoConfig?.extra?.GOOGLE_WEB_CLIENT_ID;
        
        if (iosClientId) {
          await GoogleSignin.configure({
            iosClientId: iosClientId,
            webClientId: webClientId, // Still needed for some operations
          });
        } else {
          console.error('Google iOS Client ID is missing. Please set GOOGLE_IOS_CLIENT_ID environment variable.');
        }
      } catch (error) {
        console.log('Google Sign-In not available in this environment');
      }
    };

    configureGoogleSignIn();
  }, []);

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      
      // Check if device supports Google Play services (iOS always returns true for this)
      const hasPlayServices = await GoogleSignin.hasPlayServices();
      if (!hasPlayServices) {
        Alert.alert(
          'Google Sign-In Unavailable', 
          'Google Play Services not available. Please try again or use Test Login.'
        );
        return;
      }
      
      // Get user info from Google
      // Response shape changed across google-signin versions; read both defensively
      const userInfo: any = await GoogleSignin.signIn();
      console.log('Google userInfo:', userInfo);
      
      // Extract tokens - check different possible structures
      const idToken = userInfo.data?.idToken || userInfo.idToken;
      const accessToken = userInfo.data?.accessToken || userInfo.accessToken;
      
      console.log('Google tokens:', { idToken: !!idToken, accessToken: !!accessToken });
      
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }
      
      // Create Google credential for Firebase
      const googleCredential = GoogleAuthProvider.credential(idToken, accessToken);
      
      // Check if an account already exists with this email
      const userEmail = userInfo.data?.user?.email || userInfo.user?.email;
      if (userEmail) {
        try {
          const signInMethods = await fetchSignInMethodsForEmail(auth, userEmail);
          console.log('Existing sign-in methods for email:', signInMethods);
          
          // If email/password account exists, we need to sign in first then link
          if (signInMethods.includes('password')) {
            // For now, just sign in with the Google credential
            // The accounts will share the same email and Firebase will handle it
            console.log('Email account exists, signing in with Google credential');
          }
        } catch (error) {
          console.log('Error checking existing accounts:', error);
        }
      }
      
      // Sign in to Firebase with Google credential
      const userCredential = await signInWithCredential(auth, googleCredential);
      
      // Link RevenueCat purchase to this user
      try {
        await Purchases.logIn(userCredential.user.uid);
        console.log('RevenueCat user linked successfully');
      } catch (rcError) {
        console.error('RevenueCat linking failed:', rcError);
      }
      
      console.log('Google sign-in successful');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      // Don't show error alert if user cancelled
      if (error.code === 'SIGN_IN_CANCELLED' || 
          error.code === 'CANCELED' || 
          error.message?.includes('cancelled') ||
          error.message?.includes('canceled')) {
        console.log('User cancelled Google sign-in');
        return; // Exit silently
      }
      
      // Show error for actual failures
      Alert.alert('Google Sign-In Failed', error.message || 'Something went wrong');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Apple Sign-In
  const handleAppleSignIn = async () => {
    try {
      setAppleLoading(true);
      
      // Check if Apple Authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Apple Sign-In Not Available', 'Apple Sign-In is not available on this device');
        return;
      }

      // Request Apple authentication
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('Apple credential received:', {
        user: appleCredential.user,
        email: appleCredential.email,
        fullName: appleCredential.fullName,
        identityToken: !!appleCredential.identityToken,
        authorizationCode: !!appleCredential.authorizationCode
      });

      // Check if we have the required tokens
      if (!appleCredential.identityToken) {
        throw new Error('Apple Sign-In did not return an identity token');
      }

      // Create Firebase credential for Apple
      const provider = new OAuthProvider('apple.com');
      const firebaseCredential = provider.credential({
        idToken: appleCredential.identityToken,
        rawNonce: undefined // You can add nonce for additional security
      });

      // Check if an account already exists with this email
      if (appleCredential.email) {
        try {
          const signInMethods = await fetchSignInMethodsForEmail(auth, appleCredential.email);
          console.log('Existing sign-in methods for email:', signInMethods);
          
          // If email/password account exists, we'll just sign in with Apple
          // Firebase will handle the account linking automatically
          if (signInMethods.includes('password')) {
            console.log('Email account exists, signing in with Apple credential');
          }
        } catch (error) {
          console.log('Error checking existing accounts:', error);
        }
      }

      // Sign in to Firebase with Apple credential
      const userCredential = await signInWithCredential(auth, firebaseCredential);
      
      // Link RevenueCat purchase to this user
      try {
        await Purchases.logIn(userCredential.user.uid);
        console.log('RevenueCat user linked successfully');
      } catch (rcError) {
        console.error('RevenueCat linking failed:', rcError);
      }
      
      console.log('Apple sign-in successful:', userCredential.user.uid);
      router.replace('/(tabs)');
      
    } catch (error: any) {
      console.error('Apple sign-in error:', error);
      
      // Don't show error alert if user cancelled
      if (error.code === 'ERR_REQUEST_CANCELED' || 
          error.code === 'ERR_CANCELED' ||
          error.code === 'CANCELED' ||
          error.message?.includes('cancelled') ||
          error.message?.includes('canceled') ||
          error.message?.includes('failed for unknown reason')) {
        console.log('User cancelled Apple sign-in');
        return; // Exit silently
      }
      
      // Show error for actual failures
      Alert.alert('Apple Sign-In Failed', error.message || 'Something went wrong');
    } finally {
      setAppleLoading(false);
    }
  };

  // For testing in Expo Go - try anonymous auth first
  const handleTestLogin = async () => {
    try {
      setLoading(true);
      console.log('Starting authentication test...');
      
      // Try anonymous authentication first (simpler)
      try {
        console.log('Attempting anonymous sign-in...');
        const result = await signInAnonymously(auth);
        // Link RevenueCat purchase to this user
        try {
          await Purchases.logIn(result.user.uid);
          console.log('RevenueCat user linked successfully');
        } catch (rcError) {
          console.error('RevenueCat linking failed:', rcError);
        }
        
        console.log('Anonymous sign-in successful:', result.user.uid);
        router.replace('/(tabs)');
        return;
      } catch (anonymousError: any) {
        console.log('Anonymous auth failed:', anonymousError.code, anonymousError.message);
        
        // Fallback to email/password if anonymous fails
        // Dev-only fallback account; set your own via env if you use it
        const testEmail = process.env.EXPO_PUBLIC_DEV_TEST_EMAIL || 'test@example.com';
        const testPassword = process.env.EXPO_PUBLIC_DEV_TEST_PASSWORD || 'change-me-dev-only';
        
        try {
          console.log('Attempting email/password sign-in...');
          await signInWithEmailAndPassword(auth, testEmail, testPassword);
          console.log('Email sign-in successful');
        } catch (signInError: any) {
          console.log('Sign-in failed:', signInError.code);
          if (signInError.code === 'auth/user-not-found') {
            console.log('Creating new user...');
            await createUserWithEmailAndPassword(auth, testEmail, testPassword);
            console.log('User creation successful');
          } else {
            throw signInError;
          }
        }
        
        // Link RevenueCat purchase to this user  
        try {
          await Purchases.logIn(auth.currentUser?.uid || '');
          console.log('RevenueCat user linked successfully');
        } catch (rcError) {
          console.error('RevenueCat linking failed:', rcError);
        }
        
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Test login error:', error);
      Alert.alert('Authentication Error', `${error.code}: ${error.message}\n\nPlease check Firebase Console settings.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#fef7ed', '#fdf2f8', '#f3e8ff']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Sayura</Text>
          <Image 
            source={require('../assets/images/mascot_logo.png')}
            style={styles.mascotLogo}
            resizeMode="contain"
          />
          <Text style={styles.subtitle}>
            Spread your affirmations to the universe ✨
          </Text>
        </View>

        <View style={styles.authContainer}>
          <Text style={styles.authTitle}>Sign in to continue</Text>
          
          <TouchableOpacity
            style={[styles.authButton, styles.googleButton]}
            onPress={handleGoogleSignIn}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="logo-google" size={24} color="white" />
                <Text style={styles.authButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.authButton, styles.appleButton]}
            onPress={handleAppleSignIn}
            disabled={appleLoading || loading || Platform.OS !== 'ios'}
          >
            {appleLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="logo-apple" size={24} color="white" />
                <Text style={styles.authButtonText}>Continue with Apple</Text>
                {Platform.OS !== 'ios' && (
                  <Text style={styles.disabledText}>(iOS only)</Text>
                )}
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.authButton, styles.emailButton]}
            onPress={() => router.push('/email-auth')}
            disabled={loading}
          >
            <Ionicons name="mail-outline" size={24} color="white" />
            <Text style={styles.authButtonText}>Continue with Email</Text>
          </TouchableOpacity>

          {/* Temporary test login for Expo Go - Only in development */}
          {__DEV__ && (
            <TouchableOpacity
              style={[styles.authButton, styles.testButton]}
              onPress={handleTestLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="person" size={24} color="white" />
                  <Text style={styles.authButtonText}>Test Login (Expo Go)</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          
          <Text style={styles.disclaimer}>
            {__DEV__ && " Test Login available for development testing."}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ec4899',
    marginBottom: 12,
  },
  mascotLogo: {
    width: 120,
    height: 120,
    marginVertical: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#9333ea',
    textAlign: 'center',
  },
  authContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  appleButton: {
    backgroundColor: '#000',
  },
  testButton: {
    backgroundColor: '#ec4899',
  },
  emailButton: {
    backgroundColor: '#9333ea',
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6b7280',
    fontSize: 14,
  },
  disclaimer: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  disabledText: {
    color: 'white',
    fontSize: 10,
    marginLeft: 8,
    opacity: 0.8,
  },
});