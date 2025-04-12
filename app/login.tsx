import React, { useEffect } from 'react';
import { Button, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const { promptAsync, request, loading, error } = useGoogleAuth();

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace('/');
      }
    };
    
    checkSession();
    
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.replace('/');
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    try {
      const url = await promptAsync();
      if (url) {
        // The authentication was successful, Supabase will handle the session via onAuthStateChange
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  return (
    <View style={styles.container}>
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
    </View>
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
}); 