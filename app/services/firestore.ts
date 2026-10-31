import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData, StoredAffirmation } from '../utils/storage-firestore';

// Collection names
const USERS_COLLECTION = 'users';
const AFFIRMATIONS_COLLECTION = 'affirmations';

// Cache for user data to avoid repeated Firestore calls
let userDataCache: { data: UserData | null; timestamp: number | null } = {
  data: null,
  timestamp: null
};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Default affirmations for new users
const DEFAULT_AFFIRMATIONS = [
  {
    id: 'default_1',
    text: 'I am loved by the universe',
    source: 'default' as const,
    dateAdded: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    category: 'self-love',
    isPublic: true,
    totalCount: 0,
    successDates: [],
    dailyFrequency: {}
  },
  {
    id: 'default_2', 
    text: 'I believe in my full potential',
    source: 'default' as const,
    dateAdded: new Date().toISOString().split('T')[0],
    category: 'growth',
    isPublic: true,
    totalCount: 0,
    successDates: [],
    dailyFrequency: {}
  },
  {
    id: 'default_3',
    text: 'I am connected to source',
    source: 'default' as const,
    dateAdded: new Date().toISOString().split('T')[0],
    category: 'spiritual',
    isPublic: true,
    totalCount: 0,
    successDates: [],
    dailyFrequency: {}
  }
];

// Get current user ID
const getCurrentUserId = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');
  return user.uid;
};

// Check if we're online
const isOnline = () => {
  // In React Native, we can check network status
  // For now, we'll assume online but handle offline errors gracefully
  return true;
};

// Clean data to remove undefined values (Firestore doesn't accept undefined)
const cleanData = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanData);
  
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = cleanData(value);
    }
  }
  return cleaned;
};

