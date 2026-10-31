import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

const onboardingSteps = [
  {
    icon: 'heart',
    title: 'Transform Your Mindset',
    subtitle: 'Personalized affirmations that rewire your brain for success',
    color: '#ec4899'
  },
  {
    icon: 'mic',
    title: 'Speak It Into Existence',
    subtitle: 'Record yourself saying powerful affirmations daily',
    color: '#8b5cf6'
  },
  {
    icon: 'trending-up',
    title: 'Track Your Progress',
    subtitle: 'See how consistent practice transforms your life',
    color: '#06b6d4'
  }
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Go to paywall after onboarding
      router.replace('/paywall');
    }
  };

  const skipToPaywall = () => {
    router.replace('/paywall');
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <LinearGradient
      colors={['#fef7ed', '#fdf2f8', '#f3e8ff']}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        {/* Skip button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={skipToPaywall} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Step indicators */}
        <View style={styles.indicators}>
          {onboardingSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                { backgroundColor: index <= currentStep ? currentStepData.color : '#e5e7eb' }
              ]}
            />
          ))}
        </View>

        {/* Main content */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={currentStepData.icon as any} 
              size={80} 
              color={currentStepData.color} 
            />
          </View>
          
          <Text style={[styles.title, { color: currentStepData.color }]}>
            {currentStepData.title}
          </Text>
          
          <Text style={styles.subtitle}>
            {currentStepData.subtitle}
          </Text>
        </View>

        {/* Navigation */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.nextButton, { backgroundColor: currentStepData.color }]}
            onPress={nextStep}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Continue'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  indicator: {
    width: 32,
    height: 4,
    borderRadius: 2,
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
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: width * 0.8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
});