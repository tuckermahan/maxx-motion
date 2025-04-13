import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Sign in with Google using the appropriate method for the current platform.
 * This will handle the necessary redirects and auth flow.
 */
export const signInWithGoogle = async () => {
  try {
    console.log('📱 Starting Google authentication flow');
    
    // Simple GoogleAuth that works in simulators
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getRedirectUri(),
        skipBrowserRedirect: true,
      }
    });
    
    if (error) {
      console.error('🔴 Google sign-in error:', error.message);
      throw error;
    }
    
    // For mobile platforms, we need to open the URL in the browser
    if (data?.url) {
      console.log('📱 Opening auth URL in browser');
      
      // Open the browser with authentication URL
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        getRedirectUri()
      );
      
      // Handle WebBrowser result
      if (result.type === 'success') {
        console.log('📱 Auth browser session success');
        
        // The URL might contain auth code or refresh token
        if (result.url) {
          // Exchange code for session
          const { data, error } = await supabase.auth.setSession({
            access_token: getParameterByName('access_token', result.url) || '',
            refresh_token: getParameterByName('refresh_token', result.url) || '',
          });
          
          if (error) {
            console.error('🔴 Error setting session:', error.message);
            throw error;
          }
          
          console.log('✅ Google sign-in success');
          return { success: true, data };
        }
      }
    }
    
    return { success: !!data, data };
  } catch (error: any) {
    console.error('🔴 Google authentication error:', error.message || error);
    return { success: false, error };
  }
};

/**
 * Get the redirect URI for OAuth based on the current platform
 */
function getRedirectUri(): string {
  if (Platform.OS === 'web') {
    return window.location.origin;
  }
  
  // For iOS and Android simulators/devices
  const scheme = Constants.expoConfig?.scheme || 'maxx-motion';
  return `${scheme}://`;
}

/**
 * Extract parameter values from URL
 */
function getParameterByName(name: string, url: string): string | null {
  name = name.replace(/[[\]]/g, '\\$&');
  const regex = new RegExp(`[#&?]${name}=([^&#]*)`);
  const results = regex.exec(url);
  return results && results[1] ? decodeURIComponent(results[1].replace(/\+/g, ' ')) : null;
} 