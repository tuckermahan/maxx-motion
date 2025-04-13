import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Image, Pressable, Platform, ImageBackground, Text } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import MemberDetails from '@/app/screens/MemberDetails';

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
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);

  const teamStats = {
    totalMinutes: 2650,
    targetMinutes: 10000,
    activeMembers: 10,
    weeklyGrowth: 15,
    avgMinPerMember: 220,
  };

  const allTeamMembers: TeamMember[] = [
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
    {
      id: '123e4567-e89b-12d3-a456-426614174011',
      user_id: '123e4567-e89b-12d3-a456-426614174012',
      team_id: '123e4567-e89b-12d3-a456-426614174002',
      full_name: 'Sarah Wilson',
      avatar_url: 'https://ui-avatars.com/api/?name=SW&background=E91E63',
      joined_at: '2024-04-03T00:00:00Z',
      is_captain: false,
      total_minutes: 190,
      contribution_percentage: '7.2%',
      rank: 6,
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174013',
      user_id: '123e4567-e89b-12d3-a456-426614174014',
      team_id: '123e4567-e89b-12d3-a456-426614174002',
      full_name: 'Michael Chen',
      avatar_url: 'https://ui-avatars.com/api/?name=MC&background=673AB7',
      joined_at: '2024-04-04T00:00:00Z',
      is_captain: false,
      total_minutes: 175,
      contribution_percentage: '6.6%',
      rank: 7,
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174015',
      user_id: '123e4567-e89b-12d3-a456-426614174016',
      team_id: '123e4567-e89b-12d3-a456-426614174002',
      full_name: 'Emma Brown',
      avatar_url: 'https://ui-avatars.com/api/?name=EB&background=009688',
      joined_at: '2024-04-02T00:00:00Z',
      is_captain: false,
      total_minutes: 160,
      contribution_percentage: '6.1%',
      rank: 8,
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174017',
      user_id: '123e4567-e89b-12d3-a456-426614174018',
      team_id: '123e4567-e89b-12d3-a456-426614174002',
      full_name: 'Robert Kim',
      avatar_url: 'https://ui-avatars.com/api/?name=RK&background=795548',
      joined_at: '2024-04-01T00:00:00Z',
      is_captain: false,
      total_minutes: 145,
      contribution_percentage: '5.5%',
      rank: 9,
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174019',
      user_id: '123e4567-e89b-12d3-a456-426614174020',
      team_id: '123e4567-e89b-12d3-a456-426614174002',
      full_name: 'Lisa Martinez',
      avatar_url: 'https://ui-avatars.com/api/?name=LM&background=607D8B',
      joined_at: '2024-04-03T00:00:00Z',
      is_captain: false,
      total_minutes: 130,
      contribution_percentage: '4.9%',
      rank: 10,
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174021',
      user_id: '123e4567-e89b-12d3-a456-426614174022',
      team_id: '123e4567-e89b-12d3-a456-426614174002',
      full_name: 'Tom Anderson',
      avatar_url: 'https://ui-avatars.com/api/?name=TA&background=795548',
      joined_at: '2024-04-04T00:00:00Z',
      is_captain: false,
      total_minutes: 120,
      contribution_percentage: '4.5%',
      rank: 11,
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174023',
      user_id: '123e4567-e89b-12d3-a456-426614174024',
      team_id: '123e4567-e89b-12d3-a456-426614174002',
      full_name: 'Rachel Green',
      avatar_url: 'https://ui-avatars.com/api/?name=RG&background=8BC34A',
      joined_at: '2024-04-05T00:00:00Z',
      is_captain: false,
      total_minutes: 110,
      contribution_percentage: '4.2%',
      rank: 12,
    },
  ];

  const displayedMembers = showAllMembers ? allTeamMembers : allTeamMembers.slice(0, 5);

  const progressPercentage = (teamStats.totalMinutes / teamStats.targetMinutes) * 100;

  // Update the useEffect to debounce search and prevent performance issues
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (searchQuery.trim() === '') {
        setFilteredMembers(displayedMembers);
      } else {
        const query = searchQuery.toLowerCase().trim();
        const results = allTeamMembers.filter(member => {
          const fullName = member.full_name.toLowerCase();
          const nameParts = fullName.split(' ');
          
          return fullName.includes(query) || 
                 nameParts.some(part => part.includes(query));
        });
        
        // Sort results by relevance
        results.sort((a, b) => {
          const aName = a.full_name.toLowerCase();
          const bName = b.full_name.toLowerCase();
          
          // Exact matches first
          if (aName === query) return -1;
          if (bName === query) return 1;
          
          // Then starts with
          if (aName.startsWith(query) && !bName.startsWith(query)) return -1;
          if (bName.startsWith(query) && !aName.startsWith(query)) return 1;
          
          // Default to rank order
          return a.rank - b.rank;
        });
        
        setFilteredMembers(results);
      }
    }, 300); // 300ms delay to debounce search input
    
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, displayedMembers, allTeamMembers]);

  // Optimize memberRowStyles computation to use a stable reference
  const getMemberRowStyle = (memberId: string, index: number, isSearchResult: boolean) => {
    const isHovered = hoveredMemberId === memberId;
    const backgroundColor = isHovered 
      ? 'rgba(0, 0, 0, 0.15)' 
      : index % 2 === 1 
        ? 'rgba(0, 0, 0, 0.03)' 
        : undefined;
        
    return {
      backgroundColor,
      borderLeftWidth: isSearchResult && searchQuery.trim() !== '' ? 3 : 0,
      borderLeftColor: '#C41E3A',
    };
  };

  const handleMemberPress = (member: TeamMember) => {
    setSelectedMember(member);
    setIsModalVisible(true);
  };

  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

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
            style={styles.gradientOverlay}
          >
            <View style={styles.headerTopBar}>
              <Text style={styles.appTitle}>MAXX Motion</Text>
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>U</Text>
              </View>
            </View>
            <View style={styles.headerContent}>
              <Text style={styles.headerMainTitle}>Team</Text>
              <Text style={styles.headerSubtitle}>Track your motion. Reach your potential.</Text>
            </View>
          </LinearGradient>
        </ImageBackground>
        
        <View style={styles.content}>
          <ThemedView style={styles.card}>
            <View style={styles.teamInfo}>
              <View style={styles.teamIcon}>
                <ThemedText style={styles.teamIconText}>MM</ThemedText>
              </View>
              <View style={styles.teamDetails}>
                <ThemedText style={styles.teamName}>Move Masters</ThemedText>
                <ThemedText style={styles.teamSubtext}>12 Members • Captain: {allTeamMembers.find(m => m.is_captain)?.full_name}</ThemedText>
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
                  <ThemedText style={styles.progressText}>{teamStats.totalMinutes} / {teamStats.targetMinutes} minutes</ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.teamActions}>
              <Pressable 
                style={[styles.actionButton, hoveredButton === 'rank' && styles.actionButtonHovered]} 
                onHoverIn={() => setHoveredButton('rank')}
                onHoverOut={() => setHoveredButton(null)}
              >
                <ThemedText style={[
                  styles.actionButtonText, 
                  hoveredButton === 'rank' && styles.actionButtonTextHovered
                ]}>RANK: 2nd</ThemedText>
              </Pressable>
              <Pressable 
                style={[styles.actionButton, hoveredButton === 'edit' && styles.actionButtonHovered]} 
                onHoverIn={() => setHoveredButton('edit')}
                onHoverOut={() => setHoveredButton(null)}
              >
                <ThemedText style={[
                  styles.actionButtonText, 
                  hoveredButton === 'edit' && styles.actionButtonTextHovered
                ]}>EDIT TEAM</ThemedText>
              </Pressable>
              <Pressable 
                style={[styles.actionButton, hoveredButton === 'invite' && styles.actionButtonHovered]} 
                onHoverIn={() => setHoveredButton('invite')}
                onHoverOut={() => setHoveredButton(null)}
              >
                <ThemedText style={[
                  styles.actionButtonText, 
                  hoveredButton === 'invite' && styles.actionButtonTextHovered
                ]}>INVITE</ThemedText>
              </Pressable>
            </View>
      </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText style={[styles.sectionTitle, { marginBottom: 16 }]}>Team Statistics</ThemedText>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <ThemedText style={styles.statValue}>{teamStats.avgMinPerMember}</ThemedText>
                <ThemedText style={styles.statLabel}>Avg Min/Member</ThemedText>
              </View>
              <View style={styles.statCard}>
                <ThemedText style={styles.statValue}>{teamStats.activeMembers}</ThemedText>
                <ThemedText style={styles.statLabel}>Active Members</ThemedText>
              </View>
              <View style={styles.statCard}>
                <ThemedText style={styles.statValue}>+{teamStats.weeklyGrowth}%</ThemedText>
                <ThemedText style={styles.statLabel}>Weekly Growth</ThemedText>
              </View>
            </View>
      </ThemedView>

          <ThemedView style={styles.card}>
            <View style={styles.membersHeader}>
              <ThemedText style={styles.sectionTitle}>Team Members</ThemedText>
              <TextInput 
                placeholder="Search members..." 
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>

            <View style={styles.tableHeader}>
              <ThemedText style={styles.headerMember}>MEMBER</ThemedText>
              <ThemedText style={styles.headerRole}>ROLE</ThemedText>
              <ThemedText style={styles.headerMinutes}>MINUTES</ThemedText>
              <ThemedText style={styles.headerContrib}>CONTRIB/RANK</ThemedText>
            </View>
            
            <View style={styles.membersList}>
              {(searchQuery.trim() === '' ? displayedMembers : filteredMembers).map((member, index) => {
                const isSearchResult = searchQuery.trim() !== '' && filteredMembers.includes(member);
                
                return (
                  <View key={member.id} style={styles.memberItemContainer}>
                    <Image
                      source={{ uri: member.avatar_url || undefined }}
                      style={styles.memberAvatar}
                    />
                    <Pressable
                      onHoverIn={() => setHoveredMemberId(member.id)}
                      onHoverOut={() => setHoveredMemberId(null)}
                      onPress={() => handleMemberPress(member)}
                      style={[
                        styles.memberItem,
                        getMemberRowStyle(member.id, index, isSearchResult)
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
                    </Pressable>
                  </View>
                );
              })}
              
              {searchQuery.trim() !== '' && filteredMembers.length === 0 && (
                <View style={styles.noResultsContainer}>
                  <ThemedText style={styles.noResultsText}>
                    No members found matching "{searchQuery}"
                  </ThemedText>
                </View>
              )}
            </View>
            
            {searchQuery.trim() === '' && (
              <Pressable 
                onPress={() => setShowAllMembers(!showAllMembers)}
              >
                <ThemedText style={styles.seeAllMembers}>
                  {showAllMembers ? 'SHOW LESS' : 'SEE ALL MEMBERS (12)'}
                </ThemedText>
              </Pressable>
            )}
      </ThemedView>
        </View>
      </ScrollView>
      
      <MemberDetails 
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        member={selectedMember ? {
          full_name: selectedMember.full_name,
          joined_at: selectedMember.joined_at,
          rank: selectedMember.rank,
          total_minutes: selectedMember.total_minutes,
          activities_logged: Math.floor(selectedMember.total_minutes / 30), // Mock data
          current_milestone: `${Math.floor(selectedMember.total_minutes / 100) * 100} minutes`,
          contribution_percentage: selectedMember.contribution_percentage,
          avatar_url: selectedMember.avatar_url || '',
        } : null}
      />
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
    height: 240,
    resizeMode: 'cover',
  },
  gradientOverlay: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Add light overlay for better text visibility
  },
  headerContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  appTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC143C',
  },
  headerMainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 40,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    textAlign: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 100, // Extra padding to account for tab bar
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
    alignItems: 'flex-start',
    marginBottom: 16,
    position: 'relative',
    minHeight: 60,
  },
  teamIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 2,
  },
  teamIconText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  teamDetails: {
    flex: 1,
    marginLeft: 76,  // Account for avatar width + margin
  },
  teamName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333333',
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
  teamActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    cursor: 'pointer',
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: 'transparent',
  },
  actionButtonHovered: {
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  actionButtonTextHovered: {
    color: 'white',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 0,
    color: '#333333',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    padding: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    width: '50%',
    maxWidth: 300,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerMember: {
    flex: 3,
    fontSize: 12,
    fontWeight: '600',
    color: '#444444',
  },
  headerRole: {
    flex: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#444444',
    textAlign: 'left',
  },
  headerMinutes: {
    flex: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#444444',
    textAlign: 'center',
  },
  headerContrib: {
    flex: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#444444',
    textAlign: 'right',
  },
  membersList: {
    gap: 0,
  },
  memberItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    minHeight: 64,
    paddingLeft: 64,
    marginBottom: 4,
  },
  memberItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    cursor: 'pointer',
    marginLeft: 0,
    borderRadius: 4,
  },
  memberItemAlt: {
    backgroundColor: '#F8F9FA',
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ translateY: -18 }],
    zIndex: 3,
  },
  memberColumnContent: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
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
  memberDetails: {
    flex: 1,
    marginLeft: 0,
    gap: 1,
  },
  memberName: {
    fontSize: 14,
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
    marginTop: 2,
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
  memberItemSearchResult: {
    borderLeftWidth: 3,
    borderLeftColor: '#C41E3A',
  },
  
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  
  noResultsText: {
    fontSize: 16,
    color: '#666666',
    fontStyle: 'italic',
  },
}); 