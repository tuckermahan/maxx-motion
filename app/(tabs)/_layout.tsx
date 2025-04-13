import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { AdminMenu } from '../../components/AdminMenu';
import { useUser } from '../../contexts/UserContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { userProfile, loading: userLoading } = useUser();
  
  // Log user profile data to verify is_admin value
  useEffect(() => {
    if (userProfile) {
      console.log('User profile loaded:', userProfile);
      console.log('Is admin?', userProfile.is_admin);
    }
  }, [userProfile]);
  
  // Additional auth check specific to the tabs section
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error || !data.session) {
          // Not authenticated, redirect to login
          console.log('Tabs: Not authenticated, redirecting to login');
          router.replace('/login');
          return;
        }
        
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Tabs auth check error:', err);
        router.replace('/login');
      }
    };
    
    checkAuth();
  }, []);
  
  // Add debug logs before rendering
  useEffect(() => {
    if (userProfile) {
      console.log('In TabLayout, about to render, userProfile:', userProfile);
      console.log('Is admin check result:', !!userProfile.is_admin);
    }
  }, [userProfile]);
  
  // Show loading indicator until auth check completes
  if (isAuthenticated === null || userLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={styles.text}>Loading dashboard...</Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.wrapper, {overflow: 'visible'}]}>
      <View style={{
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 9999,
      }}>
        {userProfile?.is_admin ? (
          <AdminMenu position="topRight" />
        ) : (
          <View />
        )}
      </View>
      
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colorScheme === 'dark' ? '#ffffff' : '#0a7ea4',
          tabBarInactiveTintColor: colorScheme === 'dark' ? '#888888' : '#888888',
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <IconSymbol name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="activity"
          options={{
            title: 'Activity',
            tabBarIcon: ({ color }) => <IconSymbol name="figure.walk" color={color} />,
          }}
        />
        <Tabs.Screen
          name="team"
          options={{
            title: 'Team',
            tabBarIcon: ({ color }) => <IconSymbol name="person.3.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="leaderboard"
          options={{
            title: 'Leaderboard',
            tabBarIcon: ({ color }) => <IconSymbol name="list.number" color={color} />,
          }}
        />
        <Tabs.Screen
          name="achievements"
          options={{
            title: 'Achievements',
            tabBarIcon: ({ color }) => <IconSymbol name="trophy.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <IconSymbol name="person.fill" color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 20,
    fontSize: 16,
  },
  wrapper: {
    flex: 1,
    position: 'relative',
  },
});
