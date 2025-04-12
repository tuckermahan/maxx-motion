import React from 'react';
import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function ActivityScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#ACD8AA', dark: '#2C4B2B' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="figure.run"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Activity</ThemedText>
      </ThemedView>
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Manual Entry</ThemedText>
        {/* Manual activity entry interface will be implemented here */}
      </ThemedView>
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Connect Tracker</ThemedText>
        {/* Health app connection interface will be implemented here */}
      </ThemedView>
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Activity Confirmation</ThemedText>
        {/* Activity confirmation interface will be implemented here */}
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