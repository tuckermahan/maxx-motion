import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useUser } from '../../contexts/UserContext';
import { router } from 'expo-router';

export default function AdminReportsScreen() {
  const { userProfile, loading } = useUser();

  // Redirect non-admin users
  React.useEffect(() => {
    if (!loading && userProfile && !userProfile.is_admin) {
      router.replace('/(tabs)');
    }
  }, [userProfile, loading]);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  // Only render the content if the user is an admin
  if (!userProfile?.is_admin) {
    return null;
  }

  return (
    <ScrollView style={styles.scrollView}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Analytics & Reports</ThemedText>
        
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">User Activity</ThemedText>
          {/* User activity reports would go here */}
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Event Statistics</ThemedText>
          {/* Event statistics would go here */}
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">System Usage</ThemedText>
          {/* System usage reports would go here */}
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
  },
}); 