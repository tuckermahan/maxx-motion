import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Helper to get the URL scheme
const getURL = () => {
  // Get the app's scheme from app.json
  const scheme = Constants.expoConfig?.scheme || 'maxx-motion';
  
  // Get URL for deep linking
  if (Platform.OS === 'web') {
    // Use the current origin for web, with safety check for SSR
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    // Fallback for SSR
    return 'http://localhost:8081';
  }
  
  // For mobile
  return `${scheme}://`;
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// Debug info in development
if (__DEV__) {
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key length:', supabaseAnonKey?.length);
  console.log('App URL:', getURL());
}

// Make sure we actually have these values before creating the client
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Configure Supabase client with platform-specific settings
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    // For web, we want to detect the session in the URL
    detectSessionInUrl: Platform.OS === 'web',
    // Use implicit flow for smoother mobile experience
    flowType: 'implicit',
  },
}); 