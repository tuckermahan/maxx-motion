import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/lib/auth';
import { AdminMenu } from '../../components/AdminMenu';
import { useUser } from '../../contexts/UserContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { userProfile, loading: userLoading } = useUser();
  const { user, loading: authLoading } = useAuth();
  const [dashboardReady, setDashboardReady] = useState(false);
  
  // Setup quick loading to avoid blocking UI
  useEffect(() => {
    console.log('🏁 TabLayout mounted with auth state:', { 
      isLoggedIn: !!user,
      userLoading,
      authLoading,
    });
    
    // Set dashboard ready after a short delay to ensure we don't get stuck
    const timer = setTimeout(() => {
      setDashboardReady(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Log user profile data for debugging
  useEffect(() => {
    if (userProfile) {
      console.log('👤 User profile loaded:', userProfile.email);
      console.log('👑 Is admin?', userProfile.is_admin);
    }
  }, [userProfile]);

  // Show loading indicator while profile is loading, but not for too long
  if ((userLoading || authLoading) && !dashboardReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#C41E3A" />
        <Text style={styles.text}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Admin Menu for admin users */}
      {userProfile?.is_admin && (
        <View style={styles.adminMenuContainer}>
          <AdminMenu position="topRight" />
        </View>
      )}
      
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colorScheme === 'dark' ? '#ffffff' : '#C41E3A',
          tabBarInactiveTintColor: colorScheme === 'dark' ? '#888888' : '#888888',
          tabBarStyle: {
            height: 60,
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
            backgroundColor: colorScheme === 'dark' ? '#121212' : '#ffffff',
          },
          tabBarIcon: () => null,
          tabBarIconStyle: {
            display: 'none',
          },
          tabBarLabelStyle: {
            fontSize: 15,
            fontWeight: '500',
          },
          tabBarShowLabel: true,
          tabBarActiveBackgroundColor: 'transparent',
          tabBarInactiveBackgroundColor: 'transparent',
          tabBarItemStyle: {
            height: 60,
            padding: 0,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <IconSymbol name="house.fill" color={color} />,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="activity"
          options={{
            title: 'Activity',
            tabBarIcon: ({ color }) => <IconSymbol name="figure.walk" color={color} />,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="team"
          options={{
            title: 'Team',
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="leaderboard"
          options={{
            title: 'Leaderboard',
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="achievements"
          options={{
            title: 'Achievements',
            tabBarIcon: ({ color }) => <IconSymbol name="trophy.fill" color={color} />,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <IconSymbol name="person.fill" color={color} />,
            headerShown: false,
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
    color: '#666',
  },
  wrapper: {
    flex: 1,
    position: 'relative',
    overflow: 'visible',
  },
  adminMenuContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 9999,
  },
});
