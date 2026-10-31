import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useFocusEffect } from '@react-navigation/native';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

// Conditionally import GoogleSignin
let GoogleSignin: any = null;
try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch (error) {
  console.log('Google Sign-In not available in this environment');
}

export default function SettingsTab() {
  const router = useRouter();
  const [presentingPaywall, setPresentingPaywall] = useState(false);
  
  // Animation values for fade-in effect
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Start animations on tab focus
  useFocusEffect(
    React.useCallback(() => {
      // Reset and start animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }, [])
  );

  const handlePricing = async () => {
    try {
      setPresentingPaywall(true);
      console.log('Presenting RevenueCat paywall from settings...');
      
      const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall();
      
      console.log('Paywall result:', paywallResult);
      
      switch (paywallResult) {
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          console.log('Purchase successful!');
          Alert.alert('Success', 'Your purchase was successful!');
          break;
        case PAYWALL_RESULT.CANCELLED:
          console.log('Paywall cancelled by user');
          break;
        case PAYWALL_RESULT.NOT_PRESENTED:
          console.log('Paywall not presented - user might already have subscription');
          Alert.alert('Info', 'You already have an active subscription.');
          break;
        case PAYWALL_RESULT.ERROR:
          console.error('Paywall presentation error');
          Alert.alert(
            'Unable to Load Premium Plans',
            'Please check your connection and try again.'
          );
          break;
      }
    } catch (error) {
      console.error('Error presenting paywall:', error);
      Alert.alert(
        'Unable to Load Premium Plans',
        'Please check your connection and try again.'
      );
    } finally {
      setPresentingPaywall(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'This will permanently delete all your data. Are you absolutely sure?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // Delete user data from Firestore
                      const { deleteUserAccount } = await import('../services/firestore');
                      await deleteUserAccount();
                      
                      console.log('User account deleted successfully');
                      // The auth state listener will handle navigation
                    } catch (error) {
                      console.error('Error deleting account:', error);
                      Alert.alert('Error', 'Failed to delete account. Please try again.');
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              // Try to sign out from Google if available
              try {
                if (GoogleSignin?.isSignedIn) {
                  const isSignedIn = await GoogleSignin.isSignedIn();
                  if (isSignedIn) {
                    await GoogleSignin.signOut();
                    console.log('Signed out from Google');
                  }
                }
              } catch (googleError) {
                console.log('Google sign-out not available:', googleError.message);
                // Continue with Firebase sign out even if Google fails
              }
              
              // Sign out from Firebase
              await signOut(auth);
              
              console.log('User signed out successfully');
              // Navigation will be handled automatically by the auth state listener
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ],
    );
  };

  return (
    <LinearGradient
      colors={['#fef7ed', '#fdf2f8', '#f3e8ff']}
      style={styles.container}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0]
              })}]
            }
          ]}
        >
          <View>
            <Text style={styles.greeting}>Settings</Text>
            <Text style={styles.subtitle}>Manage your account and preferences</Text>
          </View>
        </Animated.View>
        {/* Your Profile Section */}
        <TouchableOpacity style={styles.mainSection} onPress={() => router.push('/user-profile')}>
          <View style={styles.mainSectionIcon}>
            <Ionicons name="person" size={28} color="#9333ea" />
          </View>
          <View style={styles.mainSectionContent}>
            <Text style={styles.mainSectionTitle}>Your Profile</Text>
            <Text style={styles.mainSectionSubtitle}>Email, default method, and preferences</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
        </TouchableOpacity>

        {/* Pricing Section */}
        <TouchableOpacity style={styles.mainSection} onPress={handlePricing}>
          <View style={styles.mainSectionIcon}>
            <Ionicons name="diamond" size={28} color="#fbbf24" />
          </View>
          <View style={styles.mainSectionContent}>
            <Text style={styles.mainSectionTitle}>Pricing</Text>
            <Text style={styles.mainSectionSubtitle}>Plan type, upgrade options</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
        </TouchableOpacity>

        {/* Billing Section */}
        <TouchableOpacity style={styles.mainSection}>
          <View style={styles.mainSectionIcon}>
            <Ionicons name="card" size={28} color="#ec4899" />
          </View>
          <View style={styles.mainSectionContent}>
            <Text style={styles.mainSectionTitle}>Billing</Text>
            <Text style={styles.mainSectionSubtitle}>Payment info, subscription status</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
        </TouchableOpacity>

        {/* How Sayura Works Section */}
        <TouchableOpacity style={styles.mainSection} onPress={() => router.push('/how-sayura-works')}>
          <View style={styles.mainSectionIcon}>
            <Ionicons name="information-circle" size={28} color="#06b6d4" />
          </View>
          <View style={styles.mainSectionContent}>
            <Text style={styles.mainSectionTitle}>How Sayura Works</Text>
            <Text style={styles.mainSectionSubtitle}>Learn about affirmations, ripples, and your spiritual journey</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
        </TouchableOpacity>

        {/* Logout Section */}
        <TouchableOpacity style={styles.logoutSection} onPress={handleLogout}>
          <View style={styles.logoutSectionIcon}>
            <Ionicons name="log-out" size={28} color="#ef4444" />
          </View>
          <View style={styles.mainSectionContent}>
            <Text style={styles.logoutSectionTitle}>Sign Out</Text>
            <Text style={styles.mainSectionSubtitle}>Sign out of your account</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
        </TouchableOpacity>

        {/* Delete Account Section */}
        <TouchableOpacity style={styles.deleteSection} onPress={handleDeleteAccount}>
          <View style={styles.deleteSectionIcon}>
            <Ionicons name="trash" size={28} color="#dc2626" />
          </View>
          <View style={styles.mainSectionContent}>
            <Text style={styles.deleteSectionTitle}>Delete My Account</Text>
            <Text style={styles.deleteSectionSubtitle}>Permanently delete your account and all data</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ec4899',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9333ea',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  mainSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  mainSectionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  mainSectionContent: {
    flex: 1,
  },
  mainSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  mainSectionSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
  },
  logoutSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutSectionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  logoutSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 4,
  },
  deleteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#fca5a5',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteSectionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  deleteSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 4,
  },
  deleteSectionSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
  },
});