import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { handleAuthRouting } from '../lib/services/auth';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const handleOAuthCallback = async () => {
      try {
        console.log('Auth callback reached with params:', params);

        // Add a small delay to ensure root layout is mounted
        await new Promise(resolve => setTimeout(resolve, 100));

        // Refresh the session
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setError('Authentication failed. Please try again.');
          }
          return;
        }

        if (data.session) {
          console.log('User is authenticated, checking routing');
          console.log('User ID:', data.session.user.id);
          console.log('User email:', data.session.user.email);
          console.log('User metadata:', JSON.stringify(data.session.user.user_metadata));

          // Call auth routing which will create profile if needed
          await handleAuthRouting();
        } else {
          console.log('No session found, redirecting to login');
          if (mounted) {
            setError('No session found. Please try logging in again.');
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        if (mounted) {
          setError('An unexpected error occurred. Please try again.');
        }
      }
    };

    handleOAuthCallback();

    return () => {
      mounted = false;
    };
  }, [params]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={[styles.text, styles.errorText]}>{error}</Text>
        <Text style={styles.text}>Redirecting to login...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0a7ea4" />
      <Text style={styles.text}>Completing authentication...</Text>
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
    textAlign: 'center',
  },
  errorText: {
    color: '#C41E3A',
  },
}); 