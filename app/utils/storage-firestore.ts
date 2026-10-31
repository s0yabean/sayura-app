import { auth } from '../config/firebase';
import { 
  getUserDataFromFirestore, 
  saveUserDataToFirestore,
  addAffirmationToFirestore,
  updateAffirmationInFirestore,
  deleteAffirmationFromFirestore,
  initializeUserData
} from '../services/firestore';

// Default user data for offline fallback
const getDefaultUserData = (): UserData => ({
  myAffirmations: [
    {
      id: 'default_1',
      text: 'I am loved by the universe',
      category: 'self-love',
      dateAdded: new Date().toISOString().split('T')[0],
      source: 'default' as const,
      isPublic: true,
      totalCount: 0,
      successDates: [],
      dailyFrequency: {}
    },
    {
      id: 'default_2',
      text: 'I believe in my full potential',
      category: 'growth',
      dateAdded: new Date().toISOString().split('T')[0],
      source: 'default' as const,
      isPublic: true,
      totalCount: 0,
      successDates: [],
      dailyFrequency: {}
    },
    {
      id: 'default_3',
      text: 'I am connected to source',
      category: 'spiritual',
      dateAdded: new Date().toISOString().split('T')[0],
      source: 'default' as const,
      isPublic: true,
      totalCount: 0,
      successDates: [],
      dailyFrequency: {}
    }
  ],
  currentAffirmation: {
    id: 'default_1',
    text: 'I am loved by the universe',
    category: 'self-love',
    dateAdded: new Date().toISOString().split('T')[0],
    source: 'default' as const,
    isPublic: true,
    totalCount: 0,
    successDates: [],
    dailyFrequency: {}
  },
  streakData: {
    count: 0,
    lastDate: null,
    affirmations: []
  },
  lastAffirmationDate: null
});

// Export interfaces for use in firestore.ts
export interface StoredAffirmation {
  id: string;
  text: string;
  category: string;
  dateAdded: string;
  source?: 'custom' | 'quiz' | 'cosmic' | 'community' | 'default';
  successDates?: string[];
  dailyFrequency?: { [date: string]: number };
  totalCount?: number;
  isPublic?: boolean;
}

export interface UserData {
  currentStreak?: number;
  lastAffirmationDate?: string | null;
  totalRipples?: number;
  currentAffirmationIndex?: number;
  dailyUnspokenIndex?: { [date: string]: number };
  affirmations?: Array<{
    id: string;
    text: string;
    date: string;
    hearts: number;
  }>;
  myAffirmations?: StoredAffirmation[];
  currentAffirmation?: string | StoredAffirmation | null;
  streakData?: {
    count: number;
    lastDate: string | null;
    affirmations: Array<{
      text: string;
      date: string;
    }>;
  };
}

// Check if user is authenticated
const isAuthenticated = () => {
  return auth.currentUser !== null;
};


// Get user data
export const getUserData = async (): Promise<UserData> => {
  const startTime = Date.now();
  console.log('🕐 [STORAGE TIMING] getUserData started at:', new Date(startTime).toISOString());
  
  if (!isAuthenticated()) {
    console.log('🕐 [STORAGE TIMING] User not authenticated, returning default data');
    return getDefaultUserData();
  }
  
  const firestoreStart = Date.now();
  console.log('🕐 [STORAGE TIMING] Starting getUserDataFromFirestore...');
  
  try {
    const result = await getUserDataFromFirestore();
    
    const firestoreDuration = Date.now() - firestoreStart;
    console.log('🕐 [STORAGE TIMING] getUserDataFromFirestore completed in:', firestoreDuration, 'ms (', (firestoreDuration / 1000).toFixed(1), 'seconds)');
    
    const totalDuration = Date.now() - startTime;
    console.log('🕐 [STORAGE TIMING] Total getUserData time:', totalDuration, 'ms (', (totalDuration / 1000).toFixed(1), 'seconds)');
    
    return result;
  } catch (error) {
    console.error('🕐 [STORAGE ERROR] Failed to get user data:', error);
    throw error; // Let the error bubble up
  }
};

