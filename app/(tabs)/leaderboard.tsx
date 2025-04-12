import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, ImageBackground, Text } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ActivityItem from '@/components/ActivityItem';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface TeamRankingItemProps {
  rank: number;
  name: string;
  members: number;
  totalMinutes: number;
  minutesPerMember: number;
  isUserTeam?: boolean;
}

const TeamRankingItem: React.FC<TeamRankingItemProps> = ({
  rank,
  name,
  members,
  totalMinutes,
  minutesPerMember,
  isUserTeam
}) => (
  <ThemedView style={[styles.teamItem, isUserTeam && styles.userTeamItem]}>
    <View style={[styles.rankContainer, isUserTeam && styles.userTeamRank]}>
      <ThemedText style={isUserTeam ? styles.userTeamRankText : styles.rankText}>{rank}</ThemedText>
    </View>
    <View style={styles.teamInfo}>
      <View style={styles.teamNameContainer}>
        <ThemedText style={[styles.teamName, isUserTeam && styles.userTeamText]}>
          {name}
        </ThemedText>
        {isUserTeam && (
          <ThemedText style={styles.yourTeamBadge}>Your Team</ThemedText>
        )}
      </View>
      <ThemedText style={styles.teamSubtext}>{members} members • {totalMinutes.toLocaleString()} minutes</ThemedText>
    </View>
    <View style={styles.teamStats}>
      <ThemedText style={styles.minutesPerMember}>{minutesPerMember}</ThemedText>
      <ThemedText style={styles.minutesLabel}>min/member</ThemedText>
    </View>
  </ThemedView>
);

interface TeamActivity {
  type: string;
  date: string;
  totalMinutes: number;
  teamId: string;
}

interface Team {
  id: string;
  rank: number;
  name: string;
  members: number;
  totalMinutes: number;
  minutesPerMember: number;
  isUserTeam: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  totalMinutes: number;
  rank: number;
  isCurrentUser: boolean;
}

const TeamMemberItem = ({ member, nextRankMinutes }: { member: TeamMember; nextRankMinutes?: number }) => (
  <View style={[styles.memberItem, member.isCurrentUser && styles.currentUserItem]}>
    <View style={styles.memberRankContainer}>
      <Text style={[styles.memberRankText, member.isCurrentUser && styles.currentUserRankText]}>
        {member.rank}
      </Text>
    </View>
    <View style={styles.memberInfo}>
      <View style={styles.memberNameContainer}>
        <Text style={[styles.memberName, member.isCurrentUser && styles.currentUserText]}>
          {member.name}
        </Text>
        {member.isCurrentUser && <Text style={styles.youBadge}>(You)</Text>}
      </View>
      <Text style={styles.memberMinutes}>{member.totalMinutes} mins</Text>
    </View>
    {member.isCurrentUser && nextRankMinutes && (
      <Text style={styles.nextRankInfo}>
        {nextRankMinutes} mins to next rank
      </Text>
    )}
  </View>
);