// Migrate data from AsyncStorage to Firestore (one-time migration)
export const migrateDataToFirestore = async () => {
  try {
    const userId = getCurrentUserId();
    console.log('Starting migration for user:', userId);
    
    // Get existing local data
    const localDataStr = await AsyncStorage.getItem('@user_data');
    if (!localDataStr) {
      console.log('No local data to migrate, initializing with default affirmations');
      
      // Create default affirmations in subcollection
      const defaultAffirmationIds: string[] = [];
      for (const affirmation of DEFAULT_AFFIRMATIONS) {
        const affirmationRef = doc(collection(db, USERS_COLLECTION, userId, AFFIRMATIONS_COLLECTION));
        await setDoc(affirmationRef, {
          ...affirmation,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        defaultAffirmationIds.push(affirmationRef.id);
      }

      // Initialize user data in Firestore with default affirmations
      await setDoc(doc(db, USERS_COLLECTION, userId), {
        currentAffirmation: DEFAULT_AFFIRMATIONS[0],
        lastAffirmationDate: null,
        streakData: {
          count: 0,
          lastDate: null,
          affirmations: []
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        initialized: true
      });
      return;
    }

    const localData: UserData = JSON.parse(localDataStr);
    console.log('Migrating local data:', localData);

    // Migrate affirmations to subcollection
    const affirmationsToMigrate = localData.myAffirmations || [];
    const migratedAffirmationIds: string[] = [];

    for (const affirmation of affirmationsToMigrate) {
      const affirmationRef = doc(collection(db, USERS_COLLECTION, userId, AFFIRMATIONS_COLLECTION));
      await setDoc(affirmationRef, {
        ...affirmation,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      migratedAffirmationIds.push(affirmationRef.id);
    }

    // Migrate user data (without affirmations array)
    await setDoc(doc(db, USERS_COLLECTION, userId), {
      currentAffirmation: localData.currentAffirmation || null,
      lastAffirmationDate: localData.lastAffirmationDate || null,
      streakData: localData.streakData || {
        count: 0,
        lastDate: null,
        affirmations: []
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      migrated: true,
      migratedAt: serverTimestamp()
    });

    // Clear local storage after successful migration
    await AsyncStorage.removeItem('@user_data');
    console.log('Migration completed successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

// Get user data from Firestore
export const getUserDataFromFirestore = async (): Promise<UserData> => {
  const startTime = Date.now();
  console.log('🕐 [FIRESTORE TIMING] getUserDataFromFirestore started at:', new Date(startTime).toISOString());
  
  // Check cache first
  if (userDataCache.data && userDataCache.timestamp) {
    const cacheAge = Date.now() - userDataCache.timestamp;
    if (cacheAge < CACHE_DURATION) {
      console.log('🕐 [FIRESTORE TIMING] Returning cached data, age:', cacheAge, 'ms');
      return userDataCache.data;
    }
  }
  
  try {
    const userId = getCurrentUserId();
    console.log('🕐 [FIRESTORE TIMING] User ID:', userId);
    
    // Get user document
    const userDocStart = Date.now();
    console.log('🕐 [FIRESTORE TIMING] Fetching user document...');
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    const userDocDuration = Date.now() - userDocStart;
    console.log('🕐 [FIRESTORE TIMING] User document fetched in:', userDocDuration, 'ms');
    
    // Get affirmations from subcollection
    const affirmationsStart = Date.now();
    console.log('🕐 [FIRESTORE TIMING] Fetching affirmations subcollection...');
    const affirmationsSnapshot = await getDocs(
      collection(db, USERS_COLLECTION, userId, AFFIRMATIONS_COLLECTION)
    );
    const affirmationsDuration = Date.now() - affirmationsStart;
    console.log('🕐 [FIRESTORE TIMING] Affirmations fetched in:', affirmationsDuration, 'ms (', (affirmationsDuration / 1000).toFixed(1), 'seconds)');
    console.log('🕐 [FIRESTORE TIMING] Number of affirmations:', affirmationsSnapshot.size);
    
    const affirmations: StoredAffirmation[] = [];
    affirmationsSnapshot.forEach((doc) => {
      affirmations.push({ id: doc.id, ...doc.data() } as StoredAffirmation);
    });

    const totalDuration = Date.now() - startTime;
    console.log('🕐 [FIRESTORE TIMING] Total Firestore fetch time:', totalDuration, 'ms (', (totalDuration / 1000).toFixed(1), 'seconds)');

    let result: UserData;
    if (userDoc.exists()) {
      const userData = userDoc.data();
      result = {
        ...userData,
        myAffirmations: affirmations
      } as UserData;
    } else {
      console.log('🕐 [FIRESTORE TIMING] User document does not exist, returning defaults');
      // First time user - provide default affirmations
      result = {
        myAffirmations: [...DEFAULT_AFFIRMATIONS],
        currentAffirmation: DEFAULT_AFFIRMATIONS[0], // Set the first one as current
        lastAffirmationDate: null,
        streakData: {
          count: 0,
          lastDate: null,
          affirmations: []
        }
      };
    }
    
    // Update cache
    userDataCache = {
      data: result,
      timestamp: Date.now()
    };
    console.log('🕐 [FIRESTORE TIMING] Cache updated');
    
    return result;
  } catch (error) {
    console.error('🔥 [FIRESTORE ERROR] Failed to get user data from Firestore:', error);
    console.error('🔥 [FIRESTORE ERROR] Error code:', error.code);
    console.error('🔥 [FIRESTORE ERROR] Error message:', error.message);
    throw error; // Always throw the error so you can see what's wrong
  }
};

// Save user data to Firestore
export const saveUserDataToFirestore = async (data: Partial<UserData>) => {
  try {
    // Check if user is authenticated before proceeding
    const user = auth.currentUser;
    if (!user) {
      console.log('No authenticated user, skipping save operation');
      return;
    }
    
    const userId = user.uid;
    const { myAffirmations, ...userData } = data;
    
    // Clean the data to remove undefined values
    const cleanedData = cleanData({
      ...userData,
      updatedAt: serverTimestamp()
    });
    
    // Create or update user document (without affirmations)
    await setDoc(doc(db, USERS_COLLECTION, userId), cleanedData, { merge: true });
    
    // Invalidate cache
    userDataCache = { data: null, timestamp: null };
    console.log('Cache invalidated after save');
    
  } catch (error) {
    console.error('🔥 [FIRESTORE ERROR] Failed to save user data:', error);
    throw error; // Always throw to expose the real issue
  }
};

// Add affirmation to Firestore
export const addAffirmationToFirestore = async (affirmation: StoredAffirmation) => {
  try {
    const userId = getCurrentUserId();
    const affirmationRef = doc(collection(db, USERS_COLLECTION, userId, AFFIRMATIONS_COLLECTION));
    
    // Clean the affirmation data to remove undefined values
    const cleanedAffirmation = cleanData({
      ...affirmation,
      id: affirmationRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('Adding cleaned affirmation:', cleanedAffirmation);
    await setDoc(affirmationRef, cleanedAffirmation);
    
    // Invalidate cache
    userDataCache = { data: null, timestamp: null };
    console.log('Cache invalidated after adding affirmation');
    
    return affirmationRef.id;
  } catch (error) {
    console.error('Error adding affirmation:', error);
    throw error;
  }
};

// Update affirmation in Firestore
export const updateAffirmationInFirestore = async (affirmationId: string, updates: Partial<StoredAffirmation>) => {
  try {
    const userId = getCurrentUserId();
    await updateDoc(
      doc(db, USERS_COLLECTION, userId, AFFIRMATIONS_COLLECTION, affirmationId), 
      {
        ...updates,
        updatedAt: serverTimestamp()
      }
    );
    
    // Invalidate cache
    userDataCache = { data: null, timestamp: null };
    console.log('Cache invalidated after updating affirmation');
  } catch (error) {
    console.error('Error updating affirmation:', error);
    throw error;
  }
};

// Delete affirmation from Firestore
export const deleteAffirmationFromFirestore = async (affirmationId: string) => {
  try {
    const userId = getCurrentUserId();
    await deleteDoc(doc(db, USERS_COLLECTION, userId, AFFIRMATIONS_COLLECTION, affirmationId));
    
    // Invalidate cache
    userDataCache = { data: null, timestamp: null };
    console.log('Cache invalidated after deleting affirmation');
  } catch (error) {
    console.error('Error deleting affirmation:', error);
    throw error;
  }
};

// Warm up Firestore connection by making a lightweight query
export const warmUpFirestore = async () => {
  try {
    console.log('🔥 [FIRESTORE] Warming up Firestore connection...');
    const startTime = Date.now();
    
    // Try to get user ID (might fail if not logged in yet)
    if (auth.currentUser) {
      try {
        const userId = auth.currentUser.uid;
        // Make a lightweight query to establish connection
        await getDoc(doc(db, USERS_COLLECTION, userId));
      } catch (firestoreError) {
        console.log('🔥 [FIRESTORE] User-specific warmup failed:', firestoreError);
      }
    } else {
      // If not authenticated, just access the db to establish connection
      console.log('🔥 [FIRESTORE] Not authenticated yet, skipping user-specific warmup');
    }
    
    const duration = Date.now() - startTime;
    console.log('🔥 [FIRESTORE] Warmup completed in:', duration, 'ms');
  } catch (error) {
    console.log('🔥 [FIRESTORE] Warmup failed:', error);
  }
};

// Initialize user data - called immediately after login
export const initializeUserData = async () => {
  try {
    // Check if user is actually authenticated before proceeding
    const user = auth.currentUser;
    if (!user) {
      console.log('No authenticated user yet, skipping initialization');
      return;
    }
    
    const userId = user.uid;
    console.log('Initializing data for user:', userId);
    
    // Check if user already exists
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    
    if (!userDoc.exists()) {
      console.log('New user detected, creating default affirmations');
      
      // Create default affirmations in subcollection
      const affirmationPromises = DEFAULT_AFFIRMATIONS.map(async (affirmation) => {
        const affirmationRef = doc(collection(db, USERS_COLLECTION, userId, AFFIRMATIONS_COLLECTION));
        return setDoc(affirmationRef, {
          ...affirmation,
          id: affirmationRef.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      
      await Promise.all(affirmationPromises);
      
      // Initialize user data with first default affirmation
      await setDoc(doc(db, USERS_COLLECTION, userId), {
        currentAffirmationIndex: 0,
        lastAffirmationDate: null,
        streakData: {
          count: 0,
          lastDate: null,
          affirmations: []
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        initialized: true
      });
      
      console.log('Default affirmations created successfully');
    } else {
      // Check if user has affirmations
      const affirmationsSnapshot = await getDocs(
        collection(db, USERS_COLLECTION, userId, AFFIRMATIONS_COLLECTION)
      );
      
      if (affirmationsSnapshot.empty) {
        console.log('User exists but has no affirmations, adding defaults');
        
        // Add default affirmations
        const affirmationPromises = DEFAULT_AFFIRMATIONS.map(async (affirmation) => {
          const affirmationRef = doc(collection(db, USERS_COLLECTION, userId, AFFIRMATIONS_COLLECTION));
          return setDoc(affirmationRef, {
            ...affirmation,
            id: affirmationRef.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        });
        
        await Promise.all(affirmationPromises);
        
        // Update user to set currentAffirmationIndex if not set
        await updateDoc(doc(db, USERS_COLLECTION, userId), {
          currentAffirmationIndex: 0,
          updatedAt: serverTimestamp()
        });
        
        console.log('Default affirmations added to existing user');
      }
    }
  } catch (error) {
    console.error('🔥 [FIRESTORE ERROR] Failed to initialize user data:', error);
    throw error; // Always throw to expose the real issue
  }
};

// Check if user needs migration or initialization
export const checkNeedsMigration = async (): Promise<boolean> => {
  try {
    const userId = getCurrentUserId();
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    
    if (!userDoc.exists()) {
      // No Firestore data - could be migration or new user
      console.log('No user document found, needs initialization');
      return true; // Always initialize new users with default affirmations
    }
    
    // Check if user has affirmations
    const affirmationsSnapshot = await getDocs(
      collection(db, USERS_COLLECTION, userId, AFFIRMATIONS_COLLECTION)
    );
    
    if (affirmationsSnapshot.empty) {
      console.log('User exists but has no affirmations, needs default affirmations');
      return true;
    }
    
    // User exists and has affirmations, no migration needed
    return false;
  } catch (error) {
    console.error('🔥 [FIRESTORE ERROR] Failed to check migration status:', error);
    throw error; // Always throw to expose the real issue
  }
};

// Delete user account and all associated data
export const deleteUserAccount = async () => {
  try {
    const userId = getCurrentUserId();
    console.log('Deleting account for user:', userId);
    
    // Delete all affirmations in subcollection
    const affirmationsSnapshot = await getDocs(
      collection(db, USERS_COLLECTION, userId, AFFIRMATIONS_COLLECTION)
    );
    
    const deletePromises = affirmationsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    console.log('Deleted all affirmations');
    
    // Delete user document
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
    console.log('Deleted user document');
    
    // Clear cache
    userDataCache = { data: null, timestamp: null };
    
    // Clear any local storage
    try {
      await AsyncStorage.clear();
      console.log('Cleared local storage');
    } catch (error) {
      console.log('Error clearing local storage:', error);
    }
    
    // Delete the user authentication account
    const user = auth.currentUser;
    if (user) {
      await user.delete();
      console.log('Deleted authentication account');
    }
    
  } catch (error) {
    console.error('🔥 [FIRESTORE ERROR] Failed to delete user account:', error);
    throw error;
  }
};