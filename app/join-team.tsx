import React from 'react';
import { View, StyleSheet, Button } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function JoinTeamScreen() {
  const navigateToDashboard = () => {
    router.replace('/(tabs)');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Join a Team</ThemedText>
      <ThemedText>Select a team to join</ThemedText>
      {/* Team selection interface will be implemented here */}
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Test: Go to Dashboard" 
          onPress={navigateToDashboard} 
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  buttonContainer: {
    marginTop: 30,
    width: '100%',
  },
}); 