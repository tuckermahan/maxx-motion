import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type UserProfile = {
  id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  is_admin: boolean;
};

type UserContextType = {
  userProfile: UserProfile | null;
  loading: boolean;
  refreshUserProfile: () => Promise<void>;
};

const UserContext = createContext<UserContextType>({
  userProfile: null,
  loading: true,
  refreshUserProfile: async () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) {
        setUserProfile(null);
        return;
      }
      
      const userId = data.session.user.id;
      console.log('Fetching profile for user ID:', userId);
      
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        setUserProfile(null);
      } else {
        console.log('Profile data from Supabase:', profileData);
        console.log('is_admin value:', profileData.is_admin);
        setUserProfile(profileData as UserProfile);
      }
    } catch (error) {
      console.error('Unexpected error fetching user profile:', error);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial load of user profile
  useEffect(() => {
    fetchUserProfile();
    
    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchUserProfile();
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider 
      value={{ 
        userProfile, 
        loading,
        refreshUserProfile: fetchUserProfile
      }}
    >
      {children}
    </UserContext.Provider>
  );
}; 