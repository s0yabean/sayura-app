import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserData {
  currentStreak: number;
  lastAffirmationDate: string | null;
  totalRipples: number;
  currentAffirmationIndex: number; // Index of current affirmation in ritual
  dailyUnspokenIndex?: { [date: string]: number }; // Track which unspoken affirmation to show per day
  affirmations: Array<{
    id: string;
    text: string;
    date: string;
    hearts: number;
  }>;
  myAffirmations: Array<{
    id: string;
    text: string;
    category: string;
    dateAdded: string;
    source?: 'custom' | 'quiz' | 'cosmic' | 'community' | 'default';
    successDates?: string[]; // Array of dates when this affirmation was successful
    dailyFrequency?: { [date: string]: number }; // Number of times done each day
    totalCount?: number; // Total number of times this affirmation has been completed (all-time)
    isPublic?: boolean; // Whether this affirmation is public (visible in ripples) or private
  }>;
}

const STORAGE_KEY = 'sayura_user_data';

export const getUserData = async (): Promise<UserData> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      const userData = JSON.parse(data);
      
      // Migration: Add isPublic field to existing affirmations if missing
      if (userData.myAffirmations) {
        let needsMigration = false;
        userData.myAffirmations = userData.myAffirmations.map((aff: any) => {
          if (aff.isPublic === undefined) {
            needsMigration = true;
            // Set visibility based on source: custom = private, others = public (including default)
            const isPublic = aff.source === 'custom' ? false : true;
            return { ...aff, isPublic };
          }
          return aff;
        });
        
        // Save the migrated data
        if (needsMigration) {
          await saveUserData(userData);
          console.log('Migrated affirmations to include isPublic field based on source');
        }
      }
      
      return userData;
    }
  } catch (error) {
    console.error('Error reading user data:', error);
  }
  
  // Return default data
  return {
    currentStreak: 0,
    lastAffirmationDate: null,
    totalRipples: 0,
    currentAffirmationIndex: 0,
    affirmations: [],
    myAffirmations: []
  };
};

export const saveUserData = async (data: UserData): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

