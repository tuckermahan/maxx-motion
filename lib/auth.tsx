import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';

type AuthContextProps = {
  user: User | null;
  session: Session | null;
  initialized: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextProps>({
  user: null,
  session: null,
  initialized: false,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    console.log("🔒 Auth provider initialized");
    
    // Get current session and user
    const initializeAuth = async () => {
      try {
        console.log("🔒 Fetching current session...");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("🔒 Error getting session:", error);
          throw error;
        }
        
        if (!isMounted) return;
        
        console.log("🔒 Session retrieved:", data.session ? "Session active" : "No active session");
        
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        if (data.session?.user) {
          console.log("🔒 User authenticated:", data.session.user.email);
        }
      } catch (error) {
        console.error('🔒 Error initializing auth:', error);
      } finally {
        if (isMounted) {
          console.log("🔒 Auth initialization complete");
          setInitialized(true);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    console.log("🔒 Setting up auth state listener");
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log(`🔒 Auth state changed: ${event}`);
        
        if (!isMounted) return;
        
        try {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          
          if (event === 'SIGNED_IN') {
            console.log("🔒 User signed in:", newSession?.user?.email);
          } else if (event === 'SIGNED_OUT') {
            console.log("🔒 User signed out");
          }
        } catch (error) {
          console.error("🔒 Error handling auth state change:", error);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      console.log("🔒 Cleaning up auth provider");
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("🔒 Attempting to sign in:", email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("🔒 Sign in error:", error.message);
      } else {
        console.log("🔒 Sign in successful");
      }
      
      return { error };
    } catch (error) {
      console.error("🔒 Unexpected sign in error:", error);
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    console.log("🔒 Attempting to sign up:", email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        console.error("🔒 Sign up error:", error.message);
      } else {
        console.log("🔒 Sign up successful");
      }
      
      return { error };
    } catch (error) {
      console.error("🔒 Unexpected sign up error:", error);
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log("🔒 Attempting to sign out");
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("🔒 Sign out error:", error.message);
      } else {
        console.log("🔒 Sign out successful");
      }
    } catch (error) {
      console.error("🔒 Unexpected sign out error:", error);
    } finally {
      // Make sure we update our state even if signOut fails
      setUser(null);
      setSession(null);
      setLoading(false);
    }
  };

  console.log("🔒 Auth state:", { 
    initialized, 
    loading, 
    isAuthenticated: !!user,
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        initialized,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 