// Update streak data
export const updateStreak = async (affirmationText: string): Promise<void> => {
  if (!isAuthenticated()) {
    console.log('🔥 [STREAK] Not authenticated, skipping streak update');
    return;
  }
  
  // Additional check to ensure auth state is stable
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('🔥 [STREAK] User became unauthenticated during call, skipping streak update');
      return;
    }
  } catch (error) {
    console.log('🔥 [STREAK] Authentication check failed, skipping streak update:', error.message);
    return;
  }
  
  const today = new Date().toISOString().split('T')[0];
  const userData = await getUserData();
  
  const streakData = userData.streakData || {
    count: 0,
    lastDate: null,
    affirmations: []
  };

  if (streakData.lastDate === today) {
    streakData.affirmations.push({ text: affirmationText, date: new Date().toISOString() });
  } else if (streakData.lastDate === getYesterday()) {
    streakData.count += 1;
    streakData.lastDate = today;
    streakData.affirmations = [{ text: affirmationText, date: new Date().toISOString() }];
  } else {
    streakData.count = 1;
    streakData.lastDate = today;
    streakData.affirmations = [{ text: affirmationText, date: new Date().toISOString() }];
  }

  await saveUserDataToFirestore({ 
    streakData,
    lastAffirmationDate: today 
  });
};

// Get smart ordered affirmation based on daily usage
export const getSmartOrderedAffirmation = async (): Promise<{ text: string; id: string; index: number } | null> => {
  const userData = await getUserData();
  
  if (!userData.myAffirmations || userData.myAffirmations.length === 0) {
    return null;
  }

  const today = new Date().toISOString().split('T')[0];
  
  // Create array with affirmations and their priority scores
  const affirmationsWithPriority = userData.myAffirmations.map((affirmation, index) => {
    const dailyFrequency = affirmation.dailyFrequency || {};
    const timesSpokenToday = dailyFrequency[today] || 0;
    
    // Priority scoring:
    // - Unspoken today: priority 100
    // - Spoken 1-3 times: priority decreases (90, 80, 70)
    // - Spoken more than 3 times: very low priority (10)
    let priority;
    if (timesSpokenToday === 0) {
      priority = 100;
    } else if (timesSpokenToday <= 3) {
      priority = 100 - (timesSpokenToday * 10);
    } else {
      priority = 10;
    }
    
    return {
      ...affirmation,
      originalIndex: index,
      priority,
      timesSpokenToday
    };
  });
  
  // Sort by priority (highest first), then by original index for consistency
  const sortedAffirmations = affirmationsWithPriority.sort((a, b) => {
    if (a.priority === b.priority) {
      return a.originalIndex - b.originalIndex;
    }
    return b.priority - a.priority;
  });
  
  // Get the highest priority affirmation
  const selectedAffirmation = sortedAffirmations[0];
  
  console.log('🎯 [SMART ORDER] Affirmation priorities for today:', 
    sortedAffirmations.map(a => ({
      text: a.text.substring(0, 30),
      priority: a.priority,
      timesSpokenToday: a.timesSpokenToday,
      selected: a.id === selectedAffirmation.id
    }))
  );
  
  return {
    text: selectedAffirmation.text,
    id: selectedAffirmation.id,
    index: selectedAffirmation.originalIndex
  };
};

// Get current affirmation - now uses smart ordering by default
export const getCurrentAffirmation = async (): Promise<{ text: string; id: string } | null> => {
  const smartAffirmation = await getSmartOrderedAffirmation();
  
  if (!smartAffirmation) {
    return null;
  }
  
  // Try to update the current index, but don't fail if it doesn't work
  try {
    await saveUserDataToFirestore({ currentAffirmationIndex: smartAffirmation.index });
  } catch (error) {
    console.log('🎯 [SMART ORDER] Could not save index, but continuing with smart affirmation:', error.message);
    // Continue anyway - the smart ordering still works without saving the index
  }
  
  return {
    text: smartAffirmation.text,
    id: smartAffirmation.id
  };
};

// Move to next affirmation - now uses smart ordering
export const moveToNextAffirmation = async (): Promise<void> => {
  if (!isAuthenticated()) return;
  
  const userData = await getUserData();
  const affirmationsCount = userData.myAffirmations?.length || 0;
  
  if (affirmationsCount === 0) return;
  
  // Use smart ordering to get the next best affirmation
  const smartAffirmation = await getSmartOrderedAffirmation();
  
  if (smartAffirmation) {
    // Try to update to the smart ordered affirmation's index
    try {
      await saveUserDataToFirestore({ currentAffirmationIndex: smartAffirmation.index });
      console.log('🎯 [SMART ORDER] Moved to next affirmation:', smartAffirmation.text.substring(0, 50));
    } catch (error) {
      console.log('🎯 [SMART ORDER] Could not save next index, but smart ordering still working:', error.message);
    }
  } else {
    // Fallback to sequential ordering if smart ordering fails
    const currentIndex = userData.currentAffirmationIndex || 0;
    const nextIndex = (currentIndex + 1) % affirmationsCount;
    try {
      await saveUserDataToFirestore({ currentAffirmationIndex: nextIndex });
      console.log('🎯 [SMART ORDER] Fallback to sequential ordering, index:', nextIndex);
    } catch (error) {
      console.log('🎯 [SMART ORDER] Could not save fallback index:', error.message);
    }
  }
};

