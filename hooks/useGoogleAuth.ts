import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState(true);
  
  // Get the redirect URL for your app
  // In a real app, this should be your app's URL scheme + ://
  const redirectUrl = 'maxx-motion://auth';

  return {
    promptAsync: async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get the Supabase OAuth URL for Google
        const { data, error: urlError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            scopes: 'email profile',
          },
        });
        
        if (urlError) throw urlError;
        if (!data?.url) throw new Error('No OAuth URL returned from Supabase');
        
        // Open the browser for OAuth flow
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        
        if (result.type === 'success') {
          // Handle successful authentication
          const { url } = result;
          return url;
        } else {
          throw new Error('Authentication was cancelled or failed');
        }
      } catch (e: any) {
        setError(e.message || 'An error occurred during sign in');
        return null;
      } finally {
        setLoading(false);
      }
    },
    request,
    loading,
    error,
  };
} 