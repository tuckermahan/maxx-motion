import React from 'react';
import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function ProfileScreen() {
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
}); 