// Add affirmation
export const addMyAffirmation = async (affirmation: {
  text: string;
  category: string;
  source?: 'custom' | 'quiz' | 'cosmic';
}): Promise<void> => {
  if (!isAuthenticated()) return;
  
  const newAffirmation: StoredAffirmation = {
    id: '', // Will be set by Firestore
    text: affirmation.text,
    category: affirmation.category,
    dateAdded: new Date().toISOString(),
    source: affirmation.source || 'custom',
    successDates: [],
    dailyFrequency: {},
    totalCount: 0,
    isPublic: affirmation.source === 'custom' ? false : true
  };
  
  await addAffirmationToFirestore(newAffirmation);
};

// Track affirmation success
export const trackAffirmationSuccess = async (affirmationId: string): Promise<void> => {
  console.log('🔥 [TRACKING] trackAffirmationSuccess called with ID:', affirmationId);
  
  if (!isAuthenticated()) {
    console.log('🔥 [TRACKING] Not authenticated, skipping tracking');
    return;
  }
  
  // Additional check to ensure auth state is stable
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('🔥 [TRACKING] User became unauthenticated during call, skipping affirmation tracking');
      return;
    }
  } catch (error) {
    console.log('🔥 [TRACKING] Authentication check failed, skipping affirmation tracking:', error.message);
    return;
  }
  
  const userData = await getUserData();
  const affirmation = userData.myAffirmations?.find(a => a.id === affirmationId);
  
  if (!affirmation) {
    console.log('🔥 [TRACKING] Affirmation not found with ID:', affirmationId);
    console.log('🔥 [TRACKING] Available affirmations:', userData.myAffirmations?.map(a => ({id: a.id, text: a.text.substring(0, 30)})));
    return;
  }
  
  const today = new Date().toISOString().split('T')[0];
  const successDates = affirmation.successDates || [];
  const dailyFrequency = affirmation.dailyFrequency || {};
  const oldTotalCount = affirmation.totalCount || 0;
  
  console.log('🔥 [TRACKING] Before update:', {
    affirmationText: affirmation.text.substring(0, 50),
    today,
    currentSuccessDates: successDates,
    currentTotalCount: oldTotalCount
  });
  
  if (!successDates.includes(today)) {
    successDates.push(today);
    console.log('🔥 [TRACKING] Added today to successDates');
  } else {
    console.log('🔥 [TRACKING] Today already in successDates');
  }
  
  dailyFrequency[today] = (dailyFrequency[today] || 0) + 1;
  const totalCount = oldTotalCount + 1;
  
  console.log('🔥 [TRACKING] After update:', {
    newSuccessDates: successDates,
    newTotalCount: totalCount,
    todayFrequency: dailyFrequency[today]
  });
  
  try {
    await updateAffirmationInFirestore(affirmationId, {
      successDates,
      dailyFrequency,
      totalCount
    });
    console.log('🔥 [TRACKING] Successfully updated affirmation in Firestore');
  } catch (error) {
    console.error('🔥 [TRACKING] Error updating affirmation in Firestore:', error);
    throw error;
  }
};

// Remove affirmation
export const removeMyAffirmation = async (affirmationId: string): Promise<void> => {
  if (!isAuthenticated()) return;
  await deleteAffirmationFromFirestore(affirmationId);
};

// Toggle affirmation visibility
export const toggleAffirmationVisibility = async (affirmationId: string): Promise<void> => {
  if (!isAuthenticated()) return;
  
  const userData = await getUserData();
  const affirmation = userData.myAffirmations?.find(a => a.id === affirmationId);
  
  if (!affirmation) return;
  
  await updateAffirmationInFirestore(affirmationId, {
    isPublic: !affirmation.isPublic
  });
};

// Helper functions
const getYesterday = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

// Add quiz affirmations (Firestore version)
export const addQuizAffirmations = async (affirmations: Array<{text: string, category: string}>): Promise<void> => {
  if (!isAuthenticated()) return;
  
  try {
    for (const affirmation of affirmations) {
      await addMyAffirmation({
        text: affirmation.text,
        category: affirmation.category,
        source: 'quiz'
      });
    }
  } catch (error) {
    console.error('Error adding quiz affirmations:', error);
    throw error;
  }
};

// Export initialization functions
export { initializeUserData, warmUpFirestore } from '../services/firestore';