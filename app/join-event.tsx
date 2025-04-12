import React from 'react';
import { View, StyleSheet, Button } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function JoinEventScreen() {
  const navigateToDashboard = () => {
    router.replace('/(tabs)');
  };

  const navigateToJoinTeam = () => {
    router.push('/join-team' as any);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Join an Event</ThemedText>
      <ThemedText>Select an event to join</ThemedText>
      {/* Event selection interface will be implemented here */}
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Next: Join a Team" 
          onPress={navigateToJoinTeam} 
        />
        <View style={styles.buttonSpacer} />
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
  buttonSpacer: {
    height: 10,
  },
}); 