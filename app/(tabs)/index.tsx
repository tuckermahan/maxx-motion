import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Text, ImageBackground, ActivityIndicator, Image } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/lib/auth';
import { useUser } from '@/contexts/UserContext';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

// Team interface for leaderboard
interface Team {
  id: string;
  name: string;
  team_name: string;
  team_minute_goal: number;
  rank: number;
  members: number;
  totalMinutes: number;
  minutesPerMember: number;
  isUserTeam: boolean;
}

interface SupabaseTeam {
  id: string;
  team_name: string;
  team_minute_goal: number;
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

interface TeamMembership {
  team_id: string;
  teams: {
    id: string;
    team_name: string;
    team_minute_goal: number;
  };
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { userProfile } = useUser();
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState({
    current: 0,
    target: 500,
    currentMilestone: 'Bronze (0 min)',
    nextMilestone: 'Silver (250 min)'
  });
  const [teams, setTeams] = useState<Team[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch active event
      const { data: activeEvents, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'Active')
        .single();

      if (eventError) {
        console.error('Error fetching active event:', eventError);
        return;
      }

      setActiveEvent(activeEvents);

      // Fetch user's team
      const { data: teamMembership, error: teamError } = await supabase
        .from('team_members')
        .select('team_id, teams!inner(id, team_name, team_minute_goal)')
        .eq('user_id', user.id)
        .single();

      if (teamError && teamError.code !== 'PGRST116') {
        console.error('Error fetching team membership:', teamError);
      }

      // If user has a team, fetch team details
      if (teamMembership?.team_id) {
        const { data: teamData, error: teamDataError } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamMembership.team_id)
          .single();

        if (teamDataError) {
          console.error('Error fetching team data:', teamDataError);
        } else {
          setUserTeam(teamData);

          // Fetch team members
          const { data: members, error: membersError } = await supabase
            .from('team_members')
            .select('id, user_id, joined_at, profiles!inner(id, full_name, avatar_url)')
            .eq('team_id', teamMembership.team_id);

          if (membersError) {
            console.error('Error fetching team members:', membersError);
          } else {
            setTeamMembers(members || []);
          }
        }
      }

      // Fetch user's activities
      const { data: userActivities, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_id', activeEvents.id)
        .order('activity_date', { ascending: false })
        .limit(5);

      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
      }

      // Calculate user progress
      const totalMinutes = userActivities?.reduce((sum, activity) => sum + activity.activity_minutes, 0) || 0;
      const currentMilestone = getMilestoneForMinutes(totalMinutes);
      const nextMilestone = getNextMilestone(totalMinutes);

      // Handle teams data which could be an array or single object
      const teamGoal = teamMembership?.teams 
        ? (Array.isArray(teamMembership.teams) 
            ? (teamMembership.teams[0] as { team_minute_goal: number })?.team_minute_goal 
            : (teamMembership.teams as { team_minute_goal: number }).team_minute_goal)
        : 500;

      setUserProgress({
        current: totalMinutes,
        target: teamGoal,
        currentMilestone,
        nextMilestone
      });

      // Format activities
      const formattedActivities = userActivities?.map(activity => ({
        id: activity.id,
        type: activity.activity_type,
        time: formatActivityTime(activity.activity_date),
        duration: activity.activity_minutes,
        source: activity.source || 'Manual',
        color: getActivityColor(activity.activity_type),
        initial: activity.activity_type.charAt(0)
      })) || [];

      setActivities(formattedActivities);

      // Fetch teams for leaderboard
      const { data: allTeams, error: teamsError } = await supabase
        .from('teams')
        .select('id, team_name, team_minute_goal')
        .eq('event_id', activeEvents.id);

      if (teamsError) {
        console.error('Error fetching teams:', teamsError);
        return;
      }

      if (!allTeams) {
        console.error('No teams data found');
        return;
      }

      // Calculate team statistics
      const teamsWithStats = await Promise.all((allTeams as SupabaseTeam[]).map(async (team) => {
        const { data: members } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_id', team.id);

        const { data: teamActivities } = await supabase
          .from('activities')
          .select('activity_minutes')
          .eq('event_id', activeEvents.id)
          .in('user_id', members?.map(m => m.user_id) || []);

        const totalMinutes = teamActivities?.reduce((sum, activity) => sum + activity.activity_minutes, 0) || 0;
        const memberCount = members?.length || 0;

        return {
          id: team.id,
          name: team.team_name,
          team_name: team.team_name,
          team_minute_goal: team.team_minute_goal,
          rank: 0, // Will be calculated after sorting
          members: memberCount,
          totalMinutes: totalMinutes,
          minutesPerMember: memberCount > 0 ? totalMinutes / memberCount : 0,
          isUserTeam: team.id === teamMembership?.team_id
        };
      }));

      // Sort teams by total minutes and assign ranks
      const sortedTeams = teamsWithStats
        .sort((a, b) => b.totalMinutes - a.totalMinutes)
        .map((team, index) => ({
          ...team,
          rank: index + 1
        }));

      setTeams(sortedTeams);

