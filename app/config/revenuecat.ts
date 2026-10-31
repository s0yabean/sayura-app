import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

// Import the UI components for paywalls
let PaywallView: any = null;
try {
  const PurchasesUI = require('react-native-purchases-ui');
  PaywallView = PurchasesUI.PaywallView;
} catch (error) {
  console.log('RevenueCat UI not available in this environment');
}

// RevenueCat configuration
export const REVENUECAT_API_KEY = {
  ios: Constants.expoConfig?.extra?.revenueCatPublicSdkKey || process.env.REVENUE_CAT_PUBLIC_SDK_KEY || '',
  android: Constants.expoConfig?.extra?.revenueCatPublicSdkKey || process.env.REVENUE_CAT_PUBLIC_SDK_KEY || '',
};

// Initialize RevenueCat with Expo Go Preview API Mode support
export const initializeRevenueCat = async (userId?: string) => {
  try {
    // Set debug logs in development
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
    }

    // Check environment - Expo Go has built-in Preview API Mode
    const isExpoGo = Constants.executionEnvironment === 'storeClient';
    
    if (isExpoGo) {
      console.log('🧪 Running in Expo Go - RevenueCat Preview API Mode enabled');
      console.log('📱 Mock purchases will work, real purchases need development build');
    } else {
      console.log('🚀 Running in development/production build - Full RevenueCat functionality');
    }

    // Get API key for current platform
    const apiKey = Platform.OS === 'ios' 
      ? REVENUECAT_API_KEY.ios 
      : REVENUECAT_API_KEY.android;

    if (!apiKey) {
      console.error('❌ RevenueCat API key missing for', Platform.OS);
      console.error('📝 Add REVENUE_CAT_PUBLIC_SDK_KEY to your environment variables');
      return;
    }

    console.log('🔑 Configuring with', Platform.OS, 'API key...');

    // Configure RevenueCat - works in both Expo Go (mock) and development build (real)
    await Purchases.configure({
      apiKey: apiKey,
      appUserID: userId
    });

    if (isExpoGo) {
      console.log('✅ RevenueCat Preview API Mode configured - Mock functionality enabled');
    } else {
      console.log('✅ RevenueCat configured - Real purchase functionality enabled');
    }

  } catch (error) {
    console.error('❌ RevenueCat configuration failed:', error);
    console.error('📝 Check your API key and environment variables');
    
    // Provide helpful error context
    if (error.message.includes('Invalid API key')) {
      const isExpoGo = Constants.executionEnvironment === 'storeClient';
      if (isExpoGo) {
        console.error('💡 Even in Expo Go Preview mode, you need a valid API key');
      }
      console.error('🔑 Verify your REVENUE_CAT_PUBLIC_SDK_KEY starts with "appl_" for iOS');
    }
  }
};

// Get available offerings
export const getOfferings = async (): Promise<any | null> => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    return null;
  }
};

// Purchase a package
export const purchasePackage = async (packageToPurchase: any) => {
  try {
    const purchaserInfo = await Purchases.purchasePackage(packageToPurchase);
    return purchaserInfo;
  } catch (error) {
    console.error('Purchase failed:', error);
    throw error;
  }
};

// Check if user has active subscription
export const checkSubscriptionStatus = async (): Promise<boolean> => {
  try {
    const purchaserInfo = await Purchases.getCustomerInfo();
    return Object.keys(purchaserInfo.entitlements.active).length > 0;
  } catch (error) {
    console.error('Failed to check subscription status:', error);
    return false;
  }
};

// Export PaywallView for use in components
export { PaywallView };

// Export Purchases for direct SDK access
export default Purchases;