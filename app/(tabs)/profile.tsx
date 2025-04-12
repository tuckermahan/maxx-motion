import React, { useState } from 'react';
import { StyleSheet, Button, ActivityIndicator, Alert, View, TouchableOpacity } from 'react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      
      // Force navigation to home page before signing out
      // This ensures we end up on the correct page
      setTimeout(() => {
        // Navigate using window.location for a full reset of the app state
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        } else {
          // Fallback for native
          router.replace('/');
        }
      }, 100);
      
      // Sign out
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        Alert.alert('Error', error.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
      setLoading(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#E6E6FA', dark: '#2E2E3F' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="person.fill"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Profile</ThemedText>
      </ThemedView>
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Activity History</ThemedText>
        {/* Activity history interface will be implemented here */}
      </ThemedView>
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Edit Activity</ThemedText>
        {/* Edit activity interface will be implemented here */}
      </ThemedView>
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Event/Team History</ThemedText>
        {/* Event and team history interface will be implemented here */}
      </ThemedView>
      
      <ThemedView style={styles.logoutContainer}>
        <ThemedText type="subtitle">Account</ThemedText>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={styles.logoutButtonContent}>
              <IconSymbol name="rectangle.portrait.and.arrow.right" color="#FFFFFF" size={18} />
              <ThemedText style={styles.logoutText}>Sign Out</ThemedText>
            </View>
          )}
        </TouchableOpacity>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    opacity: 0.2,
    transform: [{ rotate: '-10deg' }],
  },
  titleContainer: {
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  logoutContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#FF6347',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 