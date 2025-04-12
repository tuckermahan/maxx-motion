import { useState } from 'react';
import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState(true);

  return {
    promptAsync: async () => {
      try {
        setLoading(true);
        setError(null);
        
        // The key issue is that we need to use a redirect URL that is registered with Google
        // Supabase requires using their callback URL
        const { data, error: authError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            // No redirectTo - let Supabase use its default which is properly configured
            queryParams: {
              // Ensure we get a refresh token
              access_type: 'offline',
            }
          }
        });
        
        if (authError) {
          throw authError;
        }
        
        console.log('OAuth URL generated:', data?.url);
        
        if (!data?.url) {
          throw new Error('No OAuth URL returned from Supabase');
        }
        
        // Open the OAuth URL in a browser
        if (Platform.OS !== 'web') {
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            'maxx-motion://'
          );
          
          console.log('Auth result:', result.type);
          
          if (result.type !== 'success') {
            throw new Error('Authentication cancelled or failed');
          }
        } else {
          // On web, we can just redirect
          window.location.href = data.url;
        }
        
        // We should only reach here in native apps
        const { data: session } = await supabase.auth.getSession();
        console.log('Session after auth:', session ? 'exists' : 'null');
        
        return true;
      } catch (e) {
        console.error('Authentication error:', e);
        setError((e as Error).message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    request,
    loading,
    error
  };
} 