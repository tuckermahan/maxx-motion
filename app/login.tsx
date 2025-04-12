import React, { useEffect, useState } from 'react';
import { 
  Button, 
  Text, 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  Platform
} from 'react-native';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const { promptAsync, request, loading, error } = useGoogleAuth();
  const [debugInfo, setDebugInfo] = useState<string>('Debug info will appear here');

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        setDebugInfo(prev => `${prev}\nSession check: ${JSON.stringify({ data, error }, null, 2)}`);
        if (data.session) {
          router.replace('/');
        }
      } catch (err) {
        setDebugInfo(prev => `${prev}\nSession check error: ${JSON.stringify(err, null, 2)}`);
      }
    };
    
    checkSession();
    
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setDebugInfo(prev => `${prev}\nAuth state change: ${event}`);
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
      setDebugInfo('Starting Google sign-in...');
      const success = await promptAsync();
      setDebugInfo(prev => `${prev}\nSign-in result: ${success}`);
      
      if (success) {
        console.log('Authentication successful');
        // Navigation is handled by the auth listener
      }
    } catch (error: any) {
      setDebugInfo(prev => `${prev}\nError: ${error.message}`);
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
      
      {__DEV__ && (
        <ScrollView style={styles.debugContainer}>
          <Text style={styles.debugText}>{debugInfo}</Text>
        </ScrollView>
      )}
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
  debugContainer: {
    marginTop: 40,
    maxHeight: 200,
    width: '100%',
    backgroundColor: '#f0f0f0',
    padding: 10,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
}); 