import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HowSayuraWorks() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#fef7ed', '#fdf2f8', '#f3e8ff']}
      style={styles.container}
    >
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#9333ea" />
        </TouchableOpacity>
        <Text style={styles.title}>How Sayura Works</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ The Sayura Experience</Text>
          <Text style={styles.sectionText}>
            Sayura transforms daily affirmations into a powerful spiritual practice through voice recognition and community connection. We believe that speaking your truth aloud creates deeper neural pathways than silent thoughts alone.
          </Text>
        </View>

        {/* Voice Ritual Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="mic" size={24} color="#ec4899" />
            </View>
            <Text style={styles.sectionTitle}>Voice Ritual</Text>
          </View>
          <Text style={styles.sectionText}>
            Speak your affirmations aloud using our advanced voice recognition technology. This engages both mind and body, making affirmations more powerful than silent repetition. Scientific research shows that spoken affirmations activate different neural pathways, creating lasting positive changes in mindset and behavior.
          </Text>
        </View>

        {/* Ripple Galaxy System */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="planet" size={24} color="#06b6d4" />
            </View>
            <Text style={styles.sectionTitle}>Ripple Galaxy System</Text>
          </View>
          <Text style={styles.sectionText}>
            Track your spiritual impact through three cosmic metrics that measure different aspects of your journey:
          </Text>
          
          {/* Metrics */}
          <View style={styles.metricContainer}>
            <View style={styles.metric}>
              <View style={styles.metricIcon}>
                <Ionicons name="water" size={20} color="#06b6d4" />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricTitle}>Ripples</Text>
                <Text style={styles.metricDescription}>Social impact when others save or heart your affirmations in the community</Text>
              </View>
            </View>

            <View style={styles.metric}>
              <View style={styles.metricIcon}>
                <Ionicons name="flame" size={20} color="#f97316" />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricTitle}>Streak</Text>
                <Text style={styles.metricDescription}>Personal momentum from consecutive days of practice</Text>
              </View>
            </View>

            <View style={styles.metric}>
              <View style={styles.metricIcon}>
                <Ionicons name="leaf" size={20} color="#059669" />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricTitle}>Rings</Text>
                <Text style={styles.metricDescription}>Longevity measured by total practice sessions over time</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Benefits Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="star" size={24} color="#fbbf24" />
            </View>
            <Text style={styles.sectionTitle}>Benefits</Text>
          </View>
          <Text style={styles.sectionText}>
            Regular practice with Sayura brings profound positive changes to your life:
          </Text>
          
          <View style={styles.benefitsList}>
            <View style={styles.benefit}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.benefitText}>Increased self-awareness and confidence</Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.benefitText}>Reduced negative self-talk and anxiety</Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.benefitText}>Greater sense of purpose and direction</Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.benefitText}>Connection to a supportive community</Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.benefitText}>Measurable progress in your spiritual journey</Text>
            </View>
          </View>
        </View>

        {/* Call to Action */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to begin your journey?</Text>
          <Text style={styles.ctaText}>
            Start by exploring the Paths tab to discover affirmations that resonate with your soul, then practice them daily in the Ritual tab.
          </Text>
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => router.push('/(tabs)/paths')}
          >
            <Ionicons name="sparkles" size={20} color="white" />
            <Text style={styles.ctaButtonText}>Explore Paths</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ec4899',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    marginBottom: 16,
  },
  metricContainer: {
    gap: 16,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  metricContent: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  metricDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  benefitsList: {
    gap: 12,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  ctaSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#fde68a',
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: '#ec4899',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});