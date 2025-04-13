import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, ImageBackground, Text, ActivityIndicator, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { FontAwesome } from '@expo/vector-icons';

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

interface Event {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'Upcoming' | 'Active' | 'Archive';
}

interface TeamMember {
  id: string;
  name: string;
  totalMinutes: number;
  rank: number;
  isCurrentUser: boolean;
}

interface EventUser {
  id: string;
  name: string;
  totalMinutes: number;
  rank: number;
  avatar_url: string | null;
  isCurrentUser: boolean;
  teamName: string;
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
  const router = useRouter();
  const { user } = useAuth();
  const [showAllTeams, setShowAllTeams] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [activeTab, setActiveTab] = useState<'team' | 'user'>('team');
  
  // Loading state
  const [loading, setLoading] = useState(true);
  
  // Data state
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [topUsers, setTopUsers] = useState<EventUser[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);
  
  // Filter state
  const [filter, setFilter] = useState<'week' | 'cumulative'>('week');
  const [weekIndex, setWeekIndex] = useState<number>(0);
  const [totalWeeks, setTotalWeeks] = useState<number>(0);
  const [weekStart, setWeekStart] = useState<Date | null>(null);
  const [weekEnd, setWeekEnd] = useState<Date | null>(null);
  const [weekSelectorVisible, setWeekSelectorVisible] = useState(false);

  // Derived state
  const userTeam = teams.find(team => team.isUserTeam);
  const minutesAhead = userTeam && userTeam.rank > 1
    ? teams[userTeam.rank - 2].totalMinutes - userTeam.totalMinutes
    : 0;
  const minutesBehind = userTeam && userTeam.rank < teams.length
    ? userTeam.totalMinutes - teams[userTeam.rank].totalMinutes
    : 0;

  // Calculate minutes needed for current user to reach next rank
  const currentUser = teamMembers.find(member => member.isCurrentUser);
  const nextRankMember = teamMembers.find(member => member.rank === (currentUser?.rank || 0) - 1);
  const minutesToNextRank = nextRankMember && currentUser
    ? nextRankMember.totalMinutes - currentUser.totalMinutes
    : undefined;

  // Fetch the active event when component mounts
  useEffect(() => {
    if (user) {
      fetchActiveEvent();
    }
  }, [user]);

  // Calculate week boundaries when active event or week index changes
  useEffect(() => {
    if (activeEvent) {
      calculateWeeks();
    }
  }, [activeEvent, weekIndex]);

  // Fetch data based on active tab when active event, filter, or week boundaries change
  useEffect(() => {
    if (activeEvent && (filter === 'cumulative' || (weekStart && weekEnd))) {
      if (activeTab === 'team') {
        fetchTeams();
      } else {
        fetchTopUsers();
      }
    }
  }, [activeEvent, filter, weekStart, weekEnd, activeTab]);

  // Find the user's team ID
  useEffect(() => {
    if (user) {
      fetchUserTeamId();
    }
  }, [user, activeEvent]);
  
  // Handle tab change
  useEffect(() => {
    if (activeTab === 'user' && activeEvent && topUsers.length === 0) {
      fetchTopUsers();
    } else if (activeTab === 'team' && activeEvent && teams.length === 0) {
      fetchTeams();
    }
  }, [activeTab]);

  // Calculate the weeks of the event
  const calculateWeeks = () => {
    if (!activeEvent) return;
    
    const startDate = new Date(activeEvent.start_date);
    const endDate = new Date(activeEvent.end_date);
    
    // Calculate total weeks in the event
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.ceil(diffDays / 7);
    setTotalWeeks(weeks);
    
    // If week index is beyond total weeks, reset it
    if (weekIndex >= weeks) {
      setWeekIndex(0);
    }
    
    // Calculate start and end dates for the selected week
    const selectedWeekStart = new Date(startDate);
    selectedWeekStart.setDate(startDate.getDate() + (weekIndex * 7));
    
    const selectedWeekEnd = new Date(selectedWeekStart);
    selectedWeekEnd.setDate(selectedWeekStart.getDate() + 6);
    
    // If week end is beyond event end, cap it
    if (selectedWeekEnd > endDate) {
      selectedWeekEnd.setTime(endDate.getTime());
    }
    
    setWeekStart(selectedWeekStart);
    setWeekEnd(selectedWeekEnd);
  };

