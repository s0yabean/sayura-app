import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useEffect } from 'react';
import { usePathname } from 'expo-router';

export default function TabLayout() {
  const pathname = usePathname();

  // Global audio cleanup on tab changes
  useEffect(() => {
    const cleanup = async () => {
      try {
        // Force reset audio mode on any tab change
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: false,
        });
        console.log('Global audio cleanup on tab change:', pathname);
      } catch (error) {
        console.log('Global audio cleanup error:', error);
      }
    };
    
    cleanup();
  }, [pathname]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fef7ed',
          borderTopColor: '#fde68a',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarActiveTintColor: '#ec4899',
        tabBarInactiveTintColor: '#d1d5db',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="paths"
        options={{
          title: 'Paths',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="sparkles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ritual',
          tabBarIcon: ({ size, color, focused }) => (
            <Ionicons 
              name={focused ? "heart" : "heart-outline"} 
              size={focused ? size + 4 : size} 
              color={color} 
              style={{ fontWeight: focused ? '900' : '400' }}
            />
          ),
          tabBarLabelStyle: {
            fontSize: 13,
            fontWeight: '700',
          },
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="library" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
      {/* Hidden tabs */}
      <Tabs.Screen
        name="leaderboard"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}