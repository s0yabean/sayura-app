import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth } from './config/firebase';

export default function ProfilePage() {
  const router = useRouter();
  const [defaultMethod, setDefaultMethod] = useState<'Audio' | 'Type'>('Audio');
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Get user email from Firebase Auth, leave blank for anonymous users
    if (auth.currentUser?.email) {
      setEmail(auth.currentUser.email);
    } else {
      setEmail(''); // Anonymous login - no email
    }
  }, []);

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
        <Text style={styles.title}>Your Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Email Field */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email</Text>
          <View style={[styles.inputContainer, styles.readOnlyContainer]}>
            <Text style={styles.emailText}>
              {email || 'Anonymous User'}
            </Text>
          </View>
          <Text style={styles.emailNote}>
            {email ? 'Connected via your authentication provider' : 'Using anonymous login'}
          </Text>
        </View>

        {/* Default Method Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default Method</Text>
          <Text style={styles.sectionDescription}>
            Choose your preferred way to practice affirmations
          </Text>
          
          <View style={styles.methodToggle}>
            <TouchableOpacity 
              style={[
                styles.methodButton, 
                defaultMethod === 'Audio' && styles.methodButtonActive
              ]}
              onPress={() => setDefaultMethod('Audio')}
            >
              <View style={styles.methodContent}>
                <Ionicons 
                  name="mic" 
                  size={24} 
                  color={defaultMethod === 'Audio' ? 'white' : '#9333ea'} 
                />
                <Text style={[
                  styles.methodText,
                  defaultMethod === 'Audio' && styles.methodTextActive
                ]}>
                  Audio
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.methodButton, 
                defaultMethod === 'Type' && styles.methodButtonActive
              ]}
              onPress={() => setDefaultMethod('Type')}
            >
              <View style={styles.methodContent}>
                <Ionicons 
                  name="create-outline" 
                  size={24} 
                  color={defaultMethod === 'Type' ? 'white' : '#9333ea'} 
                />
                <Text style={[
                  styles.methodText,
                  defaultMethod === 'Type' && styles.methodTextActive
                ]}>
                  Type
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.methodDescription}>
            {defaultMethod === 'Audio' 
              ? "Speak your affirmations aloud for a more powerful experience"
              : "Type your affirmations for quiet practice"
            }
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  readOnlyContainer: {
    backgroundColor: 'rgba(243, 244, 246, 0.8)',
    borderColor: '#e5e7eb',
  },
  emailText: {
    padding: 16,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  emailNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 12,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  methodButtonActive: {
    backgroundColor: '#9333ea',
  },
  methodContent: {
    alignItems: 'center',
    gap: 8,
  },
  methodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9333ea',
  },
  methodTextActive: {
    color: 'white',
  },
  methodDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: '#ec4899',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});