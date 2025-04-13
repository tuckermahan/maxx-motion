import React, { useEffect, useState, useRef } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet, Platform, AppState } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/lib/auth';
import { UserProvider } from '@/contexts/UserContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// This ensures that web browser auth sessions complete properly
WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [appReady, setAppReady] = useState(false);
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [isMounted, setIsMounted] = useState(false);
  const renderedRef = useRef(false);
  
  // We'll use this state to track if we need to navigate
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  
  // Track when component has rendered at least once
  useEffect(() => {
    renderedRef.current = true;
    console.log('Root component has rendered at least once');
  }, []);

  // Handle app loading
  useEffect(() => {
    if (loaded) {
      console.log("🔤 Fonts loaded successfully");
      const timer = setTimeout(() => {
        setAppReady(true);
        SplashScreen.hideAsync().catch(e => console.log("Splash screen hide error:", e));
      }, 200);
      
      return () => clearTimeout(timer);
    } else if (error) {
      console.error("🔤 Font loading error:", error);
      setAppReady(true); // Continue even with font error
      SplashScreen.hideAsync().catch(e => console.log("Splash screen hide error:", e));
    }
  }, [loaded, error]);

  // Mark component as mounted after first render
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
      console.log('Component marked as mounted');
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Check for session on mount and handle deep links
  useEffect(() => {
    if (!isMounted) return;
    
    console.log('Checking session and setting up deep links');
    
    // Check for current session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        console.log('Found existing session');
        setPendingNavigation('/(tabs)');
      }
    });
    
    // Handle deep links
    const handleDeepLink = (event: { url: string }) => {
      console.log('Deep link event:', event.url);
      
      if (event.url.includes('auth') || event.url.includes('token') || event.url.includes('access_token')) {
        console.log('Auth deep link detected');
        
        // Just process the session, don't navigate yet
        supabase.auth.getSession().then(({ data }) => {
          if (data.session) {
            console.log('Session obtained from deep link');
            setPendingNavigation('/(tabs)');
          }
        });
      }
    };
    
    // Set up deep link handler
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Check if app was opened from deep link
    Linking.getInitialURL().then(url => {
      if (url) {
        console.log('App opened with URL:', url);
        handleDeepLink({ url });
      }
    });
    
    // For web - check URL hash
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.location.hash && 
         (window.location.hash.includes('access_token') || window.location.hash.includes('error'))) {
        console.log('Auth hash detected in URL');
        
        // Process the session
        supabase.auth.getSession().then(({ data }) => {
          if (data.session) {
            console.log('Session established from URL hash');
            
            // Clean URL
            try {
              const url = new URL(window.location.href);
              url.hash = '';
              window.history.replaceState({}, document.title, url.toString());
              console.log('URL hash cleaned');
            } catch (e) {
              console.error('Error cleaning URL:', e);
            }
            
            setPendingNavigation('/(tabs)');
          }
        });
      }
    }
    
    return () => {
      subscription.remove();
    };
  }, [isMounted]);
  
  // Handle pending navigation separately
  useEffect(() => {
    // Only attempt navigation if:
    // 1. We have a pending destination
    // 2. The component is fully mounted
    // 3. The app is ready
    // 4. We've rendered at least once
    if (pendingNavigation && isMounted && appReady && renderedRef.current) {
      console.log(`Executing pending navigation to ${pendingNavigation}`);
      
      // Use a long delay to ensure everything is ready
      const timer = setTimeout(() => {
        try {
          console.log('Navigating to:', pendingNavigation);
          // Cast the path string to any to avoid TypeScript issues
          // This is safe because we know it's a valid route
          router.replace(pendingNavigation as any);
          setPendingNavigation(null);
        } catch (e) {
          console.error('Navigation error:', e);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [pendingNavigation, isMounted, appReady, router]);

  console.log("🔄 Rendering root layout with providers");

  if (!appReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#C41E3A" />
        <Text style={styles.text}>Loading app...</Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <UserProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Slot />
          <StatusBar style="auto" />
        </ThemeProvider>
      </UserProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});