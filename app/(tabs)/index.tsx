import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Text } from 'react-native';
import { useEffect } from 'react';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/lib/auth';
import { useUser } from '@/contexts/UserContext';
import { ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ParallaxScrollView from '@/components/ParallaxScrollView';

// Team interface for leaderboard
interface Team {
  id: string;
  rank: number;
  name: string;
  members: number;
  totalMinutes: number;
  minutesPerMember: number;
  isUserTeam: boolean;
}

// Activity interface for recent activities
interface Activity {
  id: string;
  type: string;
  time: string;
  duration: number;
  source: string;
  color: string;
  initial: string;
}

export default function DashboardScreen() {
  // Dummy data for user progress
  const userProgress = {
    current: 310,
    target: 500,
    currentMilestone: 'Silver (250 min)',
    nextMilestone: 'Gold (500 min)'
  };
  
  // Dummy data for team leaderboard
  const teams: Team[] = [
    {
      id: 'fw1',
      rank: 1,
      name: "Fitness Warriors",
      members: 15,
      totalMinutes: 3450,
      minutesPerMember: 230,
      isUserTeam: false
    },
    {
      id: 'mm2',
      rank: 2,
      name: "Move Masters",
      members: 12,
      totalMinutes: 2640,
      minutesPerMember: 220,
      isUserTeam: true
    },
    {
      id: 'hh3',
      rank: 3,
      name: "Health Heroes",
      members: 18,
      totalMinutes: 3240,
      minutesPerMember: 180,
      isUserTeam: false
    },
    {
      id: 'ww4',
      rank: 4,
      name: "Wellness Warriors",
      members: 10,
      totalMinutes: 1650,
      minutesPerMember: 165,
      isUserTeam: false
    }
  ];
  
  // Dummy data for recent activities
  const activities: Activity[] = [
    {
      id: '1',
      type: 'Running',
      time: 'Today',
      duration: 45,
      source: 'Strava',
      color: '#4CAF50', // Green
      initial: 'R'
    },
    {
      id: '2',
      type: 'Yoga',
      time: 'Yesterday',
      duration: 30,
      source: 'Manual',
      color: '#FF9800', // Orange
      initial: 'Y'
    },
    {
      id: '3',
      type: 'Weight Training',
      time: 'Apr 10',
      duration: 60,
      source: 'Apple Health',
      color: '#9C27B0', // Purple
      initial: 'W'
    }
  ];

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
    <ParallaxScrollView
      headerBackgroundColor={{ light: 'transparent', dark: 'transparent' }}
      headerImage={
        <ImageBackground
          source={require('@/assets/images/gym-equipment.png')}
          style={styles.headerBackground}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(196, 30, 58, 0.9)', 'rgba(128, 128, 128, 0.85)']}
            locations={[0, 0.5]}
            style={styles.headerOverlay}
          >
            <View style={styles.header}>
              <ThemedText style={styles.headerTitle}>MAXX Motion Challenge</ThemedText>
              <View style={styles.userIcon}>
                <ThemedText style={styles.userIconText}>U</ThemedText>
              </View>
            </View>
            <View style={styles.headerContent}>
              <ThemedText style={styles.pageTitle}>Dashboard</ThemedText>
              <ThemedText style={styles.tagline}>Track your motion. Reach your potential.</ThemedText>
            </View>
          </LinearGradient>
        </ImageBackground>
      }>
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Your Progress</ThemedText>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(userProgress.current / userProgress.target) * 100}%` }
              ]} 
            />
          </View>
          <ThemedText style={styles.progressText}>
            {userProgress.current} / {userProgress.target} min
          </ThemedText>
        </View>
        <ThemedText style={styles.milestoneText}>
          Current Milestone: {userProgress.currentMilestone}
        </ThemedText>
        <ThemedText style={styles.milestoneText}>
          Next Milestone: {userProgress.nextMilestone}
        </ThemedText>
        <TouchableOpacity style={styles.shareButton}>
          <ThemedText style={styles.shareButtonText}>Share</ThemedText>
        </TouchableOpacity>
        <ThemedText type="subtitle">Your Activity</ThemedText>
        <Text style={styles.comingSoon}>Activity summary coming soon</Text>
      </ThemedView>
      
      {/* Team Leaderboard Section */}
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Team Leaderboard</ThemedText>
        {teams.map(team => (
          <View 
            key={team.id} 
            style={[
              styles.teamItem, 
              team.isUserTeam && styles.userTeamItem
            ]}
          >
            <View style={[styles.rankContainer, { backgroundColor: getRankColor(team.rank) }]}>
              <ThemedText style={styles.rankText}>{team.rank}</ThemedText>
            </View>
            <View style={styles.teamDetails}>
              <ThemedText style={styles.teamName}>
                {team.name} {team.isUserTeam && "(Your Team)"}
              </ThemedText>
              <ThemedText style={styles.teamSubtext}>
                {team.members} members • {team.totalMinutes} minutes
              </ThemedText>
            </View>
            <ThemedText style={styles.teamMetric}>
              {team.minutesPerMember} min/member
            </ThemedText>
          </View>
        ))}
        <ThemedText type="subtitle">Your Team</ThemedText>
        <Text style={styles.comingSoon}>Team summary coming soon</Text>
      </ThemedView>

      {/* Recent Activities Section */}
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Recent Activities</ThemedText>
        {activities.map(activity => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: activity.color }]}>
              <ThemedText style={styles.activityInitial}>{activity.initial}</ThemedText>
            </View>
            <View style={styles.activityDetails}>
              <ThemedText style={styles.activityType}>{activity.type}</ThemedText>
              <ThemedText style={styles.activityTime}>{activity.time} • {activity.duration} minutes</ThemedText>
            </View>
            <ThemedText style={styles.activitySource}>{activity.source}</ThemedText>
          </View>
        ))}
        <ThemedText type="subtitle">Recent Achievements</ThemedText>
        <Text style={styles.comingSoon}>Achievements coming soon</Text>
      </ThemedView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <ThemedText style={styles.fabIcon}>+</ThemedText>
      </TouchableOpacity>
    </ParallaxScrollView>
  );
}

// Helper function to get color based on rank
function getRankColor(rank: number): string {
  switch (rank) {
    case 1:
      return '#2196F3'; // Blue for first place
    case 2:
      return '#2196F3'; // Blue for second place
    case 3:
      return '#2196F3'; // Blue for third place
    case 4:
      return '#2196F3'; // Blue for fourth place
    default:
      return '#F5F5F5';
  }
}

const styles = StyleSheet.create({
  headerBackground: {
    height: 300,
    width: '100%'
  },
  headerOverlay: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    zIndex: 1,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  userIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userIconText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C41E3A',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  headerBar: {
    backgroundColor: '#C41E3A',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  section: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
  },
  progressText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#333',
  },
  milestoneText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  shareButton: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    marginTop: 8,
  },
  shareButtonText: {
    fontSize: 12,
    color: '#757575',
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userTeamItem: {
    backgroundColor: '#F9F9F9',
  },
  rankContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  teamDetails: {
    flex: 1,
  },
  teamName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  teamSubtext: {
    fontSize: 12,
    color: '#666',
  },
  teamMetric: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  activityDetails: {
    flex: 1,
  },
  activityType: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
  },
  activitySource: {
    fontSize: 12,
    color: '#757575',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  fabIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
  },
  comingSoon: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});