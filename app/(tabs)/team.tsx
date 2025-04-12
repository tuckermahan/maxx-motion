import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Image, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

type TeamMember = {
  id: string; // UUID from team_members table
  user_id: string; // UUID from profiles table
  team_id: string; // UUID from teams table
  full_name: string; // from profiles table
  avatar_url: string | null; // from profiles table
  joined_at: string; // timestamp from team_members table
  is_captain: boolean; // derived from teams.captain_id === profiles.id
  total_minutes: number; // calculated from activities
  contribution_percentage: string; // calculated
  rank: number; // calculated
};

export default function TeamScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);

  const teamStats = {
    avgMinPerMember: 220,
    activeMembers: 10,
    weeklyGrowth: '+15%',
    totalMinutes: 2640,
    targetMinutes: 4400,
  };

  const teamMembers: TeamMember[] = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      team_id: '123e4567-e89b-12d3-a456-426614174002',
      full_name: 'Jane Doe',
      avatar_url: 'https://ui-avatars.com/api/?name=JD&background=FF4785',
      joined_at: '2024-04-02T00:00:00Z',
      is_captain: true,
      total_minutes: 385,
      contribution_percentage: '16.4%',
      rank: 1,
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174003',
      user_id: '123e4567-e89b-12d3-a456-426614174004',
      team_id: '123e4567-e89b-12d3-a456-426614174002',
      full_name: 'You',
      avatar_url: 'https://ui-avatars.com/api/?name=YO&background=4CAF50',
      joined_at: '2024-04-01T00:00:00Z',
      is_captain: false,
      total_minutes: 310,
      contribution_percentage: '11.7%',
      rank: 2,
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174005',
      user_id: '123e4567-e89b-12d3-a456-426614174006',
      team_id: '123e4567-e89b-12d3-a456-426614174002',
      full_name: 'John Smith',
      avatar_url: 'https://ui-avatars.com/api/?name=JS&background=9C27B0',
      joined_at: '2024-04-03T00:00:00Z',
      is_captain: false,
      total_minutes: 275,
      contribution_percentage: '10.4%',
      rank: 3,
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174007',
      user_id: '123e4567-e89b-12d3-a456-426614174008',
      team_id: '123e4567-e89b-12d3-a456-426614174002',
      full_name: 'Amy Johnson',
      avatar_url: 'https://ui-avatars.com/api/?name=AJ&background=FF9800',
      joined_at: '2024-04-02T00:00:00Z',
      is_captain: false,
      total_minutes: 250,
      contribution_percentage: '9.5%',
      rank: 4,
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174009',
      user_id: '123e4567-e89b-12d3-a456-426614174010',
      team_id: '123e4567-e89b-12d3-a456-426614174002',
      full_name: 'David Park',
      avatar_url: 'https://ui-avatars.com/api/?name=DP&background=03A9F4',
      joined_at: '2024-04-05T00:00:00Z',
      is_captain: false,
      total_minutes: 210,
      contribution_percentage: '7.9%',
      rank: 5,
    },
  ];

  const progressPercentage = (teamStats.totalMinutes / teamStats.targetMinutes) * 100;

  const handleMemberPress = (member: TeamMember) => {
    router.push({
      pathname: '/screens/MemberDetails',
      params: {
        ...member,
        is_captain: member.is_captain ? '1' : '0',
        activities_logged: 8, // This would come from your data
        current_milestone: 'Silver (250 min)', // This would come from your data
      },
    });
  };

  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  const getMemberRowStyle = (memberId: string) => {
    return useAnimatedStyle(() => {
      const isHovered = hoveredMemberId === memberId;
      return {
        transform: [{
          scale: withSpring(isHovered ? 1.02 : 1),
        }],
        backgroundColor: isHovered ? '#F0F0F0' : undefined,
      };
    });
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.card}>
        <View style={styles.teamInfo}>
          <View style={styles.teamAvatar}>
            <ThemedText style={styles.teamAvatarText}>MM</ThemedText>
          </View>
          <View style={styles.teamDetails}>
            <ThemedText style={styles.teamName}>Move Masters</ThemedText>
            <ThemedText style={styles.teamSubtext}>12 Members • Captain: {teamMembers.find(m => m.is_captain)?.full_name}</ThemedText>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
              <ThemedText style={styles.progressText}>
                {teamStats.totalMinutes.toLocaleString()} / {teamStats.targetMinutes.toLocaleString()} Challenge Minutes
              </ThemedText>
            </View>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <ThemedView style={styles.rankButton}>
            <ThemedText style={styles.buttonText}>RANK: 2nd</ThemedText>
          </ThemedView>
          <ThemedView style={styles.editTeamButton}>
            <ThemedText style={styles.buttonText}>EDIT TEAM</ThemedText>
          </ThemedView>
          <ThemedView style={styles.inviteButton}>
            <ThemedText style={styles.buttonText}>INVITE</ThemedText>
          </ThemedView>
        </View>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText style={styles.sectionTitle}>Team Statistics</ThemedText>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{teamStats.avgMinPerMember}</ThemedText>
            <ThemedText style={styles.statLabel}>Avg Min/Member</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{teamStats.activeMembers}</ThemedText>
            <ThemedText style={styles.statLabel}>Active Members</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statValue, styles.growthValue]}>{teamStats.weeklyGrowth}</ThemedText>
            <ThemedText style={styles.statLabel}>Weekly Growth</ThemedText>
          </View>
        </View>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText style={styles.sectionTitle}>Team Members</ThemedText>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search members..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.tableHeader}>
          <View style={styles.memberColumnHeader}>
            <ThemedText style={styles.columnHeader}>MEMBER</ThemedText>
          </View>
          <View style={styles.roleColumnHeader}>
            <ThemedText style={styles.columnHeader}>ROLE</ThemedText>
          </View>
          <View style={styles.minutesColumnHeader}>
            <ThemedText style={styles.columnHeader}>MINUTES</ThemedText>
          </View>
          <View style={styles.contribColumnHeader}>
            <ThemedText style={styles.columnHeader}>CONTRIB/RANK</ThemedText>
          </View>
        </View>
        
        <View style={styles.membersList}>
          {teamMembers.map((member, index) => (
            <View key={member.id} style={[styles.memberItemContainer, index % 2 === 1 && styles.memberItemAlt]}>
              <Image
                source={{ uri: member.avatar_url || undefined }}
                style={styles.memberAvatar}
              />
              <AnimatedPressable
                onHoverIn={() => setHoveredMemberId(member.id)}
                onHoverOut={() => setHoveredMemberId(null)}
                onPress={() => handleMemberPress(member)}
                style={[
                  styles.memberItem,
                  getMemberRowStyle(member.id),
                ]}
              >
                <View style={styles.memberColumnContent}>
                  <View style={styles.memberDetails}>
                    <ThemedText style={styles.memberName}>{member.full_name}</ThemedText>
                    <ThemedText style={styles.memberLastActive}>
                      Active since {new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.roleColumnContent}>
                  <ThemedText style={styles.memberRole}>{member.is_captain ? 'Captain' : 'Member'}</ThemedText>
                </View>
                <View style={styles.minutesColumnContent}>
                  <ThemedText style={styles.memberMinutes}>{member.total_minutes}</ThemedText>
                </View>
                <View style={styles.contribColumnContent}>
                  <ThemedText style={styles.memberContribution}>{member.contribution_percentage}</ThemedText>
                  <ThemedText style={styles.memberRank}>#{member.rank}</ThemedText>
                </View>
              </AnimatedPressable>
            </View>
          ))}
        </View>
        <ThemedText style={styles.seeAllMembers}>SEE ALL MEMBERS (12)</ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  teamAvatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  teamDetails: {
    flex: 1,
  },
  teamName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  teamSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressBar: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  rankButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  editTeamButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  inviteButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333333',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333333',
  },
  growthValue: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  memberColumnHeader: {
    flex: 3,
  },
  roleColumnHeader: {
    flex: 2,
    alignItems: 'flex-start',
  },
  minutesColumnHeader: {
    flex: 2,
    alignItems: 'center',
  },
  contribColumnHeader: {
    flex: 2,
    alignItems: 'flex-end',
  },
  columnHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  membersList: {
    gap: 0,
  },
  memberItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  memberItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    cursor: 'pointer',
    marginLeft: 52,
  },
  memberItemAlt: {
    backgroundColor: '#F8F9FA',
  },
  memberColumnContent: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
  },
  roleColumnContent: {
    flex: 2,
    alignItems: 'flex-start',
  },
  minutesColumnContent: {
    flex: 2,
    alignItems: 'center',
  },
  contribColumnContent: {
    flex: 2,
    alignItems: 'flex-end',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: 'absolute',
    left: 16,
    zIndex: 3,
  },
  memberDetails: {
    flex: 1,
    marginLeft: 0,
    gap: 2,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  memberRole: {
    fontSize: 14,
    color: '#666',
  },
  memberLastActive: {
    fontSize: 12,
    color: '#999',
  },
  memberMinutes: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  memberContribution: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  memberRank: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  seeAllMembers: {
    textAlign: 'center',
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
  },
}); 