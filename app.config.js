import { version } from './package.json';

// Firebase iOS config file. Download your own GoogleService-Info.plist from the
// Firebase console and place it in the project root (it is git-ignored).
const getGoogleServicesPlistPath = () => {
  return process.env.GOOGLE_SERVICES_PLIST || './GoogleService-Info.plist';
};

// Identifiers are placeholders: set your own bundle ID, Expo owner and EAS project.
const BUNDLE_ID = process.env.APP_BUNDLE_ID || "com.example.sayura";

export default {
  expo: {
    name: "Sayura",
    slug: "sayura",
    owner: process.env.EXPO_OWNER,
    version,
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "automatic",
    assetBundlePatterns: ["**/*"],
    ios: {
      bundleIdentifier: BUNDLE_ID,
      supportsTablet: true,
      googleServicesFile: getGoogleServicesPlistPath(),
      scheme: BUNDLE_ID,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSMicrophoneUsageDescription: "Sayura needs access to your microphone to record your affirmations and spread them to the universe.",
        NSCameraUsageDescription: "This app may request camera access for features that enhance your experience.",
        GIDClientID: process.env.GOOGLE_IOS_CLIENT_ID,
        CFBundleURLTypes: [
          {
            CFBundleURLName: "google-signin",
            // Reversed iOS client ID from your Google Cloud OAuth client
            CFBundleURLSchemes: [process.env.GOOGLE_IOS_URL_SCHEME || "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID"]
          }
        ]
      }
    },
    android: {
      package: BUNDLE_ID,
      permissions: ["RECORD_AUDIO"]
    },
    web: {
      bundler: "metro",
      output: "server",
      favicon: "./assets/images/favicon.png"
    },
    plugins: ["expo-router"],
    scheme: BUNDLE_ID,
    extra: {
      // Everything in `extra` ships inside the app bundle, so only public client
      // identifiers belong here. Secret keys (AssemblyAI, Groq, Azure OpenAI) are read
      // by the +api server routes from the server environment and never appear below.
      revenueCatPublicSdkKey: process.env.REVENUE_CAT_PUBLIC_SDK_KEY,
      // Firebase web config is a public identifier by design; access is enforced by
      // Firestore security rules (see firestore.rules).
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
      GOOGLE_WEB_CLIENT_ID: process.env.GOOGLE_WEB_CLIENT_ID,
      GOOGLE_IOS_CLIENT_ID: process.env.GOOGLE_IOS_CLIENT_ID,
      eas: { projectId: process.env.EAS_PROJECT_ID }
    }
  }
};

