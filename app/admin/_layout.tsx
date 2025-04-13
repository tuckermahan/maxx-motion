import React from 'react';
import { Stack } from 'expo-router';
import { useUser } from '../../contexts/UserContext';
import { router } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

export default function AdminLayout() {
  const { userProfile, loading } = useUser();

  // Redirect non-admin users
  React.useEffect(() => {
    if (!loading && userProfile && !userProfile.is_admin) {
      router.replace('/(tabs)');
    }
  }, [userProfile, loading]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <ThemedText style={styles.text}>Loading...</ThemedText>
      </View>
    );
  }

  // Don't render anything if user is not an admin
  if (!userProfile?.is_admin) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen 
        name="setup" 
        options={{ 
          title: "Setup",
          headerBackTitle: "Back" 
        }} 
      />
      <Stack.Screen 
        name="reports" 
        options={{ 
          title: "Reports",
          headerBackTitle: "Back" 
        }} 
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 20,
    fontSize: 16,
  },
}); 