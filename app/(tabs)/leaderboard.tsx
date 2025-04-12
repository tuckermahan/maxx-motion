import React from 'react';
import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function LeaderboardScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#FFD580', dark: '#664B14' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="trophy.fill"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Leaderboard</ThemedText>
      </ThemedView>
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Team Rankings</ThemedText>
        {/* Team rankings interface will be implemented here */}
      </ThemedView>
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">User Rankings</ThemedText>
        {/* User rankings interface will be implemented here */}
      </ThemedView>
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Team Statistics</ThemedText>
        {/* Team statistics interface will be implemented here */}
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