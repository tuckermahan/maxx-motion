import { StyleSheet, ScrollView, View, Text } from 'react-native';
import { useEffect } from 'react';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/lib/auth';
import { useUser } from '@/contexts/UserContext';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { userProfile } = useUser();
  
  useEffect(() => {
    console.log('📱 Dashboard loaded', { 
      userId: user?.id,
      email: user?.email,
      hasProfile: !!userProfile
    });
  }, [user, userProfile]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>Welcome back{userProfile?.full_name ? `, ${userProfile.full_name}` : ''}!</Text>
      </View>
      
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Your Activity</ThemedText>
        <Text style={styles.comingSoon}>Activity summary coming soon</Text>
      </ThemedView>
      
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Your Team</ThemedText>
        <Text style={styles.comingSoon}>Team summary coming soon</Text>
      </ThemedView>
      
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Recent Achievements</ThemedText>
        <Text style={styles.comingSoon}>Achievements coming soon</Text>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#C41E3A',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  section: {
    margin: 15,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  comingSoon: {
    marginTop: 10,
    color: '#888',
    fontStyle: 'italic',
  }
});