export const updateStreak = async (affirmationText: string): Promise<UserData> => {
  const userData = await getUserData();
  const now = new Date();
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  if (userData.lastAffirmationDate) {
    const lastDate = new Date(userData.lastAffirmationDate);
    const lastDateStr = lastDate.toISOString().split('T')[0];
    
    // Check if it's the same day
    if (lastDateStr === today) {
      // Already affirmed today, don't update streak
      return userData;
    }
    
    // Check if it's the next day (continuous streak)
    const nextDay = new Date(lastDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split('T')[0];
    
    if (nextDayStr === today) {
      userData.currentStreak += 1;
    } else {
      // Streak broken, reset to 1
      userData.currentStreak = 1;
    }
  } else {
    // First affirmation
    userData.currentStreak = 1;
  }
  
  userData.lastAffirmationDate = now.toISOString();
  
  // Add affirmation to history
  userData.affirmations.push({
    id: Date.now().toString(),
    text: affirmationText,
    date: now.toISOString(),
    hearts: 0
  });
  
  await saveUserData(userData);
  return userData;
};

// Mock data for leaderboard (in a real app, this would come from a backend)
export const getLeaderboardData = async () => {
  const userData = await getUserData();
  
  // Add user's own affirmations
  const userAffirmations = userData.affirmations.map(aff => ({
    ...aff,
    isOwn: true,
    lastPublished: aff.date,
    streakDays: userData.currentStreak
  }));
  
  // Mock community affirmations
  const communityAffirmations = [
    { 
      id: '1', 
      text: 'I am worthy of love and abundance in all forms', 
      hearts: 42, 
      isOwn: false,
      lastPublished: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      streakDays: 7
    },
    { 
      id: '2', 
      text: 'Every day I grow stronger and more confident', 
      hearts: 38, 
      isOwn: false,
      lastPublished: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      streakDays: 14
    },
    { 
      id: '3', 
      text: 'I embrace change and trust the journey', 
      hearts: 35, 
      isOwn: false,
      lastPublished: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      streakDays: 3
    },
    { 
      id: '4', 
      text: 'My potential is limitless and I am capable of achieving my dreams', 
      hearts: 31, 
      isOwn: false,
      lastPublished: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
      streakDays: 21
    },
    { 
      id: '5', 
      text: 'I radiate positive energy and attract good things', 
      hearts: 28, 
      isOwn: false,
      lastPublished: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      streakDays: 5
    },
  ];
  
  // Combine and sort by hearts (ripples)
  return [...userAffirmations, ...communityAffirmations].sort((a, b) => b.hearts - a.hearts);
};

export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const addMyAffirmation = async (text: string, category: string, source: 'custom' | 'quiz' | 'cosmic' | 'community' = 'custom'): Promise<void> => {
  const userData = await getUserData();
  
  // Ensure myAffirmations array exists
  if (!userData.myAffirmations) {
    userData.myAffirmations = [];
  }
  
  const newAffirmation = {
    id: Date.now().toString(),
    text,
    category,
    dateAdded: new Date().toISOString(),
    source,
    isPublic: source === 'custom' ? false : true // Custom = private, Quiz/Cosmic/Community = public
  };
  
  userData.myAffirmations.push(newAffirmation);
  await saveUserData(userData);
};

export const addQuizAffirmations = async (affirmations: Array<{text: string, category: string}>): Promise<void> => {
  const userData = await getUserData();
  const now = new Date().toISOString();
  
  // Ensure myAffirmations array exists
  if (!userData.myAffirmations) {
    userData.myAffirmations = [];
  }
  
  affirmations.forEach(aff => {
    userData.myAffirmations.push({
      id: Date.now().toString() + Math.random(),
      text: aff.text,
      category: aff.category,
      dateAdded: now,
      source: 'quiz',
      isPublic: true // Quiz affirmations are always public
    });
  });
  
  await saveUserData(userData);
};

export const removeMyAffirmation = async (affirmationId: string): Promise<void> => {
  const userData = await getUserData();
  
  // Ensure myAffirmations array exists
  if (!userData.myAffirmations) {
    userData.myAffirmations = [];
  }
  
  userData.myAffirmations = userData.myAffirmations.filter(aff => aff.id !== affirmationId);
  await saveUserData(userData);
};

// Get current affirmation for ritual tab
export const getCurrentAffirmation = async () => {
  const userData = await getUserData();
  
  // If no affirmations, return null
  if (!userData.myAffirmations || userData.myAffirmations.length === 0) {
    return null;
  }
  
  // Get today's date
  const today = new Date().toISOString().split('T')[0];
  
  // Find affirmations not spoken today
  const unspokenToday = userData.myAffirmations.filter(aff => {
    if (!aff.dailyFrequency || !aff.dailyFrequency[today]) {
      return true; // Not spoken today
    }
    return false;
  });
  
  // If all affirmations have been spoken today, cycle through all
  if (unspokenToday.length === 0) {
    const currentIndex = userData.currentAffirmationIndex || 0;
    const validIndex = Math.min(currentIndex, userData.myAffirmations.length - 1);
    return userData.myAffirmations[validIndex];
  }
  
  // For unspoken affirmations, track which one we should show
  // Use a daily index to cycle through unspoken ones
  if (!userData.dailyUnspokenIndex) {
    userData.dailyUnspokenIndex = {};
  }
  
  let dailyIndex = userData.dailyUnspokenIndex[today] || 0;
  
  // Ensure index is valid for today's unspoken affirmations
  if (dailyIndex >= unspokenToday.length) {
    dailyIndex = 0;
  }
  
  return unspokenToday[dailyIndex];
};

// Move to next affirmation
export const moveToNextAffirmation = async (): Promise<void> => {
  const userData = await getUserData();
  
  if (!userData.myAffirmations || userData.myAffirmations.length === 0) {
    return;
  }
  
  // Get today's date
  const today = new Date().toISOString().split('T')[0];
  
  // Find affirmations not spoken today
  const unspokenToday = userData.myAffirmations.filter(aff => {
    if (!aff.dailyFrequency || !aff.dailyFrequency[today]) {
      return true; // Not spoken today
    }
    return false;
  });
  
  // Initialize daily index tracking if needed
  if (!userData.dailyUnspokenIndex) {
    userData.dailyUnspokenIndex = {};
  }
  
  // If there are unspoken affirmations for today, move to next unspoken one
  if (unspokenToday.length > 0) {
    const currentDailyIndex = userData.dailyUnspokenIndex[today] || 0;
    userData.dailyUnspokenIndex[today] = (currentDailyIndex + 1) % unspokenToday.length;
  } else {
    // If all affirmations have been spoken today, cycle through all normally
    userData.currentAffirmationIndex = (userData.currentAffirmationIndex + 1) % userData.myAffirmations.length;
  }
  
  await saveUserData(userData);
};

// Track affirmation success
export const trackAffirmationSuccess = async (affirmationId: string): Promise<void> => {
  const userData = await getUserData();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Find the affirmation
  const affirmationIndex = userData.myAffirmations.findIndex(aff => aff.id === affirmationId);
  if (affirmationIndex === -1) return;
  
  const affirmation = userData.myAffirmations[affirmationIndex];
  
  // Initialize tracking fields if they don't exist
  if (!affirmation.successDates) {
    affirmation.successDates = [];
  }
  if (!affirmation.dailyFrequency) {
    affirmation.dailyFrequency = {};
  }
  if (!affirmation.totalCount) {
    affirmation.totalCount = 0;
  }
  
  // Add today's date if not already added
  if (!affirmation.successDates.includes(today)) {
    affirmation.successDates.push(today);
  }
  
  // Increment today's frequency
  affirmation.dailyFrequency[today] = (affirmation.dailyFrequency[today] || 0) + 1;
  
  // Increment total count (all-time)
  affirmation.totalCount += 1;
  
  // Update the affirmation in the array
  userData.myAffirmations[affirmationIndex] = affirmation;
  
  await saveUserData(userData);
};

// Toggle affirmation visibility (public/private)
export const toggleAffirmationVisibility = async (affirmationId: string): Promise<void> => {
  const userData = await getUserData();
  
  // Find the affirmation
  const affirmationIndex = userData.myAffirmations.findIndex(aff => aff.id === affirmationId);
  if (affirmationIndex === -1) return;
  
  const affirmation = userData.myAffirmations[affirmationIndex];
  
  // Toggle visibility (default to public if not set)
  affirmation.isPublic = !(affirmation.isPublic ?? true);
  
  // Update the affirmation in the array
  userData.myAffirmations[affirmationIndex] = affirmation;
  
  await saveUserData(userData);
};