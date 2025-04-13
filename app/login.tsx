import React, { useEffect } from 'react';
import { 
  Button, 
  Text, 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity
} from 'react-native';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { handleAuthRouting } from '../lib/services/auth';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';

export default function LoginScreen() {
  const { promptAsync, request, loading, error } = useGoogleAuth();

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          // Use our auth routing logic
          await handleAuthRouting();
        }
      } catch (err) {
        console.error("Session check error:", err);
      }
    };
    
    checkSession();
    
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Use our auth routing logic
        handleAuthRouting();
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    try {
      await promptAsync();
      // Navigation is handled by the auth listener
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Text style={styles.title}>Welcome to the Fitness Challenge</Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {loading ? (
        <ActivityIndicator size="large" color="#0a7ea4" />
      ) : (
        <Button
          title="Sign in with Google"
          onPress={handleSignIn}
          disabled={!request}
        />
      )}
      
      <Text style={styles.domainText}>
        Note: This app is restricted to maxxpotential.com email addresses
      </Text>
      
      <View style={styles.backContainer}>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText style={styles.backText}>Back</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
  },
  domainText: {
    marginTop: 20,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  backContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
}); 