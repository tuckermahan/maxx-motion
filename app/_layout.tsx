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
  const [isReady, setIsReady] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const prepare = async () => {
      try {
        // Load fonts
        if (loaded) {
          await SplashScreen.hideAsync();
        }

        // Check authentication status
        const { data, error } = await supabase.auth.getSession();
        const hasSession = !!data.session;
        setIsAuthenticated(hasSession);

        // Set up auth state listener
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth state change:', event);
          setIsAuthenticated(!!session);

          if (event === 'SIGNED_OUT') {
            console.log('User signed out, redirecting to home');
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            } else {
              router.replace('/');
            }
          }
        });

        // Mark as ready after everything is set up
        setIsReady(true);

        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Initialization error:', err);
        setIsAuthenticated(false);
        setIsReady(true);
      }
    };

    prepare();
  }, [loaded]);

  // Show loading screen while preparing
  if (!isReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  // Render the appropriate navigation stack based on auth status
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <UserProvider>
        {/* Use the conditional rendering from development branch if needed */}
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
