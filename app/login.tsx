import React, { useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Pressable, 
  ActivityIndicator, 
  ImageBackground,
  TouchableOpacity
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { handleAuthRouting } from '../lib/services/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { Ionicons } from '@expo/vector-icons';

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
    <ImageBackground
      source={require('../assets/images/gym-equipment.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(10, 126, 164, 0.9)', 'rgba(0, 0, 0, 0.8)']}
        locations={[0, 0.6]}
        style={styles.container}
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>MAXX Motion</Text>
          <Text style={styles.subtitle}>Move more. Compete together.</Text>
          
          {error && <Text style={styles.errorText}>{error}</Text>}
          
          {loading ? (
            <ActivityIndicator color="#fff" size="large" style={styles.loader} />
          ) : (
            <Pressable 
              style={styles.googleButton}
              onPress={handleSignIn}
              disabled={!request}
            >
              <Ionicons name="logo-google" size={24} color="#0a7ea4" style={styles.googleIcon} />
              <Text style={styles.googleButtonText}>Sign In with Google</Text>
            </Pressable>
          )}
          
          <Text style={styles.domainText}>
            This app is restricted to maxxpotential.com email addresses
          </Text>
          
          <TouchableOpacity style={styles.backContainer} onPress={() => router.back()}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    width: '90%',
    maxWidth: 400,
    padding: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0a7ea4',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#555',
    marginBottom: 30,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  loader: {
    marginVertical: 20,
  },
  googleButton: {
    flexDirection: 'row',
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  domainText: {
    marginTop: 20,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  backContainer: {
    marginTop: 20,
    paddingVertical: 10,
  },
  backText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
}); 