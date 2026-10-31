import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getLeaderboardData, formatTimeAgo, addMyAffirmation, getUserData } from '../utils/storage';

interface Affirmation {
  id: string;
  text: string;
  hearts: number;
  isOwn: boolean;
  lastPublished: string;
  streakDays: number;
}

type FilterMode = 'all' | 'exclude-own' | 'only-community';

export default function LeaderboardTab() {
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [heartedAffirmations, setHeartedAffirmations] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [affirmationsInVault, setAffirmationsInVault] = useState<Set<string>>(new Set());
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    loadLeaderboard();
    
    // Entrance animation
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
  }, []);

  const loadLeaderboard = async () => {
    const data = await getLeaderboardData();
    setAffirmations(data);
    await checkAffirmationsInVault(data);
  };

  const checkAffirmationsInVault = async (leaderboardData: Affirmation[]) => {
    try {
      const userData = await getUserData();
      const vaultTexts = new Set(userData.myAffirmations?.map(aff => aff.text.toLowerCase().trim()) || []);
      
      // Find which leaderboard affirmations are already in vault
      const inVault = new Set<string>();
      leaderboardData.forEach(aff => {
        if (vaultTexts.has(aff.text.toLowerCase().trim())) {
          inVault.add(aff.id);
        }
      });
      
      setAffirmationsInVault(inVault);
    } catch (error) {
      console.error('Error checking affirmations in vault:', error);
    }
  };

  const getFilteredAffirmations = () => {
    switch (filterMode) {
      case 'exclude-own':
        return affirmations.filter(a => !a.isOwn);
      case 'only-community':
        return affirmations.filter(a => !a.isOwn);
      case 'all':
      default:
        return affirmations;
    }
  };

  const handleHeart = (id: string) => {
    if (heartedAffirmations.has(id)) {
      // Remove heart
      setHeartedAffirmations(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      setAffirmations(prev => 
        prev.map(a => a.id === id ? { ...a, hearts: a.hearts - 1 } : a)
      );
    } else {
      // Add heart
      setHeartedAffirmations(prev => new Set(prev).add(id));
      setAffirmations(prev => 
        prev.map(a => a.id === id ? { ...a, hearts: a.hearts + 1 } : a)
      );
    }
  };

  const handleAddToVault = (affirmation: Affirmation) => {
    // Check if already in vault
    if (affirmationsInVault.has(affirmation.id)) {
      Alert.alert(
        'Already in Vault',
        'This affirmation is already in your vault! ✨',
        [{ text: 'Got it!' }]
      );
      return;
    }

    Alert.alert(
      "Add to Vault",
      "Would you like to add this affirmation to your vault?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "OK",
          onPress: async () => {
            try {
              // Add the affirmation to the user's vault
              await addMyAffirmation(affirmation.text, 'community', 'community');
              
              // Mark this affirmation as added to vault
              setAffirmationsInVault(prev => new Set(prev).add(affirmation.id));
              
              Alert.alert(
                'Success! ✨',
                'This beautiful affirmation has been added to your vault.',
                [{ text: 'Amazing!' }]
              );
            } catch (error) {
              console.error('Error adding affirmation to vault:', error);
              Alert.alert(
                'Error',
                'Unable to add affirmation to vault. Please try again.',
                [{ text: 'OK' }]
              );
            }
          }
        }
      ]
    );
  };

  return (
    <LinearGradient
      colors={['#fef7ed', '#fdf2f8', '#f3e8ff']}
      style={styles.container}
    >
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
        <Text style={styles.title}>Ripple Galaxy</Text>
        <Text style={styles.subtitle}>Every ripple here shines in someone's sky ✨</Text>
      </Animated.View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* All Affirmations - Community focused but can include user's own if they rank high */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderWithToggle}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="people" size={20} color="#9333ea" />
              <Text style={styles.sectionTitle}>Community Ripples</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.filterToggle}
              onPress={() => setFilterMode(filterMode === 'all' ? 'exclude-own' : 'all')}
            >
              <Text style={styles.toggleText}>
                {filterMode === 'all' ? 'All' : 'All'}
              </Text>
              <Ionicons 
                name={filterMode === 'all' ? 'checkmark-circle' : 'checkmark-circle-outline'} 
                size={22} 
                color={filterMode === 'all' ? '#9333ea' : '#9ca3af'} 
              />
            </TouchableOpacity>
          </View>
          {getFilteredAffirmations().map((affirmation) => (
            <Animated.View
              key={affirmation.id}
              style={[
                styles.affirmationCard,
                affirmation.isOwn && styles.ownAffirmationCard,
                {
                  opacity: fadeAnim,
                  transform: [
                    { 
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0]
                      })
                    },
                    { scale: scaleAnim }
                  ]
                }
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.timeContainer}>
                  <Ionicons name="time-outline" size={14} color="#9ca3af" />
                  <Text style={styles.timeText}>{formatTimeAgo(affirmation.lastPublished)}</Text>
                </View>
                <View style={styles.headerRight}>
                  <View style={styles.leafContainer}>
                    <Ionicons name="leaf" size={18} color="#10b981" />
                  </View>
                  <View style={styles.streakContainer}>
                    <Ionicons name="flame" size={18} color="#f97316" />
                    <Text style={styles.streakText}>{affirmation.streakDays} days</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.cardContent}>
                <Text style={styles.affirmationText}>"{affirmation.text}"</Text>
                
                {/* Standardized bottom row - always show ripples in bottom right */}
                <View style={styles.bottomRow}>
                  {!affirmation.isOwn && (
                    <View style={styles.leftButtonsContainer}>
                      <TouchableOpacity
                        style={styles.heartButton}
                        onPress={() => handleHeart(affirmation.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name={heartedAffirmations.has(affirmation.id) ? "heart" : "heart-outline"} 
                          size={24} 
                          color={heartedAffirmations.has(affirmation.id) ? "#ec4899" : "#9ca3af"}
                        />
                        <Text style={[
                          styles.heartCount,
                          heartedAffirmations.has(affirmation.id) && styles.heartCountActive
                        ]}>
                          {affirmation.hearts}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[
                          styles.vaultButton,
                          affirmationsInVault.has(affirmation.id) && styles.vaultButtonDisabled
                        ]}
                        onPress={() => handleAddToVault(affirmation)}
                        activeOpacity={affirmationsInVault.has(affirmation.id) ? 1 : 0.7}
                        disabled={affirmationsInVault.has(affirmation.id)}
                      >
                        <Ionicons 
                          name={affirmationsInVault.has(affirmation.id) ? "checkmark" : "add"} 
                          size={24} 
                          color={affirmationsInVault.has(affirmation.id) ? "#9ca3af" : "#ef4444"} 
                        />
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.rippleIndicator}>
                    <Ionicons name="water" size={20} color="#06b6d4" />
                    <Text style={styles.rippleText}>
                      {affirmation.hearts} ripples
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          ))}
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Every heart creates a ripple of positivity 💕
          </Text>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 17,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ec4899',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9333ea',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeaderWithToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleText: {
    fontSize: 17, // Increased from 14 by 20%
    fontWeight: '600',
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 8,
  },
  affirmationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  ownAffirmationCard: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leafContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 12,
    color: '#f97316',
    fontWeight: '600',
    marginLeft: 4,
  },
  cardContent: {
    flex: 1,
  },
  affirmationText: {
    fontSize: 18,
    lineHeight: 26,
    color: '#1f2937',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  leftButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomRowOwnAffirmation: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  heartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(236, 72, 153, 0.05)',
  },
  heartCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
    marginLeft: 6,
  },
  heartCountActive: {
    color: '#ec4899',
  },
  vaultButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 12,
  },
  vaultButtonDisabled: {
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    opacity: 0.6,
  },
  rippleIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rippleText: {
    fontSize: 14,
    color: '#06b6d4',
    marginLeft: 4,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#9333ea',
    fontStyle: 'italic',
  },
});