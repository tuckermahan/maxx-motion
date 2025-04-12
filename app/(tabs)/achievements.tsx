import React from 'react';
import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function AchievementsScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#FFB6C1', dark: '#692B33' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="star.fill"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Achievements</ThemedText>
      </ThemedView>
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Milestones</ThemedText>
        {/* Milestones interface will be implemented here */}
      </ThemedView>
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Rewards</ThemedText>
        {/* Rewards interface will be implemented here */}
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