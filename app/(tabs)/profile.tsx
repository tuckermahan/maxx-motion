import React, { useState } from 'react';
import { StyleSheet, ActivityIndicator, Alert, View, ScrollView, ImageBackground, Text, TouchableOpacity, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

// Mock data for profile
const userProfile = {
  name: 'You',
  joined: '2024-04-01T00:00:00Z',
  totalMinutes: 310,
  rank: 2,
  contribution_percentage: '11.7%',
  avatar_url: 'https://ui-avatars.com/api/?name=YO&background=4CAF50',
  activities: [
    { id: '1', type: 'Running', date: 'Apr 15, 2024', minutes: 45 },
    { id: '2', type: 'Strength Training', date: 'Apr 13, 2024', minutes: 60 },
    { id: '3', type: 'Cycling', date: 'Apr 11, 2024', minutes: 30 },
    { id: '4', type: 'Yoga', date: 'Apr 8, 2024', minutes: 45 },
    { id: '5', type: 'Swimming', date: 'Apr 5, 2024', minutes: 60 },
  ],
  teams: [
    { id: 'mm3', name: 'Move Masters', role: 'Member', joinedDate: 'Apr 1, 2024' }
  ],
  events: [
    { id: 'e1', name: 'April Fitness Challenge', status: 'Active', progress: '45%' },
    { id: 'e2', name: 'Spring Marathon', status: 'Upcoming', date: 'May 10, 2024' }
  ]
};

export default function ProfileScreen() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'activities' | 'teams' | 'events'>('activities');

  const handleLogout = async () => {
    try {
      setLoading(true);
      
      // Force navigation to home page before signing out
      setTimeout(() => {
        // Navigate using window.location for a full reset of the app state
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        } else {
          // Fallback for native
          router.replace('/');
        }
      }, 100);
      
      // Sign out
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        Alert.alert('Error', error.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
      setLoading(false);
    }
  };

  const ActivityCard = ({ activity }: { activity: typeof userProfile.activities[0] }) => (
    <ThemedView style={styles.activityCard}>
      <View style={styles.activityIconContainer}>
        <ThemedText style={styles.activityIcon}>
          {activity.type.charAt(0)}
        </ThemedText>
      </View>
      <View style={styles.activityInfo}>
        <ThemedText style={styles.activityTitle}>{activity.type}</ThemedText>
        <ThemedText style={styles.activityDetails}>
          {activity.date} • {activity.minutes} minutes
        </ThemedText>
      </View>
      <TouchableOpacity style={styles.editButton}>
        <IconSymbol name="pencil" size={18} color="#666666" />
      </TouchableOpacity>
    </ThemedView>
  );

  const TeamCard = ({ team }: { team: typeof userProfile.teams[0] }) => (
    <ThemedView style={styles.teamCard}>
      <View style={styles.teamIconContainer}>
        <ThemedText style={styles.teamIcon}>
          {team.name.split(' ').map(n => n[0]).join('')}
        </ThemedText>
      </View>
      <View style={styles.teamInfo}>
        <ThemedText style={styles.teamName}>{team.name}</ThemedText>
        <ThemedText style={styles.teamDetails}>
          {team.role} • Joined {team.joinedDate}
        </ThemedText>
      </View>
    </ThemedView>
  );

  const EventCard = ({ event }: { event: typeof userProfile.events[0] }) => (
    <ThemedView style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <ThemedText style={styles.eventTitle}>{event.name}</ThemedText>
        <View style={[
          styles.eventStatusBadge, 
          event.status === 'Active' ? styles.activeEventBadge : styles.upcomingEventBadge
        ]}>
          <ThemedText style={styles.eventStatusText}>{event.status}</ThemedText>
        </View>
      </View>
      <ThemedText style={styles.eventDetails}>
        {'progress' in event ? `Progress: ${event.progress}` : `Date: ${event.date}`}
      </ThemedText>
    </ThemedView>
  );

  return (
    <View style={styles.container}>
      <ScrollView>
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
              <Text style={styles.headerTitle}>MAXX Motion</Text>
              <View style={styles.userIcon}>
                <Text style={styles.userIconText}>U</Text>
              </View>
            </View>
            <View style={styles.headerContent}>
              <Text style={styles.pageTitle}>My Profile</Text>
              <Text style={styles.tagline}>Track your motion. Reach your potential.</Text>
            </View>
          </LinearGradient>
        </ImageBackground>

        <ThemedView style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>YO</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userProfile.name}</Text>
              <Text style={styles.profileDetails}>
                Member since {new Date(userProfile.joined).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
              <View style={styles.badgeContainer}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>Rank #{userProfile.rank}</Text>
                </View>
                <View style={styles.minutesBadge}>
                  <Text style={styles.minutesText}>{userProfile.totalMinutes} mins</Text>
                </View>
                <View style={styles.contributionBadge}>
                  <Text style={styles.contributionText}>{userProfile.contribution_percentage}</Text>
                </View>
              </View>
            </View>
          </View>
        </ThemedView>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'activities' && styles.activeTab]}
            onPress={() => setActiveTab('activities')}
          >
            <Text style={[styles.tabText, activeTab === 'activities' && styles.activeTabText]}>
              ACTIVITIES
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'teams' && styles.activeTab]}
            onPress={() => setActiveTab('teams')}
          >
            <Text style={[styles.tabText, activeTab === 'teams' && styles.activeTabText]}>
              TEAMS
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'events' && styles.activeTab]}
            onPress={() => setActiveTab('events')}
          >
            <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>
              EVENTS
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {activeTab === 'activities' && (
            <View>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Activity History</ThemedText>
              </View>
              
              {userProfile.activities.map(activity => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </View>
          )}

          {activeTab === 'teams' && (
            <View>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>My Teams</ThemedText>
              </View>
              
              {userProfile.teams.map(team => (
                <TeamCard key={team.id} team={team} />
              ))}
            </View>
          )}

          {activeTab === 'events' && (
            <View>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Events</ThemedText>
              </View>
              
              {userProfile.events.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.logoutContainer}>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.logoutButtonContent}>
                <IconSymbol name="rectangle.portrait.and.arrow.right" color="#FFFFFF" size={18} />
                <Text style={styles.logoutText}>Sign Out</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerBackground: {
    width: '100%',
    height: 220,
  },
  headerOverlay: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  userIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userIconText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C41E3A',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 10,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#C41E3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileAvatarText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  profileDetails: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  rankBadge: {
    backgroundColor: '#C41E3A',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: 8,
  },
  rankText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  minutesBadge: {
    backgroundColor: '#4CAF50',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  minutesText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  contributionBadge: {
    backgroundColor: '#007BFF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  contributionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 8,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666666',
  },
  activeTabText: {
    color: '#2196F3',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityIcon: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  activityDetails: {
    fontSize: 14,
    color: '#666666',
  },
  editButton: {
    padding: 8,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  teamIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  teamIcon: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  teamDetails: {
    fontSize: 14,
    color: '#666666',
  },
  eventCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  eventStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  activeEventBadge: {
    backgroundColor: '#4CAF50',
  },
  upcomingEventBadge: {
    backgroundColor: '#FFC107',
  },
  eventStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventDetails: {
    fontSize: 14,
    color: '#666666',
  },
  logoutContainer: {
    padding: 16,
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#C41E3A',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 