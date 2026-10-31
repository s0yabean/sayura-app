import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { checkSubscriptionStatus } from './config/revenuecat';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

export default function PaywallScreen() {
  const [loading, setLoading] = useState(true);
  const [presenting, setPresenting] = useState(false);

  useEffect(() => {
    // Small delay to ensure RevenueCat is properly initialized
    const timer = setTimeout(() => {
      setLoading(false);
      // Auto-present paywall when screen loads
      presentPaywall();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const presentPaywall = async () => {
    try {
      setPresenting(true);
      console.log('Presenting RevenueCat paywall...');
      
      const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall();
      
      console.log('Paywall result:', paywallResult);
      
      switch (paywallResult) {
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          console.log('Purchase successful, navigating to login...');
          router.replace('/login-simple');
          break;
        case PAYWALL_RESULT.CANCELLED:
          console.log('Paywall cancelled by user');
          // Stay on paywall screen - user can try again or skip
          break;
        case PAYWALL_RESULT.NOT_PRESENTED:
          console.log('Paywall not presented - user might already have subscription');
          router.replace('/login-simple');
          break;
        case PAYWALL_RESULT.ERROR:
          console.error('Paywall presentation error');
          Alert.alert(
            'Unable to Load Premium Plans',
            'Please check your connection and try again.',
            [{ text: 'Retry', onPress: presentPaywall }]
          );
          break;
        default:
          console.log('Unknown paywall result:', paywallResult);
          break;
      }
    } catch (error) {
      console.error('Error presenting paywall:', error);
      Alert.alert(
        'Unable to Load Premium Plans',
        'Please check your connection and try again.',
        [{ text: 'Retry', onPress: presentPaywall }]
      );
    } finally {
      setPresenting(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Continue with Limited Access?',
      'You can upgrade to premium anytime in your profile settings for unlimited features.',
      [
        { text: 'Go Back', style: 'cancel' },
        { text: 'Continue', onPress: () => router.replace('/login-simple') }
      ]
    );
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#fef7ed', '#fdf2f8', '#f3e8ff']}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ec4899" />
          <Text style={styles.loadingText}>Loading premium plans...</Text>
        </View>
      </LinearGradient>
    );
  }

  const isExpoGo = Constants.executionEnvironment === 'storeClient';

  return (
    <LinearGradient
      colors={['#fef7ed', '#fdf2f8', '#f3e8ff']}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        {/* Show Preview Mode indicator in Expo Go */}
        {isExpoGo && (
          <View style={styles.previewBanner}>
            <Text style={styles.previewText}>
              🧪 Preview Mode - Mock purchases only
            </Text>
          </View>
        )}
        
        {/* Main content - waiting for paywall or showing fallback */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="star" size={80} color="#ec4899" />
          </View>
          
          <Text style={styles.title}>Unlock Premium Features</Text>
          <Text style={styles.subtitle}>
            Get unlimited affirmations and personalized insights
          </Text>
          
          {presenting ? (
            <View style={styles.presentingContainer}>
              <ActivityIndicator size="large" color="#ec4899" />
              <Text style={styles.presentingText}>Opening premium plans...</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.showPaywallButton}
              onPress={presentPaywall}
            >
              <Text style={styles.showPaywallButtonText}>View Premium Plans</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* Skip button */}
        <View style={styles.skipButtonContainer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipText}>Continue with Limited Access</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef7ed',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ec4899',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ec4899',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 28,
  },
  showPaywallButton: {
    backgroundColor: '#ec4899',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 8,
  },
  showPaywallButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
  presentingContainer: {
    alignItems: 'center',
  },
  presentingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ec4899',
  },
  skipButtonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  previewBanner: {
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  previewText: {
    fontSize: 14,
    color: '#9333ea',
    fontWeight: '500',
  },
});