export default function LeaderboardScreen() {
  const [showAllTeams, setShowAllTeams] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);

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
      id: 'hh2',
      rank: 2,
      name: "Health Heroes",
      members: 18,
      totalMinutes: 3240,
      minutesPerMember: 180,
      isUserTeam: false
    },
    {
      id: 'mm3',
      rank: 3,
      name: "Move Masters",
      members: 12,
      totalMinutes: 2640,
      minutesPerMember: 220,
      isUserTeam: false
    },
    {
      id: 'ww4',
      rank: 4,
      name: "Wellness Warriors",
      members: 10,
      totalMinutes: 1650,
      minutesPerMember: 165,
      isUserTeam: true
    },
    {
      id: 'fd5',
      rank: 5,
      name: "Fit Defenders",
      members: 10,
      totalMinutes: 1320,
      minutesPerMember: 132,
      isUserTeam: false
    },
    {
      id: 'ts6',
      rank: 6,
      name: "Team Stamina",
      members: 10,
      totalMinutes: 1150,
      minutesPerMember: 115,
      isUserTeam: false
    },
    {
      id: 'sm7',
      rank: 7,
      name: "Strength Monarchs",
      members: 10,
      totalMinutes: 980,
      minutesPerMember: 98,
      isUserTeam: false
    },
    {
      id: 'el8',
      rank: 8,
      name: "Endurance League",
      members: 10,
      totalMinutes: 860,
      minutesPerMember: 86,
      isUserTeam: false
    }
  ];

  const teamMembers: TeamMember[] = [
    { id: '1', name: 'Sarah Jay', totalMinutes: 460, rank: 1, isCurrentUser: false },
    { id: '2', name: 'Jessica John', totalMinutes: 240, rank: 2, isCurrentUser: true },
    { id: '3', name: 'Lina Smith', totalMinutes: 180, rank: 3, isCurrentUser: false },
    { id: '4', name: 'Sarah Wilson', totalMinutes: 280, rank: 4, isCurrentUser: false },
    { id: '5', name: 'Alex Brown', totalMinutes: 260, rank: 5, isCurrentUser: false }
  ];

  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams.find(t => t.isUserTeam)?.id || teams[0].id);
  const userTeam = teams.find(team => team.isUserTeam);
  const minutesAhead = userTeam && userTeam.rank > 1
    ? teams[userTeam.rank - 2].totalMinutes - userTeam.totalMinutes
    : 0;
  const minutesBehind = userTeam && userTeam.rank < teams.length
    ? userTeam.totalMinutes - teams[userTeam.rank].totalMinutes
    : 0;

  const ActivityItem: React.FC<TeamActivity & { teamName: string }> = ({ type, date, totalMinutes, teamName }) => (
    <ThemedView style={styles.activityItem}>
      <View style={styles.activityIconContainer}>
        <ThemedText style={styles.activityIcon}>
          {type.charAt(0)}
        </ThemedText>
      </View>
      <View style={styles.activityInfo}>
        <ThemedText style={styles.teamName}>{teamName}</ThemedText>
        <ThemedText style={styles.activityDetails}>
          {type} • {date} • {totalMinutes} minutes
        </ThemedText>
      </View>
    </ThemedView>
  );

  // Calculate minutes needed for current user to reach next rank
  const currentUser = teamMembers.find(member => member.isCurrentUser);
  const nextRankMember = teamMembers.find(member => member.rank === (currentUser?.rank || 0) - 1);
  const minutesToNextRank = nextRankMember && currentUser
    ? nextRankMember.totalMinutes - currentUser.totalMinutes
    : undefined;

  const [activeTab, setActiveTab] = useState<'team' | 'user'>('team');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MAXX Motion</Text>
        <View style={styles.userIcon}>
          <Text style={styles.userIconText}>U</Text>
        </View>
      </View>

      <ImageBackground
        source={require('@/assets/images/gym-equipment.png')}
        style={styles.headerBackground}
        resizeMode="cover"
      >
        <View style={styles.headerOverlay}>
          <View style={styles.headerContent}>
            <Text style={styles.pageTitle}>Leaderboard</Text>
            <Text style={styles.tagline}>Track your motion. Reach your potential.</Text>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'team' && styles.activeTab]}
          onPress={() => setActiveTab('team')}
        >
          <Text style={[styles.tabText, activeTab === 'team' && styles.activeTabText]}>
            TEAM RANKINGS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'user' && styles.activeTab]}
          onPress={() => setActiveTab('user')}
        >
          <Text style={[styles.tabText, activeTab === 'user' && styles.activeTabText]}>
            USER RANKINGS
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.challengeCard}>
        <View style={styles.challengeInfo}>
          <Text style={styles.challengeTitle}>April Fitness Challenge</Text>
          <Text style={styles.challengeDates}>Apr 1 - Apr 30 • 24 days remaining</Text>
        </View>
        <View style={styles.activeTag}>
          <Text style={styles.activeTagText}>ACTIVE</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterButton, styles.activeFilter]}>
          <Text style={[styles.filterButtonText, styles.activeFilterText]}>This Week</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterButtonText}>By Minutes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>REFRESH</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'team' ? (
        <ScrollView style={styles.content}>
          <View style={styles.podiumContainer}>
            <View style={styles.podiumRow}>
              {/* Silver - 2nd Place */}
              <View style={[styles.podiumItem, styles.secondPlace]}>
                <View style={[styles.teamAvatar, styles.silverTeam]}>
                  <Text style={styles.teamAvatarText}>HH</Text>
                </View>
                <Text style={styles.podiumTeamName}>Health Heroes</Text>
                <Text style={styles.podiumMinutes}>3,240 min</Text>
                <Text style={styles.podiumRank}>🥈</Text>
              </View>

              {/* Gold - 1st Place */}
              <View style={[styles.podiumItem, styles.firstPlace]}>
                <View style={[styles.teamAvatar, styles.goldTeam]}>
                  <Text style={styles.teamAvatarText}>FW</Text>
                </View>
                <Text style={styles.podiumTeamName}>Fitness Warriors</Text>
                <Text style={styles.podiumMinutes}>3,450 min</Text>
                <Text style={styles.podiumRank}>🥇</Text>
              </View>

              {/* Bronze - 3rd Place */}
              <View style={[styles.podiumItem, styles.thirdPlace]}>
                <View style={[styles.teamAvatar, styles.bronzeTeam]}>
                  <Text style={styles.teamAvatarText}>MM</Text>
                </View>
                <Text style={styles.podiumTeamName}>Move Masters</Text>
                <Text style={styles.podiumMinutes}>2,640 min</Text>
                <Text style={styles.podiumRank}>🥉</Text>
              </View>
            </View>
          </View>

          {teams.slice(3, showAllTeams ? undefined : 8).map((team) => (
            <TeamRankingItem
              key={team.rank}
              rank={team.rank}
              name={team.name}
              members={team.members}
              totalMinutes={team.totalMinutes}
              minutesPerMember={team.minutesPerMember}
              isUserTeam={team.isUserTeam}
            />
          ))}
          {teams.length > 8 && (
            <TouchableOpacity
              style={styles.viewMoreButton}
              onPress={() => setShowAllTeams(!showAllTeams)}
            >
              <Text style={styles.viewMoreText}>
                {showAllTeams ? 'SHOW LESS TEAMS' : 'VIEW MORE TEAMS'}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.podiumContainer}>
            <View style={styles.podiumRow}>
              {/* Silver - 2nd Place */}
              <View style={[
                styles.podiumItem,
                styles.secondPlace,
                teamMembers[1].isCurrentUser && styles.currentUserPodiumItem
              ]}>
                <View style={[styles.userAvatar, styles.silverUser]}>
                  <Text style={styles.userAvatarText}>JJ</Text>
                </View>
                <View style={styles.podiumNameContainer}>
                  <Text style={[
                    styles.podiumUserName,
                    teamMembers[1].isCurrentUser && styles.currentUserText
                  ]}>
                    {teamMembers[1].name}
                  </Text>
                  {teamMembers[1].isCurrentUser && (
                    <Text style={styles.youBadge}>(You)</Text>
                  )}
                </View>
                <Text style={styles.podiumMinutes}>{teamMembers[1].totalMinutes} min</Text>
                <Text style={[
                  styles.podiumRank,
                  teamMembers[1].isCurrentUser && styles.currentUserText
                ]}>🥈</Text>
              </View>

              {/* Gold - 1st Place */}
              <View style={[
                styles.podiumItem,
                styles.firstPlace,
                teamMembers[0].isCurrentUser && styles.currentUserPodiumItem
              ]}>
                <View style={[styles.userAvatar, styles.goldUser]}>
                  <Text style={styles.userAvatarText}>SJ</Text>
                </View>
                <View style={styles.podiumNameContainer}>
                  <Text style={[
                    styles.podiumUserName,
                    teamMembers[0].isCurrentUser && styles.currentUserText
                  ]}>
                    {teamMembers[0].name}
                  </Text>
                  {teamMembers[0].isCurrentUser && (
                    <Text style={styles.youBadge}>(You)</Text>
                  )}
                </View>
                <Text style={styles.podiumMinutes}>{teamMembers[0].totalMinutes} min</Text>
                <Text style={[
                  styles.podiumRank,
                  teamMembers[0].isCurrentUser && styles.currentUserText
                ]}>🥇</Text>
              </View>

              {/* Bronze - 3rd Place */}
              <View style={[
                styles.podiumItem,
                styles.thirdPlace,
                teamMembers[2].isCurrentUser && styles.currentUserPodiumItem
              ]}>
                <View style={[styles.userAvatar, styles.bronzeUser]}>
                  <Text style={styles.userAvatarText}>LS</Text>
                </View>
                <View style={styles.podiumNameContainer}>
                  <Text style={[
                    styles.podiumUserName,
                    teamMembers[2].isCurrentUser && styles.currentUserText
                  ]}>
                    {teamMembers[2].name}
                  </Text>
                  {teamMembers[2].isCurrentUser && (
                    <Text style={styles.youBadge}>(You)</Text>
                  )}
                </View>
                <Text style={styles.podiumMinutes}>{teamMembers[2].totalMinutes} min</Text>
                <Text style={[
                  styles.podiumRank,
                  teamMembers[2].isCurrentUser && styles.currentUserText
                ]}>🥉</Text>
              </View>
            </View>
          </View>

          {teamMembers.filter(member => !member.isCurrentUser && member.rank > 3).map((member) => (
            <TeamMemberItem
              key={member.id}
              member={member}
              nextRankMinutes={member.isCurrentUser ? minutesToNextRank : undefined}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#C41E3A',
    zIndex: 1,
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
  headerBackground: {
    height: 300,
  },
  headerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
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
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
  },
  activeTabText: {
    color: '#2196F3',
  },
  challengeCard: {
    marginLeft: 16,
    marginVertical: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3E5F5',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  challengeInfo: {
    marginRight: 8,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9C27B0',
  },
  challengeDates: {
    fontSize: 14,
    color: '#9C27B0',
    opacity: 0.8,
  },
  activeTag: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  activeFilter: {
    backgroundColor: '#E3F2FD',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#757575',
  },
  activeFilterText: {
    color: '#2196F3',
  },
  refreshButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    marginLeft: 'auto',
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  viewMoreButton: {
    padding: 16,
    alignItems: 'center',
  },
  viewMoreText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500',
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 4,
  },
  navText: {
    fontSize: 12,
    color: '#757575',
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  userTeamItem: {
    backgroundColor: '#FFF5F5',
  },
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userTeamRank: {
    backgroundColor: '#C41E3A',
  },
  rankText: {
    color: '#666666',
    fontWeight: '700',
    fontSize: 18,
  },
  userTeamRankText: {
    color: 'white',
    fontWeight: '700',
  },
  teamInfo: {
    flex: 1,
  },
  teamNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  teamName: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: '#000000',
  },
  userTeamText: {
    color: '#C41E3A',
    fontWeight: '700',
  },
  yourTeamBadge: {
    fontSize: 13,
    color: '#C41E3A',
    fontWeight: '600',
    backgroundColor: '#FFEBEB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
    overflow: 'hidden',
  },
  teamSubtext: {
    fontSize: 14,
    color: '#666666',
    letterSpacing: -0.2,
  },
  teamStats: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  minutesPerMember: {
    fontSize: 20,
    fontWeight: '600',
    color: '#C41E3A',
    letterSpacing: -0.5,
  },
  minutesLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  competitionInfoContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFEBEB',
  },
  competitionLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  minutesGapContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  minutesGapNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#C41E3A',
    letterSpacing: -0.5,
  },
  minutesGapLabel: {
    fontSize: 16,
    color: '#C41E3A',
    marginLeft: 4,
    fontWeight: '500',
  },
  competitionTarget: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  defendingContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#2F3136',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222427',
  },
  defendingContent: {
    alignItems: 'center',
  },
  defendingTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    letterSpacing: -0.2,
    fontWeight: '500',
  },
  defendingGapContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  defendingGapNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.5,
  },
  defendingGapLabel: {
    fontSize: 14,
    color: 'white',
    marginLeft: 4,
    fontWeight: '500',
  },
  defendingTarget: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIcon: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  activityInfo: {
    flex: 1,
  },
  activityDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  currentUserItem: {
    backgroundColor: '#FFF5F5',
  },
  memberRankContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberRankText: {
    color: '#666666',
    fontWeight: '600',
    fontSize: 16,
  },
  currentUserRankText: {
    color: '#C41E3A',
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  currentUserText: {
    color: '#C41E3A',
    fontWeight: '600',
  },
  youBadge: {
    color: '#C41E3A',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  memberMinutes: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
  },
  nextRankInfo: {
    fontSize: 12,
    color: '#C41E3A',
    marginTop: 4,
    fontWeight: '500',
    position: 'absolute',
    bottom: 2,
    right: 16,
  },
  podiumContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 16,
  },
  podiumItem: {
    alignItems: 'center',
    width: '30%',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  firstPlace: {
    height: 180,
    justifyContent: 'center',
  },
  secondPlace: {
    height: 160,
    justifyContent: 'center',
  },
  thirdPlace: {
    height: 140,
    justifyContent: 'center',
  },
  teamAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  goldTeam: {
    backgroundColor: '#FFD700',
  },
  silverTeam: {
    backgroundColor: '#2196F3',
  },
  bronzeTeam: {
    backgroundColor: '#BF360C',
  },
  teamAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  podiumTeamName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  podiumMinutes: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  podiumRank: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  goldUser: {
    backgroundColor: '#FFD700',
  },
  silverUser: {
    backgroundColor: '#2196F3',
  },
  bronzeUser: {
    backgroundColor: '#BF360C',
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  podiumUserName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  currentUserPodiumItem: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFEBEB',
  },
  podiumNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
}); 