      // Fetch recent achievements
      const { data: achievements, error: achievementsError } = await supabase
        .from('user_milestones')
        .select('id, completed_at, milestones!inner(id, name, description)')
        .eq('user_id', user.id)
        .eq('event_id', activeEvents.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(3);

      if (achievementsError) {
        console.error('Error fetching achievements:', achievementsError);
      } else {
        setRecentAchievements(achievements || []);
      }

      const teamsData = teams.map((team: any) => ({
        id: team.id || '',
        name: team.name || '',
        team_name: team.team_name || '',
        team_minute_goal: team.team_minute_goal || 0,
        rank: team.rank || 0,
        members: team.members || 0,
        totalMinutes: team.totalMinutes || 0,
        minutesPerMember: team.minutesPerMember || 0,
        isUserTeam: team.isUserTeam || false
      })) as Team[];

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMilestoneForMinutes = (minutes: number): string => {
    if (minutes >= 1000) return 'Gold (1000 min)';
    if (minutes >= 500) return 'Silver (500 min)';
    if (minutes >= 250) return 'Bronze (250 min)';
    return 'Bronze (0 min)';
  };

  const getNextMilestone = (minutes: number): string => {
    if (minutes >= 1000) return 'Completed';
    if (minutes >= 500) return 'Gold (1000 min)';
    if (minutes >= 250) return 'Silver (500 min)';
    return 'Bronze (250 min)';
  };

  const formatActivityTime = (date: string): string => {
    const activityDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (activityDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (activityDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return activityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getActivityColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'running':
        return '#4CAF50';
      case 'yoga':
        return '#FF9800';
      case 'weight training':
        return '#9C27B0';
      default:
        return '#2196F3';
    }
  };

  return (
    <View style={styles.container}>
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
            <ThemedText style={styles.headerTitle}>MAXX Motion</ThemedText>
          </View>
          <View style={styles.headerContent}>
            <ThemedText style={styles.pageTitle}>Dashboard</ThemedText>
            <ThemedText style={styles.tagline}>Track your motion. Reach your potential.</ThemedText>
          </View>
        </LinearGradient>
      </ImageBackground>

      <ScrollView style={styles.scrollContent}>
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
        </ThemedView>

        {/* Your Team Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Team</Text>
            <TouchableOpacity onPress={() => router.push('/team')}>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>
          {userTeam ? (
            <View style={styles.teamCard}>
              <View style={styles.teamInfo}>
                <Text style={styles.teamName}>{userTeam.team_name}</Text>
                <Text style={styles.teamGoal}>
                  Goal: {userTeam.team_minute_goal} minutes
                </Text>
              </View>
              <View style={styles.teamMembers}>
                {teamMembers.slice(0, 3).map((member) => (
                  <View key={member.id} style={styles.memberAvatar}>
                    <Image
                      source={{ uri: member.profiles.avatar_url }}
                      style={styles.avatar}
                    />
                  </View>
                ))}
                {teamMembers.length > 3 && (
                  <View style={styles.moreMembers}>
                    <Text style={styles.moreMembersText}>
                      +{teamMembers.length - 3}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.emptyTeamCard}>
              <Text style={styles.emptyTeamText}>
                You're not part of a team yet
              </Text>
              <TouchableOpacity
                style={styles.joinTeamButton}
                onPress={() => router.push('/team')}
              >
                <Text style={styles.joinTeamButtonText}>Join a Team</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

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
        </ThemedView>

        {/* Recent Achievements Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Achievements</Text>
            <TouchableOpacity onPress={() => router.push('/achievements')}>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentAchievements.length > 0 ? (
            <View style={styles.achievementsList}>
              {recentAchievements.map((achievement) => (
                <View key={achievement.id} style={styles.achievementCard}>
                  <View style={styles.achievementIcon}>
                    <Text style={styles.achievementEmoji}>🏆</Text>
                  </View>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementName}>
                      {achievement.milestones.name}
                    </Text>
                    <Text style={styles.achievementDate}>
                      {new Date(achievement.completed_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyAchievementsCard}>
              <Text style={styles.emptyAchievementsText}>
                No achievements yet. Keep moving to earn rewards!
              </Text>
            </View>
          )}
        </View>

        {/* Floating Action Button */}
        <TouchableOpacity style={styles.fab}>
          <ThemedText style={styles.fabIcon}>+</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// Helper function to get color based on rank
function getRankColor(rank: number): string {
  switch (rank) {
    case 1:
      return '#C41E3A'; // Red for first place
    case 2:
      return '#C41E3A'; // Red for second place
    case 3:
      return '#C41E3A'; // Red for third place
    case 4:
      return '#C41E3A'; // Red for fourth place
    default:
      return '#F5F5F5';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerBackground: {
    height: 300,
  },
  headerOverlay: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 16,
    zIndex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
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
    color: '#C41E3A',
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
    backgroundColor: '#C41E3A',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  seeAllButton: {
    color: '#C41E3A',
    fontSize: 14,
    fontWeight: '600',
  },
  teamCard: {
    backgroundColor: '#fff',
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
    marginBottom: 12,
  },
  teamGoal: {
    fontSize: 14,
    color: '#666',
  },
  teamMembers: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    marginRight: -8,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  moreMembers: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  moreMembersText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  emptyTeamCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  emptyTeamText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  joinTeamButton: {
    backgroundColor: '#C41E3A',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinTeamButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  achievementsList: {
    gap: 12,
  },
  achievementCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementEmoji: {
    fontSize: 20,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 14,
    color: '#666',
  },
  emptyAchievementsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  emptyAchievementsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});