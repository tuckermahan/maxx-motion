import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { UserProvider } from '../contexts/UserContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  // Set mounted flag
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Authentication check
  useEffect(() => {
    if (!isMounted) return;

    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        const hasSession = !!data.session;
        setIsAuthenticated(hasSession);
        
        // Only check routing after we know authentication status
        if (!hasSession) {
          // Define routes that should be accessible without authentication
          const publicPaths = ['/', '/login', '/auth-callback'];
          const isPublicRoute = publicPaths.some(route => pathname === route);
          
          // If not a public route, redirect to login
          if (!isPublicRoute) {
            console.log('Redirecting to login, current path:', pathname);
            router.replace('/login');
          }
        }
        
        // Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth state change:', event);
          setIsAuthenticated(!!session);
          
          if (event === 'SIGNED_OUT') {
            // Ensure we redirect to home, not dashboard when signing out
            console.log('User signed out, redirecting to home');
            // Hard redirect to root to reset all navigation state
            setTimeout(() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/';
              } else {
                router.replace('/');
              }
            }, 0);
          }
        });
        
        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Auth check error:', err);
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, [isMounted, pathname]);

  if (!loaded || isAuthenticated === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <UserProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
          <Stack.Screen name="join-event" options={{ title: "Join Event", headerLeft: () => null }} />
          <Stack.Screen name="join-team" options={{ title: "Join Team", headerLeft: () => null }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="admin" options={{ headerShown: true }} />
        </Stack>
        <StatusBar style="auto" />
      </UserProvider>
    </ThemeProvider>
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
});
