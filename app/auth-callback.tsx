import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { handleAuthRouting } from '../lib/services/auth';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams();
  
  useEffect(() => {
    // This handles the OAuth callback in the web environment
    const handleOAuthCallback = async () => {
      try {
        console.log('Auth callback reached with params:', params);

        // Refresh the session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          router.replace('/login');
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
          router.replace('/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/login');
      }
    };
    
    handleOAuthCallback();
  }, [params]);
  
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
  },
}); 