  // Fetch the active or upcoming event
  const fetchActiveEvent = async () => {
    try {
      setLoading(true);
      
      // First try to find active event
      const { data: activeEvents, error: activeError } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'Active')
        .order('start_date', { ascending: true })
        .limit(1);
      
      if (activeError) {
        console.error('Error fetching active events:', activeError);
        return;
      }
      
      if (activeEvents && activeEvents.length > 0) {
        console.log('Active event found:', activeEvents[0].name);
        setActiveEvent(activeEvents[0]);
        return;
      }
      
      // If no active event, look for upcoming event
      const { data: upcomingEvents, error: upcomingError } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'Upcoming')
        .order('start_date', { ascending: true })
        .limit(1);
      
      if (upcomingError) {
        console.error('Error fetching upcoming events:', upcomingError);
        return;
      }
      
      if (upcomingEvents && upcomingEvents.length > 0) {
        console.log('Upcoming event found:', upcomingEvents[0].name);
        setActiveEvent(upcomingEvents[0]);
        return;
      }
      
      // If no active or upcoming events, use the most recent archived event
      const { data: archivedEvents, error: archivedError } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'Archive')
        .order('end_date', { ascending: false })
        .limit(1);
      
      if (archivedError) {
        console.error('Error fetching archived events:', archivedError);
        return;
      }
      
      if (archivedEvents && archivedEvents.length > 0) {
        console.log('Archived event found:', archivedEvents[0].name);
        setActiveEvent(archivedEvents[0]);
      } else {
        console.log('No events found');
      }
    } catch (err) {
      console.error('Error in fetchActiveEvent:', err);
    } finally {
      setLoading(false);
    }
  };

  // Find the user's team ID for the active event
  const fetchUserTeamId = async () => {
    if (!user || !activeEvent) return;
    
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('teams.event_id', activeEvent.id)
        .limit(1);
      
      if (error) {
        console.error('Error fetching user team ID:', error);
        return;
      }
      
      if (data && data.length > 0) {
        console.log('User team ID found:', data[0].team_id);
        setUserTeamId(data[0].team_id);
      } else {
        console.log('User is not part of any team in this event');
        setUserTeamId(null);
      }
    } catch (err) {
      console.error('Error in fetchUserTeamId:', err);
    }
  };

  // Fetch teams for the event with updated filtering
  const fetchTeams = async () => {
    if (!activeEvent) return;
    
    try {
      setLoading(true);
      
      // Get all teams in the event
      const { data: eventTeams, error: teamsError } = await supabase
        .from('teams')
        .select('id, team_name, team_minute_goal, event_id')
        .eq('event_id', activeEvent.id);
      
      if (teamsError) {
        console.error('Error fetching teams:', teamsError);
        return;
      }
      
      if (!eventTeams || eventTeams.length === 0) {
        console.log('No teams found for this event');
        setTeams([]);
        return;
      }
      
      // For each team, get member count and calculate total minutes
      const teamsWithDetails = await Promise.all(eventTeams.map(async (team) => {
        // Get team members count
        const { data: membersData, error: membersError } = await supabase
          .from('team_members')
          .select('id', { count: 'exact' })
          .eq('team_id', team.id);
        
        const memberCount = membersError ? 0 : (membersData?.length || 0);
        
        // Get team members
        const { data: teamMemberIds, error: teamMembersError } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_id', team.id);
        
        if (teamMembersError || !teamMemberIds || teamMemberIds.length === 0) {
          return {
            id: team.id,
            rank: 0, // Will be set after sorting
            name: team.team_name,
            members: memberCount,
            totalMinutes: 0,
            minutesPerMember: 0,
            isUserTeam: team.id === userTeamId
          };
        }
        
        const userIds = teamMemberIds.map(m => m.user_id);
        
        // Get activities for these users based on filter
        let query = supabase
          .from('activities')
          .select('activity_minutes, activity_date')
          .eq('event_id', activeEvent.id)
          .in('user_id', userIds);
        
        // Apply time filter based on selection
        if (filter === 'week' && weekStart && weekEnd) {
          // Format dates to ISO strings
          const formattedStartDate = weekStart.toISOString().split('T')[0];
          const formattedEndDate = weekEnd.toISOString().split('T')[0];
          
          // Filter by activity_date between week boundaries
          query = query
            .gte('activity_date', formattedStartDate)
            .lte('activity_date', formattedEndDate);
            
          console.log(`Filtering activities from ${formattedStartDate} to ${formattedEndDate}`);
        }
        
        const { data: activities, error: activitiesError } = await query;
        
        if (activitiesError) {
          console.error(`Error fetching activities for team ${team.id}:`, activitiesError);
          return {
            id: team.id,
            rank: 0,
            name: team.team_name,
            members: memberCount,
            totalMinutes: 0,
            minutesPerMember: 0,
            isUserTeam: team.id === userTeamId
          };
        }
        
        const totalMinutes = activities?.reduce((sum, activity) => 
          sum + activity.activity_minutes, 0) || 0;
        
        console.log(`Team ${team.team_name}: ${totalMinutes} minutes (${filter}, week ${weekIndex + 1})`);
        
        const minutesPerMember = memberCount > 0 ? Math.round(totalMinutes / memberCount) : 0;
        
        return {
          id: team.id,
          rank: 0, // Will be set after sorting
          name: team.team_name,
          members: memberCount,
          totalMinutes,
          minutesPerMember,
          isUserTeam: team.id === userTeamId
        };
      }));
      
      // Sort by total minutes (descending) and assign ranks
      teamsWithDetails.sort((a, b) => b.totalMinutes - a.totalMinutes);
      teamsWithDetails.forEach((team, index) => {
        team.rank = index + 1;
      });
      
      setTeams(teamsWithDetails);
    } catch (err) {
      console.error('Error in fetchTeams:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch top users across the entire event
  const fetchTopUsers = async () => {
    if (!activeEvent || !user) return;
    
    try {
      setLoading(true);
      
      // Get all profiles with activities in the event and their team info
      let query = supabase
        .from('activities')
        .select(`
          user_id,
          activity_minutes,
          activity_date,
          profiles:user_id(id, full_name, avatar_url)
        `)
        .eq('event_id', activeEvent.id);
      
      // Apply time filter if weekly
      if (filter === 'week' && weekStart && weekEnd) {
        // Format dates to ISO strings
        const formattedStartDate = weekStart.toISOString().split('T')[0];
        const formattedEndDate = weekEnd.toISOString().split('T')[0];
        
        // Filter by activity_date between week boundaries
        query = query
          .gte('activity_date', formattedStartDate)
          .lte('activity_date', formattedEndDate);
          
        console.log(`Filtering user activities from ${formattedStartDate} to ${formattedEndDate}`);
      }
      
      const { data: activities, error: activitiesError } = await query;
      
      if (activitiesError) {
        console.error('Error fetching user activities:', activitiesError);
        setTopUsers([]);
        return;
      }
      
      if (!activities || activities.length === 0) {
        console.log('No user activities found');
        setTopUsers([]);
        return;
      }
      
      // Aggregate minutes by user
      const userMap = new Map<string, {
        id: string;
        name: string;
        totalMinutes: number;
        avatar_url: string | null;
      }>();
      
      activities.forEach(activity => {
        if (!activity.profiles) return;
        
        const profile = Array.isArray(activity.profiles) 
          ? activity.profiles[0] 
          : activity.profiles;
          
        if (!profile) return;
        
        const userId = activity.user_id;
        const existingUser = userMap.get(userId);
        
        if (existingUser) {
          existingUser.totalMinutes += activity.activity_minutes;
        } else {
          userMap.set(userId, {
            id: userId,
            name: profile.full_name || 'Unknown User',
            totalMinutes: activity.activity_minutes,
            avatar_url: profile.avatar_url
          });
        }
      });
      
      // Get user IDs to fetch team info
      const userIds = Array.from(userMap.keys());
      
      // Get team info for these users in this event
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_members')
        .select(`
          user_id,
          teams:team_id(team_name)
        `)
        .in('user_id', userIds)
        .eq('teams.event_id', activeEvent.id);
      
      // Create mapping of user ID to team name
      const userTeamMap = new Map<string, string>();
      if (teamMembers && !teamError) {
        teamMembers.forEach(member => {
          if (member.teams) {
            const teamInfo = Array.isArray(member.teams) ? member.teams[0] : member.teams;
            userTeamMap.set(member.user_id, teamInfo.team_name || 'Unknown Team');
          }
        });
      }
      
      // Convert map to array and sort by minutes
      const userArray = Array.from(userMap.values())
        .sort((a, b) => b.totalMinutes - a.totalMinutes)
        .slice(0, 20) // Limit to top 20 users for performance
        .map((userInfo, index) => ({
          ...userInfo,
          rank: index + 1,
          isCurrentUser: userInfo.id === user.id,
          teamName: userTeamMap.get(userInfo.id) || 'No Team'
        }));
      
      setTopUsers(userArray);
      
      console.log(`Loaded ${userArray.length} top users for the event`);
    } catch (err) {
      console.error('Error fetching top users:', err);
      setTopUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch team members with updated filtering
  const fetchTeamMembers = async () => {
    if (!userTeamId || !activeEvent) return;
    
    try {
      // Get all team members
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('user_id, profiles!inner(id, full_name, avatar_url)')
        .eq('team_id', userTeamId);
      
      if (membersError) {
        console.error('Error fetching team members:', membersError);
        return;
      }
      
      if (!members || members.length === 0) {
        console.log('No team members found');
        setTeamMembers([]);
        return;
      }
      
      // Get activities for all team members
      const userIds = members.map(m => m.user_id);
      
      // Apply time filter based on selection
      let query = supabase
        .from('activities')
        .select('user_id, activity_minutes, activity_date')
        .eq('event_id', activeEvent.id)
        .in('user_id', userIds);
      
      if (filter === 'week' && weekStart && weekEnd) {
        // Format dates to ISO strings
        const formattedStartDate = weekStart.toISOString().split('T')[0];
        const formattedEndDate = weekEnd.toISOString().split('T')[0];
        
        // Filter by activity_date between week boundaries
        query = query
          .gte('activity_date', formattedStartDate)
          .lte('activity_date', formattedEndDate);
      }
      
      const { data: activities, error: activitiesError } = await query;
      
      if (activitiesError) {
        console.error('Error fetching member activities:', activitiesError);
        return;
      }
      
      // Calculate minutes for each member
      const memberMinutes: { [key: string]: number } = {};
      
      activities?.forEach(activity => {
        memberMinutes[activity.user_id] = (memberMinutes[activity.user_id] || 0) + activity.activity_minutes;
      });
      
      // Map members with their minutes
      const mappedMembers: TeamMember[] = members.map(member => {
        const profileData = member.profiles;
        const profile = Array.isArray(profileData) ? profileData[0] : profileData;
        
        return {
          id: member.user_id,
          name: profile?.full_name || 'Unknown User',
          totalMinutes: memberMinutes[member.user_id] || 0,
          rank: 0, // Will be set after sorting
          isCurrentUser: member.user_id === user?.id
        };
      });
      
      // Sort by minutes (descending) and assign ranks
      mappedMembers.sort((a, b) => b.totalMinutes - a.totalMinutes);
      mappedMembers.forEach((member, index) => {
        member.rank = index + 1;
      });
      
      setTeamMembers(mappedMembers);
    } catch (err) {
      console.error('Error in fetchTeamMembers:', err);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate days remaining in event
  const calculateDaysRemaining = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Handle filter change
  const handleFilterChange = (newFilter: 'week' | 'cumulative') => {
    setFilter(newFilter);
    
    // If switching to week view, ensure we have valid week boundaries
    if (newFilter === 'week' && activeEvent && (!weekStart || !weekEnd)) {
      calculateWeeks();
    }
    
    // Show week selector if choosing week filter
    if (newFilter === 'week') {
      setWeekSelectorVisible(true);
    }
  };

  // Navigate to previous week
  const handlePreviousWeek = () => {
    if (weekIndex > 0) {
      setWeekIndex(weekIndex - 1);
    }
  };

  // Navigate to next week
  const handleNextWeek = () => {
    if (weekIndex < totalWeeks - 1) {
      setWeekIndex(weekIndex + 1);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    if (activeEvent) {
      fetchTeams();
      if (activeTab === 'user') {
        fetchTopUsers();
      }
    }
  };

  // Get week label
  const getWeekLabel = () => {
    if (!weekStart || !weekEnd) return 'This Week';
    
    const startStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return `Week ${weekIndex + 1} (${startStr} - ${endStr})`;
  };

  if (loading && !teams.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C41E3A" />
        <Text style={styles.loadingText}>Loading leaderboard data...</Text>
      </View>
    );
  }

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
            <Text style={styles.headerTitle}>MAXX Motion</Text>
            <View style={styles.userIcon}>
              <Text style={styles.userIconText}>U</Text>
            </View>
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.pageTitle}>Leaderboard</Text>
            <Text style={styles.tagline}>Track your motion. Reach your potential.</Text>
          </View>
        </LinearGradient>
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

      {activeEvent && (
        <View style={styles.challengeCard}>
          <View style={styles.challengeInfo}>
            <Text style={styles.challengeTitle}>{activeEvent.name}</Text>
            <Text style={styles.challengeDates}>
              {formatDate(activeEvent.start_date)} - {formatDate(activeEvent.end_date)} 
              {activeEvent.status === 'Active' && ` • ${calculateDaysRemaining(activeEvent.end_date)} days remaining`}
            </Text>
          </View>
          <View style={styles.activeTag}>
            <Text style={styles.activeTagText}>{activeEvent.status.toUpperCase()}</Text>
          </View>
        </View>
      )}

      <View style={styles.filterRow}>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
        
        {/* Week filter with selector */}
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'week' && styles.activeFilter]}
          onPress={() => handleFilterChange('week')}
        >
          <Text style={[styles.filterButtonText, filter === 'week' && styles.activeFilterText]}>
            {filter === 'week' ? getWeekLabel() : 'Weekly'}
          </Text>
        </TouchableOpacity>
        
        {/* Cumulative filter */}
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'cumulative' && styles.activeFilter]}
          onPress={() => handleFilterChange('cumulative')}
        >
          <Text style={[styles.filterButtonText, filter === 'cumulative' && styles.activeFilterText]}>Cumulative</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>REFRESH</Text>
        </TouchableOpacity>
      </View>

      {/* Week selector navigation */}
      {filter === 'week' && (
        <View style={styles.weekSelectorRow}>
          <TouchableOpacity 
            style={[styles.weekNavButton, weekIndex === 0 && styles.weekNavButtonDisabled]}
            onPress={handlePreviousWeek}
            disabled={weekIndex === 0}
          >
            <FontAwesome name="chevron-left" size={16} color={weekIndex === 0 ? "#CCCCCC" : "#2196F3"} />
          </TouchableOpacity>
          
          <Text style={styles.weekSelectorText}>
            Week {weekIndex + 1} of {totalWeeks}
          </Text>
          
          <TouchableOpacity 
            style={[styles.weekNavButton, weekIndex === totalWeeks - 1 && styles.weekNavButtonDisabled]}
            onPress={handleNextWeek}
            disabled={weekIndex === totalWeeks - 1}
          >
            <FontAwesome name="chevron-right" size={16} color={weekIndex === totalWeeks - 1 ? "#CCCCCC" : "#2196F3"} />
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'team' ? (
        <ScrollView style={styles.content}>
          {teams.length > 0 ? (
            <>
              <View style={styles.podiumContainer}>
                <View style={styles.podiumRow}>
                  {/* Only show podium if there are enough teams */}
                  {teams.length >= 2 && (
                    <View style={[styles.podiumItem, styles.secondPlace]}>
                      <View style={[styles.teamAvatar, styles.silverTeam]}>
                        <Text style={styles.teamAvatarText}>
                          {teams[1]?.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase() || 'HH'}
                        </Text>
                      </View>
                      <Text style={styles.podiumTeamName}>{teams[1]?.name || 'Health Heroes'}</Text>
                      <Text style={styles.podiumMinutes}>{teams[1]?.totalMinutes.toLocaleString() || 0} min</Text>
                      <Text style={styles.podiumRank}>🥈</Text>
                    </View>
                  )}

                  {/* Gold - 1st Place */}
                  {teams.length >= 1 && (
                    <View style={[styles.podiumItem, styles.firstPlace]}>
                      <View style={[styles.teamAvatar, styles.goldTeam]}>
                        <Text style={styles.teamAvatarText}>
                          {teams[0]?.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase() || 'FW'}
                        </Text>
                      </View>
                      <Text style={styles.podiumTeamName}>{teams[0]?.name || 'Fitness Warriors'}</Text>
                      <Text style={styles.podiumMinutes}>{teams[0]?.totalMinutes.toLocaleString() || 0} min</Text>
                      <Text style={styles.podiumRank}>🥇</Text>
                    </View>
                  )}

                  {/* Bronze - 3rd Place */}
                  {teams.length >= 3 && (
                    <View style={[styles.podiumItem, styles.thirdPlace]}>
                      <View style={[styles.teamAvatar, styles.bronzeTeam]}>
                        <Text style={styles.teamAvatarText}>
                          {teams[2]?.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase() || 'MM'}
                        </Text>
                      </View>
                      <Text style={styles.podiumTeamName}>{teams[2]?.name || 'Move Masters'}</Text>
                      <Text style={styles.podiumMinutes}>{teams[2]?.totalMinutes.toLocaleString() || 0} min</Text>
                      <Text style={styles.podiumRank}>🥉</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Show remaining teams (rank 4+) */}
              {teams.slice(3, showAllTeams ? undefined : 8).map((team) => (
                <TeamRankingItem
                  key={team.id}
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
            </>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No teams found for this event</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.content}>
          {topUsers.length > 0 ? (
            <>
              <View style={styles.podiumContainer}>
                <View style={styles.podiumRow}>
                  {/* Only show podium if there are enough users */}
                  {topUsers.length >= 2 && (
                    <View style={[
                      styles.podiumItem,
                      styles.secondPlace,
                      topUsers[1].isCurrentUser && styles.currentUserPodiumItem
                    ]}>
                      <View style={[styles.userAvatar, styles.silverUser]}>
                        <Text style={styles.userAvatarText}>
                          {topUsers[1]?.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.podiumUserName}>
                        {topUsers[1]?.name}
                        {topUsers[1].isCurrentUser && <Text style={styles.youBadge}> (You)</Text>}
                      </Text>
                      <Text style={styles.podiumTeamName}>{topUsers[1]?.teamName}</Text>
                      <Text style={styles.podiumMinutes}>{topUsers[1]?.totalMinutes || 0} min</Text>
                      <Text style={styles.podiumRank}>🥈</Text>
                    </View>
                  )}

                  {/* Gold - 1st Place */}
                  {topUsers.length >= 1 && (
                    <View style={[
                      styles.podiumItem,
                      styles.firstPlace,
                      topUsers[0].isCurrentUser && styles.currentUserPodiumItem
                    ]}>
                      <View style={[styles.userAvatar, styles.goldUser]}>
                        <Text style={styles.userAvatarText}>
                          {topUsers[0]?.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.podiumUserName}>
                        {topUsers[0]?.name}
                        {topUsers[0].isCurrentUser && <Text style={styles.youBadge}> (You)</Text>}
                      </Text>
                      <Text style={styles.podiumTeamName}>{topUsers[0]?.teamName}</Text>
                      <Text style={styles.podiumMinutes}>{topUsers[0]?.totalMinutes || 0} min</Text>
                      <Text style={styles.podiumRank}>🥇</Text>
                    </View>
                  )}

                  {/* Bronze - 3rd Place */}
                  {topUsers.length >= 3 && (
                    <View style={[
                      styles.podiumItem,
                      styles.thirdPlace,
                      topUsers[2].isCurrentUser && styles.currentUserPodiumItem
                    ]}>
                      <View style={[styles.userAvatar, styles.bronzeUser]}>
                        <Text style={styles.userAvatarText}>
                          {topUsers[2]?.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.podiumUserName}>
                        {topUsers[2]?.name}
                        {topUsers[2].isCurrentUser && <Text style={styles.youBadge}> (You)</Text>}
                      </Text>
                      <Text style={styles.podiumTeamName}>{topUsers[2]?.teamName}</Text>
                      <Text style={styles.podiumMinutes}>{topUsers[2]?.totalMinutes || 0} min</Text>
                      <Text style={styles.podiumRank}>🥉</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Show remaining top users (rank 4+) */}
              {topUsers.filter(user => user.rank > 3 && user.rank <= 10).map((user) => (
                <View key={user.id} style={[styles.memberItem, user.isCurrentUser && styles.currentUserItem]}>
                  <View style={styles.memberRankContainer}>
                    <Text style={[styles.memberRankText, user.isCurrentUser && styles.currentUserRankText]}>
                      {user.rank}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameContainer}>
                      <Text style={[styles.memberName, user.isCurrentUser && styles.currentUserText]}>
                        {user.name}
                        {user.isCurrentUser && <Text style={styles.youBadge}> (You)</Text>}
                      </Text>
                      <Text style={styles.teamNameText}>{user.teamName}</Text>
                    </View>
                    <Text style={styles.memberMinutes}>{user.totalMinutes} mins</Text>
                  </View>
                </View>
              ))}
              
              {/* Show the current user if not in top 10 */}
              {user && !topUsers.slice(0, 10).some(u => u.isCurrentUser) && 
                topUsers.find(u => u.isCurrentUser) && (
                <View style={styles.currentUserSeparator}>
                  <Text style={styles.currentUserSeparatorText}>Your Ranking</Text>
                </View>
              )}
              
              {user && !topUsers.slice(0, 10).some(u => u.isCurrentUser) && 
                topUsers.find(u => u.isCurrentUser) && (
                <View style={[styles.memberItem, styles.currentUserItem]}>
                  <View style={styles.memberRankContainer}>
                    <Text style={[styles.memberRankText, styles.currentUserRankText]}>
                      {topUsers.find(u => u.isCurrentUser)?.rank || ''}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameContainer}>
                      <Text style={[styles.memberName, styles.currentUserText]}>
                        {topUsers.find(u => u.isCurrentUser)?.name || ''}
                        <Text style={styles.youBadge}> (You)</Text>
                      </Text>
                      <Text style={styles.teamNameText}>
                        {topUsers.find(u => u.isCurrentUser)?.teamName || ''}
                      </Text>
                    </View>
                    <Text style={styles.memberMinutes}>
                      {topUsers.find(u => u.isCurrentUser)?.totalMinutes || 0} mins
                    </Text>
                  </View>
                </View>
              )}
            </>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No user activity found for this event</Text>
            </View>
          )}
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
    backgroundColor: '#F5F5F5',
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
    justifyContent: 'space-between',
    padding: 16,
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
    backgroundColor: '#FFF5F5',
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
    color: '#C41E3A',
  },
  challengeDates: {
    fontSize: 14,
    color: '#C41E3A',
    opacity: 0.8,
  },
  activeTag: {
    backgroundColor: '#C41E3A',
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
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIconText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  activityInfo: {
    flex: 1,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  activitySubtext: {
    fontSize: 14,
    color: '#666',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    color: '#C41E3A',
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
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    marginBottom: 4,
  },
  podiumMinutes: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  podiumRank: {
    fontSize: 32,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#C41E3A',
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
  weekSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  weekNavButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
  },
  weekNavButtonDisabled: {
    backgroundColor: '#F5F5F5',
  },
  weekSelectorText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginHorizontal: 16,
  },
  weekSelectorModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  weekSelectorContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxHeight: '70%',
  },
  weekSelectorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  weekSelectorItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  weekSelectorItemText: {
    fontSize: 16,
  },
  weekSelectorActiveItem: {
    backgroundColor: '#E3F2FD',
  },
  weekSelectorCloseButton: {
    marginTop: 16,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2196F3',
    borderRadius: 20,
  },
  weekSelectorCloseButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  currentUserSeparator: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  currentUserSeparatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C41E3A',
  },
  teamNameText: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  profileContainer: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#C41E3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileAvatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  profileTeam: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#C41E3A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  progressSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#C41E3A',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  recentActivitySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityList: {
    gap: 12,
  },
}); 