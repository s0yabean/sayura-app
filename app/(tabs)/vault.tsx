import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getUserData, removeMyAffirmation, toggleAffirmationVisibility } from '../utils/storage-firestore';
import { useFocusEffect } from '@react-navigation/native';

interface StoredAffirmation {
  id: string;
  text: string;
  category: string;
  dateAdded: string;
  source: 'custom' | 'quiz' | 'cosmic' | 'community' | 'default';
  successDates?: string[];
  dailyFrequency?: { [date: string]: number };
  totalCount?: number;
  isPublic?: boolean;
}

type FilterMode = 'all' | 'public' | 'private';

export default function VaultTab() {
  const [affirmations, setAffirmations] = useState<StoredAffirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAffirmation, setSelectedAffirmation] = useState<StoredAffirmation | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [error, setError] = useState<string | null>(null);
  
  // Animation values for fade-in effect
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  const loadAffirmations = async () => {
    const startTime = Date.now();
    console.log('🕐 [VAULT TIMING] Starting to load affirmations at:', new Date(startTime).toISOString());
    
    try {
      const getUserDataStart = Date.now();
      console.log('🕐 [VAULT TIMING] Calling getUserData...');
      
      const userData = await getUserData();
      
      const getUserDataEnd = Date.now();
      const getUserDataDuration = getUserDataEnd - getUserDataStart;
      console.log('🕐 [VAULT TIMING] getUserData completed in:', getUserDataDuration, 'ms (', (getUserDataDuration / 1000).toFixed(1), 'seconds)');
      
      console.log('Vault: Loaded user data:', userData);
      console.log('Vault: myAffirmations count:', userData.myAffirmations?.length || 0);
      console.log('Vault: myAffirmations:', userData.myAffirmations);
      setAffirmations((userData.myAffirmations || []) as StoredAffirmation[]);
      setError(null); // Clear any previous errors
      
      const totalDuration = Date.now() - startTime;
      console.log('🕐 [VAULT TIMING] Total vault load time:', totalDuration, 'ms (', (totalDuration / 1000).toFixed(1), 'seconds)');
    } catch (error) {
      console.error('Error loading affirmations:', error);
      const totalDuration = Date.now() - startTime;
      console.log('🕐 [VAULT TIMING] Total vault load time (with error):', totalDuration, 'ms (', (totalDuration / 1000).toFixed(1), 'seconds)');
      
      // Set user-friendly error message
      if (error.message?.includes('offline') || error.code === 'unavailable') {
        setError('Cannot connect to Firestore. Check your internet connection and Firebase configuration.');
      } else if (error.message?.includes('permission-denied')) {
        setError('Permission denied. Check your Firestore security rules.');
      } else {
        setError(`Firestore Error: ${error.message || 'Unknown error occurred'}`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Function to refresh vault data (can be called from other components)
  const refreshVault = async () => {
    setLoading(true);
    await loadAffirmations();
  };

  // Load data only on first focus or when explicitly needed
  useFocusEffect(
    React.useCallback(() => {
      console.log('\ud83d\udd50 [VAULT] Vault focused - refreshing data to get latest affirmations');
      loadAffirmations();
      
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

  const handleRemoveAffirmation = async (affirmationId: string) => {
    Alert.alert(
      'Remove Affirmation',
      'Are you sure you want to remove this affirmation from your collection?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMyAffirmation(affirmationId);
              await loadAffirmations(); // Refresh the list
            } catch (error) {
              console.error('Error removing affirmation:', error);
              Alert.alert('Error', 'Failed to remove affirmation. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'quiz': return 'sparkles';
      case 'custom': return 'create-outline';
      case 'cosmic': return 'dice-outline';
      default: return 'heart';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'quiz': return '#ec4899';
      case 'custom': return '#06b6d4';
      case 'cosmic': return '#f59e0b';
      default: return '#9333ea';
    }
  };

  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case 'work': return 'Work';
      case 'career': return 'Career';
      case 'love': return 'Love';
      case 'family': return 'Family';
      case 'personal-growth': return 'Personal Growth';
      case 'spiritual-growth': return 'Spiritual Growth';
      case 'custom': return 'Personal';
      default: return 'Life';
    }
  };

  const getSuccessStats = (affirmation: StoredAffirmation) => {
    const totalRipples = affirmation.successDates?.length || 0;
    const streakDays = affirmation.successDates?.length || 0; // Simplified - could calculate actual streak
    const totalCount = affirmation.totalCount || 0; // All-time count
    return { totalRipples, streakDays, totalCount };
  };

  const getFilteredAffirmations = () => {
    console.log('Vault: Filtering affirmations, mode:', filterMode);
    console.log('Vault: Total affirmations:', affirmations.length);
    
    let filtered;
    switch (filterMode) {
      case 'public':
        filtered = affirmations.filter(a => a.isPublic !== false); // Default to public if not set
        break;
      case 'private':
        filtered = affirmations.filter(a => a.isPublic === false);
        break;
      case 'all':
      default:
        filtered = affirmations;
        break;
    }
    
    // Sort the filtered affirmations
    const sorted = filtered.sort((a, b) => {
      if (filterMode === 'private' || (filterMode === 'all' && a.isPublic === false && b.isPublic === false)) {
        // Private affirmations ranking: Streak (🔥) first, then Total Count (🌿)
        const aStreak = a.successDates?.length || 0;
        const bStreak = b.successDates?.length || 0;
        const aCount = a.totalCount || 0;
        const bCount = b.totalCount || 0;
        
        if (aStreak !== bStreak) {
          return bStreak - aStreak; // Higher streak first
        }
        return bCount - aCount; // Then higher count
      } else if (filterMode === 'public' || (filterMode === 'all' && a.isPublic !== false && b.isPublic !== false)) {
        // Public affirmations ranking: Ripples (💧) first, then Streak (🔥), then Total Count (🌿)
        const aRipples = a.successDates?.length || 0; // Using successDates as ripples for now
        const bRipples = b.successDates?.length || 0;
        const aStreak = a.successDates?.length || 0;
        const bStreak = b.successDates?.length || 0;
        const aCount = a.totalCount || 0;
        const bCount = b.totalCount || 0;
        
        if (aRipples !== bRipples) {
          return bRipples - aRipples; // Higher ripples first
        }
        if (aStreak !== bStreak) {
          return bStreak - aStreak; // Then higher streak
        }
        return bCount - aCount; // Then higher count
      }
      
      // Mixed view (All filter): Sort by type first (public first), then by their respective criteria
      if (a.isPublic !== false && b.isPublic === false) {
        return -1; // Public first
      }
      if (a.isPublic === false && b.isPublic !== false) {
        return 1; // Private second
      }
      
      // If same type, use the appropriate ranking
      return 0;
    });
    
    console.log('Vault: Filtered and sorted affirmations:', sorted.length);
    return sorted;
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#fef7ed', '#fdf2f8', '#f3e8ff']}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your affirmations...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient
        colors={['#fef7ed', '#fdf2f8', '#f3e8ff']}
        style={styles.container}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setError(null);
              setLoading(true);
              loadAffirmations();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#fef7ed', '#fdf2f8', '#f3e8ff']}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
          <Text style={styles.title}>Affirmations Vault</Text>
          <Text style={styles.subtitle}>Your collection of beautiful truths ✨</Text>
        </Animated.View>

        {/* Filter Toggle */}
        <View style={styles.filterContainer}>
          <View style={styles.filterToggle}>
          <TouchableOpacity 
            style={[styles.toggleButton, filterMode === 'all' && styles.toggleButtonActive]}
            onPress={() => setFilterMode('all')}
            activeOpacity={0.7}
          >
            <View style={styles.toggleButtonContent}>
              <Text style={[styles.toggleButtonText, filterMode === 'all' && styles.toggleButtonTextActive]}>
                All
              </Text>
              <View style={[styles.countCircle, filterMode === 'all' && styles.countCircleActive]}>
                <Text style={[styles.countText, filterMode === 'all' && styles.countTextActive]}>
                  {affirmations.length}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, filterMode === 'public' && styles.toggleButtonActive]}
            onPress={() => setFilterMode('public')}
            activeOpacity={0.7}
          >
            <View style={styles.toggleButtonContent}>
              <Text style={[styles.toggleButtonText, filterMode === 'public' && styles.toggleButtonTextActive]}>
                Public
              </Text>
              <View style={[styles.countCircle, filterMode === 'public' && styles.countCircleActive]}>
                <Text style={[styles.countText, filterMode === 'public' && styles.countTextActive]}>
                  {affirmations.filter(a => a.isPublic !== false).length}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, filterMode === 'private' && styles.toggleButtonActive]}
            onPress={() => setFilterMode('private')}
            activeOpacity={0.7}
          >
            <View style={styles.toggleButtonContent}>
              <Text style={[styles.toggleButtonText, filterMode === 'private' && styles.toggleButtonTextActive]}>
                Private
              </Text>
              <View style={[styles.countCircle, filterMode === 'private' && styles.countCircleActive]}>
                <Text style={[styles.countText, filterMode === 'private' && styles.countTextActive]}>
                  {affirmations.filter(a => a.isPublic === false).length}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Affirmations List */}
        {getFilteredAffirmations().length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptySubtitle}>
              {filterMode === 'all' 
                ? "Visit the Paths tab to create your first truth and start building your vault!"
                : filterMode === 'public' 
                ? "No public affirmations yet. Make some affirmations public to see them here!"
                : "No private affirmations yet. Keep some affirmations just for yourself!"
              }
            </Text>
            {(filterMode === 'all' || filterMode === 'public') && (
              <TouchableOpacity 
                style={styles.goToPathsButton} 
                onPress={() => {
                  const { router } = require('expo-router');
                  router.push('/paths');
                }}
              >
                <Ionicons name="sparkles" size={24} color="white" />
                <Text style={styles.goToPathsButtonText}>Explore Paths</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          getFilteredAffirmations().map((affirmation, index) => {
            const stats = getSuccessStats(affirmation);
            return (
              <TouchableOpacity 
                key={affirmation.id || index} 
                style={styles.affirmationCard}
                onPress={() => setSelectedAffirmation(affirmation)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      {affirmation.isPublic === false && (
                        <View style={styles.privateLockContainer}>
                          <Ionicons name="lock-closed" size={16} color="#9333ea" />
                        </View>
                      )}
                    </View>
                    <TouchableOpacity 
                      onPress={() => setSelectedAffirmation(affirmation)}
                      style={styles.moreButton}
                    >
                      <Ionicons name="ellipsis-horizontal" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.affirmationText}>"{affirmation.text}"</Text>
                  
                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <Ionicons name="flame" size={16} color="#f97316" />
                      <Text style={styles.statText}>{stats.streakDays}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="leaf" size={16} color="#059669" />
                      <Text style={styles.statText}>{stats.totalCount}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })
        )}
      
      </ScrollView>
      
      {/* Detailed Affirmation Modal */}
      {selectedAffirmation && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.92)']}
              style={styles.modalGradient}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Affirmation Details</Text>
                <TouchableOpacity 
                  onPress={() => setSelectedAffirmation(null)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              {/* Affirmation Text */}
              <Text style={styles.modalAffirmationText}>"{selectedAffirmation.text}"</Text>
              
              {/* Details */}
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Source:</Text>
                  <View style={styles.sourceTag}>
                    <Ionicons 
                      name={getSourceIcon(selectedAffirmation.source)} 
                      size={16} 
                      color={getSourceColor(selectedAffirmation.source)} 
                    />
                    <Text style={[styles.sourceText, { color: getSourceColor(selectedAffirmation.source) }]}>
                      {selectedAffirmation.source.charAt(0).toUpperCase() + selectedAffirmation.source.slice(1)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category:</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>
                      {getCategoryDisplayName(selectedAffirmation.category)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Added:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedAffirmation.dateAdded).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              
              {/* Toggle Visibility Button */}
              <TouchableOpacity 
                onPress={async () => {
                  try {
                    await toggleAffirmationVisibility(selectedAffirmation.id);
                    await loadAffirmations(); // Refresh the list
                    setSelectedAffirmation(null); // Close modal
                  } catch (error) {
                    console.error('Error toggling visibility:', error);
                  }
                }}
                style={styles.visibilityToggleButton}
              >
                <Ionicons 
                  name={selectedAffirmation.isPublic === false ? "eye" : "eye-off"} 
                  size={20} 
                  color="#10b981" 
                />
                <Text style={styles.visibilityToggleButtonText}>
                  Make {selectedAffirmation.isPublic === false ? "Public" : "Private"}
                </Text>
              </TouchableOpacity>
              
              {/* Delete Button */}
              <TouchableOpacity 
                onPress={() => {
                  setSelectedAffirmation(null);
                  handleRemoveAffirmation(selectedAffirmation.id);
                }}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                <Text style={styles.deleteButtonText}>Remove Affirmation</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#9333ea',
    fontStyle: 'italic',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
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
  statsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#9ca3af',
    marginTop: 20,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  affirmationsList: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    flexGrow: 1,
  },
  affirmationCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privateLockContainer: {
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    borderRadius: 12,
    padding: 6,
    marginRight: 8,
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sourceText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  moreButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
  },
  affirmationText: {
    fontSize: 18,
    lineHeight: 26,
    color: '#1f2937',
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '500',
    marginBottom: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9333ea',
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  goToPathsButton: {
    backgroundColor: '#ec4899',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  goToPathsButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  filterContainer: {
    marginBottom: 24,
  },
  filterToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    borderRadius: 20,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#9333ea',
  },
  toggleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9333ea',
  },
  toggleButtonTextActive: {
    color: 'white',
  },
  countCircle: {
    backgroundColor: 'rgba(147, 51, 234, 0.2)',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countCircleActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9333ea',
  },
  countTextActive: {
    color: 'white',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  modalGradient: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
  },
  modalAffirmationText: {
    fontSize: 18,
    lineHeight: 26,
    color: '#1f2937',
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '500',
    marginBottom: 24,
  },
  detailsContainer: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  detailValue: {
    fontSize: 16,
    color: '#6b7280',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  visibilityToggleButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  visibilityToggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});