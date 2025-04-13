import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Alert, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useUser } from '../../contexts/UserContext';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

// Type definitions
type Event = {
  id: string;
  name: string;
  event_year: string;
  start_date: string;
  end_date: string;
  status?: 'Active' | 'Upcoming' | 'Archive';
};

type TeamReport = {
  id: string;
  team_name: string;
  total_minutes: number;
  participants_count: number;
  members?: TeamMemberActivity[];
};

type MilestoneAchievement = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  milestone_id: string;
  milestone_name: string;
  milestone_minutes: number;
  achieved_at: string;
  rewarded: boolean;
  rewarded_at?: string | null;
};

// Add these new types for the weekly report functionality
type TeamReportDetails = TeamReport & {
  members: TeamMemberActivity[];
};

type TeamMemberActivity = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  total_minutes: number;
  team_id: string;
  team_name: string;
};

type UserActivity = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  team_name: string;
  team_id: string;
  total_minutes: number;
};

// Add types for cumulative report
type CumulativeTeamData = {
  id: string;
  team_name: string;
  total_minutes: number;
  participants_count: number;
  rank: number;
  members: CumulativeMemberData[];
};

type CumulativeMemberData = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  total_minutes: number;
  team_name: string;
  team_id: string;
  rank: number;
  team_rank: number;
};

export default function AdminReportsScreen() {
  const { userProfile, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [weeklyReports, setWeeklyReports] = useState<TeamReport[]>([]);
  const [milestoneAchievements, setMilestoneAchievements] = useState<MilestoneAchievement[]>([]);
  const [eventMilestones, setEventMilestones] = useState<any[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [markingReward, setMarkingReward] = useState(false);
  const [weeklyReportView, setWeeklyReportView] = useState<'teams' | 'users'>('teams');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [teamDetails, setTeamDetails] = useState<TeamReportDetails | null>(null);
  const [allUsersActivity, setAllUsersActivity] = useState<UserActivity[]>([]);
  const [availableWeeks, setAvailableWeeks] = useState<{start: Date, end: Date}[]>([]);
  const [reportType, setReportType] = useState<'weekly' | 'cumulative'>('weekly');
  const [cumulativeTeamData, setCumulativeTeamData] = useState<CumulativeTeamData[]>([]);
  const [cumulativeUserData, setCumulativeUserData] = useState<CumulativeMemberData[]>([]);
  const [cumulativeView, setCumulativeView] = useState<'teams' | 'users'>('teams');
  const [selectedCumulativeTeam, setSelectedCumulativeTeam] = useState<string | null>(null);

  // Redirect non-admin users
  useEffect(() => {
    if (!userLoading && userProfile && !userProfile.is_admin) {
      router.replace('/(tabs)');
    }
  }, [userProfile, userLoading]);

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // When selected event changes, fetch reports
  useEffect(() => {
    if (selectedEvent) {
      fetchWeeklyReport();
      fetchMilestoneAchievements();
    }
  }, [selectedEvent, reportDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Get all events
      const { data, error } = await supabase
        .from('events')
        .select('id, name, event_year, start_date, end_date, status')
        .order('start_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching events:', error);
        Alert.alert('Error', 'Failed to load events');
        return;
      }
      
      if (data && data.length > 0) {
        setEvents(data);
        
        // Find default event - first Active event, or first Upcoming if no Active
        const activeEvent = data.find(e => e.status === 'Active');
        const upcomingEvent = data.find(e => e.status === 'Upcoming');
        
        setSelectedEvent(activeEvent || upcomingEvent || data[0]);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyReport = async () => {
    if (!selectedEvent) return;
    
    try {
      setLoading(true);
      
      // Get start and end dates for the week of the report date
      const startOfWeek = new Date(reportDate);
      startOfWeek.setDate(reportDate.getDate() - reportDate.getDay()); // Sunday of the week
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
      endOfWeek.setHours(23, 59, 59, 999);
      
      console.log(`Fetching weekly report for ${startOfWeek.toISOString()} to ${endOfWeek.toISOString()}`);
      
      // Step 1: Get all teams for this event
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('id, team_name')
        .eq('event_id', selectedEvent.id);
      
      if (teamsError) {
        console.error('Error fetching teams:', teamsError);
        return;
      }
      
      if (!teamsData || teamsData.length === 0) {
        console.log('No teams found for this event');
        setWeeklyReports([]);
        setLoading(false);
        return;
      }
      
      console.log(`Found ${teamsData.length} teams`);
      
      // Step 2: For each team, get team members
      const teamMembersPromises = teamsData.map(team => 
        supabase
          .from('team_members')
          .select('user_id, teams!inner(team_name)')
          .eq('team_id', team.id)
      );
      
      const teamMembersResults = await Promise.all(teamMembersPromises);
      
      // Map of team ID to member user IDs
      const teamMembersMap = new Map();
      
      teamMembersResults.forEach((result, index) => {
        if (result.error) {
          console.error(`Error fetching members for team ${teamsData[index].id}:`, result.error);
          return;
        }
        
        teamMembersMap.set(teamsData[index].id, result.data || []);
      });
      
      // Step 3: Get all activities for this event in this week
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('user_id, activity_minutes, activity_date')
        .eq('event_id', selectedEvent.id)
        .gte('activity_date', startOfWeek.toISOString().split('T')[0])
        .lte('activity_date', endOfWeek.toISOString().split('T')[0]);
      
      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
        return;
      }
      
      console.log(`Found ${activitiesData?.length || 0} activities in this week`);
      
      // Step 4: Get user profiles for all users with activities
      const userIds = [...new Set((activitiesData || []).map(a => a.user_id))];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      
      if (profilesError) {
        console.error('Error fetching user profiles:', profilesError);
        return;
      }
      
      // Create user lookup map
      const userMap = new Map();
      profilesData?.forEach(profile => {
        userMap.set(profile.id, profile);
      });
      
      // Step 5: Calculate activity totals by user
      const userActivityMap = new Map();
      
      (activitiesData || []).forEach(activity => {
        const currentTotal = userActivityMap.get(activity.user_id) || 0;
        userActivityMap.set(activity.user_id, currentTotal + activity.activity_minutes);
      });
      
      // Step 6: Calculate team totals and build the report
      const teamReports: TeamReport[] = [];
      const allUserActivities: UserActivity[] = [];
      
      teamsData.forEach(team => {
        const teamMembers = teamMembersMap.get(team.id) || [];
        let totalMinutes = 0;
        const activeMembers = new Set();
        const memberActivities: TeamMemberActivity[] = [];
        
        teamMembers.forEach((member: any) => {
          const userMinutes = userActivityMap.get(member.user_id) || 0;
          const user = userMap.get(member.user_id);
          
          if (userMinutes > 0) {
            activeMembers.add(member.user_id);
            totalMinutes += userMinutes;
            
            // Add to member activities list
            if (user) {
              memberActivities.push({
                id: member.user_id,
                user_id: member.user_id,
                full_name: user.full_name,
                email: user.email,
                total_minutes: userMinutes,
                team_id: team.id,
                team_name: team.team_name
              });
              
              // Also add to all users list
              allUserActivities.push({
                id: member.user_id,
                user_id: member.user_id,
                full_name: user.full_name,
                email: user.email,
                team_name: team.team_name,
                team_id: team.id,
                total_minutes: userMinutes
              });
            }
          }
        });
        
        // Sort member activities by minutes (descending)
        memberActivities.sort((a, b) => b.total_minutes - a.total_minutes);
        
        teamReports.push({
          id: team.id,
          team_name: team.team_name,
          total_minutes: totalMinutes,
          participants_count: activeMembers.size,
          members: memberActivities
        });
      });
      
      // Sort team reports by total minutes (descending)
      teamReports.sort((a, b) => b.total_minutes - a.total_minutes);
      
      // Sort all user activities by minutes (descending)
      allUserActivities.sort((a, b) => b.total_minutes - a.total_minutes);
      
      console.log(`Generated ${teamReports.length} team reports`);
      console.log(`Found ${allUserActivities.length} active users`);
      
      setWeeklyReports(teamReports);
      setAllUsersActivity(allUserActivities);
      
      // If a team was selected before, update its details
      if (selectedTeam) {
        const teamReport = teamReports.find(team => team.id === selectedTeam);
        if (teamReport) {
          setTeamDetails(teamReport as TeamReportDetails);
        } else {
          setSelectedTeam(null);
        }
      }
      
    } catch (error) {
      console.error('Error generating weekly report:', error);
      Alert.alert('Error', 'Failed to generate weekly report');
    } finally {
      setLoading(false);
    }
  };

  const fetchMilestoneAchievements = async () => {
    if (!selectedEvent) return;
    
    try {
      setLoading(true);
      console.log(`Fetching milestone achievements for event: ${selectedEvent.id}`);
      
      // Fetch milestones for this event
      const { data: milestones, error: milestonesError } = await supabase
        .from('milestones')
        .select('id, milestone_name, milestone_minutes, users_rewarded')
        .eq('event_id', selectedEvent.id)
        .order('milestone_minutes', { ascending: true });
      
      if (milestonesError) {
        console.error('Error fetching milestones:', milestonesError);
        setLoading(false);
        return;
      }
      
      console.log(`Found ${milestones?.length || 0} milestones`);
      
      if (!milestones || milestones.length === 0) {
        setEventMilestones([]);
        setMilestoneAchievements([]);
        setLoading(false);
        return;
      }
      
      setEventMilestones(milestones);
      
      // Fetch all activities for this event
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('user_id, activity_minutes, activity_date')
        .eq('event_id', selectedEvent.id);
      
      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
        setLoading(false);
        return;
      }
      
      console.log(`Found ${activities?.length || 0} activities`);
      
      if (!activities || activities.length === 0) {
        setMilestoneAchievements([]);
        setLoading(false);
        return;
      }
      
      // Calculate total minutes per user
      const userMinutes = new Map();
      const userLatestDate = new Map();
      
      activities.forEach(activity => {
        // Sum minutes
        const currentMinutes = userMinutes.get(activity.user_id) || 0;
        userMinutes.set(activity.user_id, currentMinutes + activity.activity_minutes);
        
        // Track latest date
        const activityDate = new Date(activity.activity_date || new Date());
        const currentLatest = userLatestDate.get(activity.user_id);
        
        if (!currentLatest || activityDate > currentLatest) {
          userLatestDate.set(activity.user_id, activityDate);
        }
      });
      
      // Get user details for all users with activities
      const userIds = [...userMinutes.keys()];
      console.log(`Found ${userIds.length} unique users with activities`);
      
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      
      if (usersError) {
        console.error('Error fetching user profiles:', usersError);
        setLoading(false);
        return;
      }
      
      // Create a map of user reward status from the milestones data
      const rewardedUsersMap = new Map();
      
      milestones.forEach(milestone => {
        const usersRewarded = milestone.users_rewarded || [];
        
        if (Array.isArray(usersRewarded)) {
          usersRewarded.forEach((reward: any) => {
            if (reward && reward.user_id) {
              const key = `${reward.user_id}___${milestone.id}`;
              rewardedUsersMap.set(key, {
                rewarded: true,
                rewarded_at: reward.rewarded_at
              });
            }
          });
        } else {
          console.warn(`users_rewarded for milestone ${milestone.id} is not an array:`, 
            typeof milestone.users_rewarded);
        }
      });
      
      // Also add a debug section after we build the rewards map
      console.log(`Built rewards map with ${rewardedUsersMap.size} entries`);
      if (rewardedUsersMap.size > 0) {
        console.log('Rewards map keys:', Array.from(rewardedUsersMap.keys()));
      }
      
      // Generate milestone achievements
      const achievements: MilestoneAchievement[] = [];
      
      users.forEach(user => {
        const totalMinutes = userMinutes.get(user.id) || 0;
        const achievedDate = userLatestDate.get(user.id)?.toISOString() || new Date().toISOString();
        
        console.log(`User ${user.full_name} has ${totalMinutes} minutes total`);
        
        // Check each milestone
        milestones.forEach(milestone => {
          if (totalMinutes >= milestone.milestone_minutes) {
            const achievementId = `${user.id}___${milestone.id}`;
            const rewardInfo = rewardedUsersMap.get(achievementId);
            
            console.log(`${user.full_name} qualifies for ${milestone.milestone_name} (${milestone.milestone_minutes}m), rewarded: ${!!rewardInfo}`);
            
            achievements.push({
              id: achievementId,
              user_id: user.id,
              full_name: user.full_name,
              email: user.email,
              milestone_id: milestone.id,
              milestone_name: milestone.milestone_name,
              milestone_minutes: milestone.milestone_minutes,
              achieved_at: achievedDate,
              rewarded: !!rewardInfo,
              rewarded_at: rewardInfo?.rewarded_at
            });
          }
        });
      });
      
      console.log(`Generated ${achievements.length} total achievements`);
      
      // Count achievements by milestone for debugging
      const milestoneAchievementCounts: Record<string, { total: number, rewarded: number }> = {};
      milestones.forEach(milestone => {
        const forThisMilestone = achievements.filter(a => a.milestone_id === milestone.id);
        const rewarded = forThisMilestone.filter(a => a.rewarded).length;
        
        milestoneAchievementCounts[milestone.milestone_name] = {
          total: forThisMilestone.length,
          rewarded
        };
      });
      
      console.log('Achievement counts by milestone:', milestoneAchievementCounts);
      
      setMilestoneAchievements(achievements);
    } catch (error) {
      console.error('Error in fetchMilestoneAchievements:', error);
      Alert.alert('Error', 'Failed to load milestone achievements');
    } finally {
      setLoading(false);
    }
  };

  const handleEventChange = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setReportDate(selectedDate);
    }
  };

  const formatDateRange = () => {
    if (!reportDate) return '';
    
    const startOfWeek = new Date(reportDate);
    startOfWeek.setDate(reportDate.getDate() - reportDate.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
  };

  const markMilestoneAsRewarded = async (achievementId: string) => {
    try {
      setMarkingReward(true);
      console.log(`Marking achievement as rewarded: ${achievementId}`);
      
      // Split using the triple underscore separator
      const [userId, milestoneId] = achievementId.split('___');
      
      console.log(`User ID: ${userId}, Milestone ID: ${milestoneId}`);
      
      // First, fetch the current milestone data
      const { data: milestone, error: fetchError } = await supabase
        .from('milestones')
        .select('users_rewarded')
        .eq('id', milestoneId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching milestone:', fetchError);
        Alert.alert('Error', 'Failed to load milestone data');
        return;
      }
      
      console.log('Current milestone data:', JSON.stringify(milestone));
      
      // Prepare the updated users_rewarded data
      let usersRewarded: Array<{user_id: string, rewarded_at: string}> = [];
      if (milestone.users_rewarded) {
        // If it's already an array, use it
        if (Array.isArray(milestone.users_rewarded)) {
          usersRewarded = [...milestone.users_rewarded];
        } else {
          console.log('users_rewarded is not an array, converting...');
          // If it's something else, start with empty array
          usersRewarded = [];
        }
      }
      
      console.log('Current usersRewarded:', JSON.stringify(usersRewarded));
      
      // Check if user is already in the list
      const userIndex = usersRewarded.findIndex((u) => u.user_id === userId);
      const now = new Date().toISOString();
      
      if (userIndex >= 0) {
        console.log('User already in rewarded list, updating timestamp');
        usersRewarded[userIndex].rewarded_at = now;
      } else {
        console.log('Adding user to rewarded list');
        usersRewarded.push({
          user_id: userId,
          rewarded_at: now
        });
      }
      
      console.log('Updated usersRewarded:', JSON.stringify(usersRewarded));
      
      // Update the milestone record with the new users_rewarded data
      const { error: updateError } = await supabase
        .from('milestones')
        .update({ users_rewarded: usersRewarded })
        .eq('id', milestoneId);
      
      if (updateError) {
        console.error('Error updating milestone:', updateError);
        Alert.alert('Error', 'Failed to mark user as rewarded');
        return;
      }
      
      console.log('Successfully updated milestone with rewarded user');
      
      // Update local state to reflect the change
      setMilestoneAchievements(milestoneAchievements.map(achievement => {
        if (achievement.id === achievementId) {
          console.log(`Updating achievement ${achievement.id} to rewarded`);
          return { ...achievement, rewarded: true, rewarded_at: now };
        }
        return achievement;
      }));
      
      Alert.alert('Success', 'User marked as rewarded');
    } catch (error) {
      console.error('Error marking achievement as rewarded:', error);
      Alert.alert('Error', 'Failed to mark user as rewarded');
    } finally {
      setMarkingReward(false);
    }
  };

  const filterAchievementsBySelectedMilestone = () => {
    if (!selectedMilestone) return [];
    
    console.log(`Filtering for milestone ID: ${selectedMilestone}`);
    console.log(`Total achievements: ${milestoneAchievements.length}`);
    
    // Filter by this milestone ID only 
    const filteredByMilestone = milestoneAchievements.filter(
      achievement => achievement.milestone_id === selectedMilestone
    );
    
    console.log(`Found ${filteredByMilestone.length} achievements for this milestone`);
    
    // Sort: unrewarded first, then alphabetically
    return filteredByMilestone.sort((a, b) => {
      if (a.rewarded !== b.rewarded) {
        return a.rewarded ? 1 : -1; // Non-rewarded first
      }
      return a.full_name.localeCompare(b.full_name); // Then alphabetically
    });
  };

  // First, add a function to get all achievements when no milestone is selected
  const getAllAchievements = () => {
    // Sort by milestone_minutes (ascending), then unrewarded first, then by name
    return [...milestoneAchievements].sort((a, b) => {
      // First by milestone_minutes
      if (a.milestone_minutes !== b.milestone_minutes) {
        return a.milestone_minutes - b.milestone_minutes;
      }
      
      // Then by reward status
      if (a.rewarded !== b.rewarded) {
        return a.rewarded ? 1 : -1; // Unrewarded first
      }
      
      // Finally by name
      return a.full_name.localeCompare(b.full_name);
    });
  };

  // Add utility functions to handle date operations
  const getWeekRanges = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Adjust start date to the beginning of the week (Sunday)
    const startOfFirstWeek = new Date(start);
    startOfFirstWeek.setDate(start.getDate() - start.getDay());
    startOfFirstWeek.setHours(0, 0, 0, 0);
    
    const weeks: {start: Date, end: Date}[] = [];
    let currentWeekStart = new Date(startOfFirstWeek);
    
    while (currentWeekStart <= end) {
      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
      currentWeekEnd.setHours(23, 59, 59, 999);
      
      weeks.push({
        start: new Date(currentWeekStart),
        end: new Date(currentWeekEnd)
      });
      
      // Move to next week
      currentWeekStart = new Date(currentWeekStart);
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return weeks;
  };

  // Add this effect to calculate available weeks when event changes
  useEffect(() => {
    if (selectedEvent) {
      // Calculate available weeks for this event
      const weeks = getWeekRanges(selectedEvent.start_date, selectedEvent.end_date);
      setAvailableWeeks(weeks);
      
      // Set the report date to the most recent week that has ended
      const now = new Date();
      const currentWeek = weeks.find(week => week.end < now);
      if (currentWeek) {
        setReportDate(new Date(currentWeek.start));
      } else if (weeks.length > 0) {
        setReportDate(new Date(weeks[0].start));
      }
    }
  }, [selectedEvent]);

  // Add this function to go back from team details view
  const handleBackFromTeamDetails = () => {
    setSelectedTeam(null);
    setTeamDetails(null);
  };

  // Add this function to view team details
  const handleViewTeamDetails = (teamId: string) => {
    const team = weeklyReports.find(t => t.id === teamId) as TeamReportDetails;
    if (team) {
      setSelectedTeam(teamId);
      setTeamDetails(team);
    }
  };

  // Add new render functions for team details and all users views
  const renderTeamMemberItem = ({ item }: { item: TeamMemberActivity }) => (
    <View style={styles.memberItem}>
      <View style={styles.memberInfo}>
        <ThemedText style={styles.memberName}>{item.full_name}</ThemedText>
        <ThemedText style={styles.memberEmail}>{item.email}</ThemedText>
      </View>
      <ThemedText style={styles.memberMinutes}>{item.total_minutes} minutes</ThemedText>
    </View>
  );

  const renderAllUserItem = ({ item }: { item: UserActivity }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <ThemedText style={styles.userName}>{item.full_name}</ThemedText>
        <ThemedText style={styles.userEmail}>{item.email}</ThemedText>
        <ThemedText style={styles.userTeam}>Team: {item.team_name}</ThemedText>
      </View>
      <ThemedText style={styles.userMinutes}>{item.total_minutes} minutes</ThemedText>
    </View>
  );

  // Modify the renderTeamReportItem function
  const renderTeamReportItem = ({ item }: { item: TeamReport }) => (
    <TouchableOpacity 
      style={styles.reportItem}
      onPress={() => handleViewTeamDetails(item.id)}
    >
      <View style={styles.reportHeader}>
        <ThemedText style={styles.teamName}>{item.team_name}</ThemedText>
      </View>
      <View style={styles.reportDetails}>
        <View style={styles.reportStat}>
          <ThemedText style={styles.statLabel}>Total Minutes</ThemedText>
          <ThemedText style={styles.statValue}>{item.total_minutes}</ThemedText>
        </View>
        <View style={styles.reportStat}>
          <ThemedText style={styles.statLabel}>Participants</ThemedText>
          <ThemedText style={styles.statValue}>{item.participants_count}</ThemedText>
        </View>
        <View style={styles.reportStat}>
          <ThemedText style={styles.statLabel}>Avg Min/Person</ThemedText>
          <ThemedText style={styles.statValue}>
            {item.participants_count > 0 
              ? Math.round(item.total_minutes / item.participants_count) 
              : 0}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Fix the missing renderMilestoneItem function (still needed for milestone achievements section)
  const renderMilestoneItem = ({ item }: { item: MilestoneAchievement }) => (
    <View style={[
      styles.milestoneItem,
      item.rewarded && styles.rewardedItem
    ]}>
      <View style={styles.milestoneHeader}>
        <ThemedText style={styles.userName}>{item.full_name}</ThemedText>
        <ThemedText style={[
          styles.milestoneBadge, 
          item.milestone_minutes === 50 ? styles.bronze : 
          item.milestone_minutes === 250 ? styles.silver : 
          styles.gold
        ]}>
          {item.milestone_minutes} Minutes
        </ThemedText>
      </View>
      <ThemedText style={styles.userEmail}>{item.email}</ThemedText>
      <ThemedText style={styles.achievedDate}>
        Achieved on: {new Date(item.achieved_at).toLocaleDateString()}
      </ThemedText>
      
      {item.rewarded ? (
        <View style={styles.rewardedBadge}>
          <ThemedText style={styles.rewardedText}>
            Rewarded on: {item.rewarded_at ? new Date(item.rewarded_at).toLocaleDateString() : 'Unknown'}
          </ThemedText>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.rewardButton}
          onPress={() => markMilestoneAsRewarded(item.id)}
          disabled={markingReward}
        >
          <ThemedText style={styles.rewardButtonText}>
            Mark as Rewarded
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );

  // Add this debugging section just above the milestone section
  useEffect(() => {
    console.log("Rendering milestone section");
    console.log("selectedMilestone:", selectedMilestone);
    console.log("milestoneAchievements.length:", milestoneAchievements.length);
    console.log("eventMilestones.length:", eventMilestones.length);
  }, [selectedMilestone, milestoneAchievements.length, eventMilestones.length]);

  // Add a function to navigate between weeks
  const navigateToWeek = (direction: 'prev' | 'next') => {
    if (!availableWeeks.length) return;
    
    // Find the index of the current week
    const currentIndex = availableWeeks.findIndex(
      week => week.start.toDateString() === new Date(reportDate).toDateString()
    );
    
    if (currentIndex === -1) return;
    
    // Calculate the new index
    let newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    
    // Ensure the index is within bounds
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= availableWeeks.length) newIndex = availableWeeks.length - 1;
    
    // Don't do anything if we're already at the first/last week
    if (newIndex === currentIndex) return;
    
    // Set the new report date
    setReportDate(new Date(availableWeeks[newIndex].start));
  };

  // Fix the SimpleBarChart component TypeScript errors
  const SimpleBarChart = ({ 
    data, 
    maxValue 
  }: { 
    data: Array<{label: string, value: number}>, 
    maxValue: number 
  }) => {
    return (
      <View style={styles.chartContainer}>
        <ThemedText style={styles.chartTitle}>Team Activity Comparison</ThemedText>
        {data.map((item, index) => (
          <View key={index} style={styles.chartItemContainer}>
            <ThemedText style={styles.chartLabel}>{item.label}</ThemedText>
            <View style={styles.barContainer}>
              <View 
                style={[
                  styles.bar, 
                  { width: `${Math.min((item.value / maxValue) * 100, 100)}%` }
                ]} 
              />
              <ThemedText style={styles.barValue}>{item.value} min</ThemedText>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // Add function to fetch cumulative report data
  const fetchCumulativeReport = async () => {
    if (!selectedEvent) return;
    
    try {
      setLoading(true);
      
      // Step 1: Get all teams for this event
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('id, team_name')
        .eq('event_id', selectedEvent.id);
      
      if (teamsError) {
        console.error('Error fetching teams:', teamsError);
        return;
      }
      
      if (!teamsData || teamsData.length === 0) {
        setCumulativeTeamData([]);
        setCumulativeUserData([]);
        setLoading(false);
        return;
      }
      
      // Step 2: For each team, get team members
      const teamMembersPromises = teamsData.map(team => 
        supabase
          .from('team_members')
          .select('user_id, teams!inner(team_name)')
          .eq('team_id', team.id)
      );
      
      const teamMembersResults = await Promise.all(teamMembersPromises);
      
      // Map of team ID to member user IDs
      const teamMembersMap = new Map();
      
      teamMembersResults.forEach((result, index) => {
        if (result.error) {
          console.error(`Error fetching members for team ${teamsData[index].id}:`, result.error);
          return;
        }
        
        teamMembersMap.set(teamsData[index].id, result.data || []);
      });
      
      // Step 3: Get all activities for this event (throughout the entire duration)
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('user_id, activity_minutes, activity_date')
        .eq('event_id', selectedEvent.id);
      
      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
        setLoading(false);
        return;
      }
      
      // Step 4: Get user profiles for all users with activities
      const userIds = [...new Set((activitiesData || []).map(a => a.user_id))];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      
      if (profilesError) {
        console.error('Error fetching user profiles:', profilesError);
        setLoading(false);
        return;
      }
      
      // Create user lookup map
      const userMap = new Map();
      profilesData?.forEach(profile => {
        userMap.set(profile.id, profile);
      });
      
      // Step 5: Calculate activity totals by user
      const userActivityMap = new Map();
      
      (activitiesData || []).forEach(activity => {
        const currentTotal = userActivityMap.get(activity.user_id) || 0;
        userActivityMap.set(activity.user_id, currentTotal + activity.activity_minutes);
      });
      
      // Step 6: Build team and user cumulative data
      const teamData: CumulativeTeamData[] = [];
      const allUserData: CumulativeMemberData[] = [];
      
      // Process team data
      teamsData.forEach(team => {
        const teamMembers = teamMembersMap.get(team.id) || [];
        let totalMinutes = 0;
        const activeMembers = new Set();
        const memberData: CumulativeMemberData[] = [];
        
        teamMembers.forEach((member: any) => {
          const userMinutes = userActivityMap.get(member.user_id) || 0;
          const user = userMap.get(member.user_id);
          
          if (user) {
            // Always include member in the team data, even if they have 0 minutes
            memberData.push({
              id: member.user_id,
              user_id: member.user_id,
              full_name: user.full_name,
              email: user.email,
              total_minutes: userMinutes,
              team_name: team.team_name,
              team_id: team.id,
              rank: 0, // To be set later
              team_rank: 0 // To be set later
            });
            
            if (userMinutes > 0) {
              activeMembers.add(member.user_id);
              totalMinutes += userMinutes;
              
              // Add to global user data list
              allUserData.push({
                id: member.user_id,
                user_id: member.user_id,
                full_name: user.full_name,
                email: user.email,
                total_minutes: userMinutes,
                team_name: team.team_name,
                team_id: team.id,
                rank: 0, // To be set later
                team_rank: 0 // To be set later
              });
            }
          }
        });
        
        // Sort members by minutes and assign team ranks
        memberData.sort((a, b) => b.total_minutes - a.total_minutes);
        memberData.forEach((member, index) => {
          // If same minutes as previous member, keep same rank
          if (index > 0 && member.total_minutes === memberData[index - 1].total_minutes) {
            member.team_rank = memberData[index - 1].team_rank;
          } else {
            member.team_rank = index + 1;
          }
        });
        
        teamData.push({
          id: team.id,
          team_name: team.team_name,
          total_minutes: totalMinutes,
          participants_count: activeMembers.size,
          rank: 0, // To be set later
          members: memberData
        });
      });
      
      // Sort teams by minutes and assign ranks
      teamData.sort((a, b) => b.total_minutes - a.total_minutes);
      teamData.forEach((team, index) => {
        // If same minutes as previous team, keep same rank
        if (index > 0 && team.total_minutes === teamData[index - 1].total_minutes) {
          team.rank = teamData[index - 1].rank;
        } else {
          team.rank = index + 1;
        }
      });
      
      // Sort all users and assign global ranks
      allUserData.sort((a, b) => b.total_minutes - a.total_minutes);
      allUserData.forEach((user, index) => {
        // If same minutes as previous user, keep same rank
        if (index > 0 && user.total_minutes === allUserData[index - 1].total_minutes) {
          user.rank = allUserData[index - 1].rank;
        } else {
          user.rank = index + 1;
        }
      });
      
      // Set state with the processed data
      setCumulativeTeamData(teamData);
      setCumulativeUserData(allUserData);
      
    } catch (error) {
      console.error('Error generating cumulative report:', error);
      Alert.alert('Error', 'Failed to generate cumulative report');
    } finally {
      setLoading(false);
    }
  };

  // Add effect to fetch cumulative report when event changes
  useEffect(() => {
    if (selectedEvent && reportType === 'cumulative') {
      fetchCumulativeReport();
    }
  }, [selectedEvent, reportType]);

  // Add handler for selecting a team in cumulative view
  const handleViewCumulativeTeamDetails = (teamId: string) => {
    setSelectedCumulativeTeam(teamId);
  };

  // Add handler for going back from team details
  const handleBackFromCumulativeTeamDetails = () => {
    setSelectedCumulativeTeam(null);
  };

  // Add render functions for cumulative reports
  const renderCumulativeTeamItem = ({ item }: { item: CumulativeTeamData }) => (
    <TouchableOpacity 
      style={styles.reportItem}
      onPress={() => handleViewCumulativeTeamDetails(item.id)}
    >
      <View style={styles.rankBadge}>
        <ThemedText style={styles.rankText}>{item.rank}</ThemedText>
      </View>
      <View style={styles.reportHeader}>
        <ThemedText style={styles.teamName}>{item.team_name}</ThemedText>
      </View>
      <View style={styles.reportDetails}>
        <View style={styles.reportStat}>
          <ThemedText style={styles.statLabel}>Total Minutes</ThemedText>
          <ThemedText style={styles.statValue}>{item.total_minutes}</ThemedText>
        </View>
        <View style={styles.reportStat}>
          <ThemedText style={styles.statLabel}>Participants</ThemedText>
          <ThemedText style={styles.statValue}>{item.participants_count}</ThemedText>
        </View>
        <View style={styles.reportStat}>
          <ThemedText style={styles.statLabel}>Avg Min/Person</ThemedText>
          <ThemedText style={styles.statValue}>
            {item.participants_count > 0 
              ? Math.round(item.total_minutes / item.participants_count) 
              : 0}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCumulativeMemberItem = ({ item }: { item: CumulativeMemberData }) => (
    <View style={styles.memberItem}>
      <View style={styles.rankBadge}>
        <ThemedText style={styles.rankText}>
          {selectedCumulativeTeam ? item.team_rank : item.rank}
        </ThemedText>
      </View>
      <View style={styles.memberInfo}>
        <ThemedText style={styles.memberName}>{item.full_name}</ThemedText>
        <ThemedText style={styles.memberEmail}>{item.email}</ThemedText>
        {!selectedCumulativeTeam && (
          <ThemedText style={styles.userTeam}>Team: {item.team_name}</ThemedText>
        )}
      </View>
      <ThemedText style={styles.memberMinutes}>{item.total_minutes} minutes</ThemedText>
    </View>
  );

  if (userLoading || loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </ThemedView>
    );
  }

  // Only render the content if the user is an admin
  if (!userProfile?.is_admin) {
    return null;
  }

  return (
    <ScrollView style={styles.scrollView}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Analytics & Reports</ThemedText>
        
        <View style={styles.eventSelector}>
          <ThemedText style={styles.selectorLabel}>Select Event:</ThemedText>
          {Platform.OS === 'ios' ? (
            <Picker
              selectedValue={selectedEvent?.id}
              style={styles.picker}
              onValueChange={handleEventChange}
            >
              {events.map((event) => (
                <Picker.Item key={event.id} label={event.name} value={event.id} />
              ))}
            </Picker>
          ) : (
            <View style={styles.androidPickerContainer}>
              <Picker
                selectedValue={selectedEvent?.id}
                style={styles.androidPicker}
                onValueChange={handleEventChange}
              >
                {events.map((event) => (
                  <Picker.Item key={event.id} label={event.name} value={event.id} />
                ))}
              </Picker>
            </View>
          )}
        </View>
        
        {selectedEvent && (
          <>
            <ThemedView style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText type="subtitle">Event Activity Reports</ThemedText>
                <View style={styles.reportTypeTabs}>
                  <TouchableOpacity
                    style={[
                      styles.reportTypeTab,
                      reportType === 'weekly' && styles.activeReportTypeTab
                    ]}
                    onPress={() => setReportType('weekly')}
                  >
                    <ThemedText style={[
                      styles.reportTypeTabText,
                      reportType === 'weekly' && styles.activeReportTypeTabText
                    ]}>Weekly</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.reportTypeTab,
                      reportType === 'cumulative' && styles.activeReportTypeTab
                    ]}
                    onPress={() => setReportType('cumulative')}
                  >
                    <ThemedText style={[
                      styles.reportTypeTabText,
                      reportType === 'cumulative' && styles.activeReportTypeTabText
                    ]}>Cumulative</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.weekNavigationContainer}>
                <TouchableOpacity
                  style={[
                    styles.weekNavButton,
                    styles.weekNavButtonLeft
                  ]}
                  onPress={() => navigateToWeek('prev')}
                >
                  <Ionicons name="chevron-back" size={20} color="#0a7ea4" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <ThemedText style={styles.weekLabel}>Week: {formatDateRange()}</ThemedText>
                  <Ionicons name="calendar-outline" size={20} color="white" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.weekNavButton,
                    styles.weekNavButtonRight
                  ]}
                  onPress={() => navigateToWeek('next')}
                >
                  <Ionicons name="chevron-forward" size={20} color="#0a7ea4" />
                </TouchableOpacity>
                
                {showDatePicker && (
                  <DateTimePicker
                    value={reportDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}
              </View>
              
              <View style={styles.reportTabs}>
                <TouchableOpacity
                  style={[
                    styles.reportTab,
                    weeklyReportView === 'teams' && styles.activeReportTab
                  ]}
                  onPress={() => setWeeklyReportView('teams')}
                >
                  <ThemedText style={[
                    styles.reportTabText,
                    weeklyReportView === 'teams' && styles.activeReportTabText
                  ]}>Teams</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.reportTab,
                    weeklyReportView === 'users' && styles.activeReportTab
                  ]}
                  onPress={() => setWeeklyReportView('users')}
                >
                  <ThemedText style={[
                    styles.reportTabText,
                    weeklyReportView === 'users' && styles.activeReportTabText
                  ]}>All Users</ThemedText>
                </TouchableOpacity>
              </View>
              
              {selectedTeam && teamDetails ? (
                // Team details view
                <View style={styles.teamDetailsContainer}>
                  <View style={styles.teamDetailHeader}>
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={handleBackFromTeamDetails}
                    >
                      <ThemedText style={styles.backButtonText}>← Back to Teams</ThemedText>
                    </TouchableOpacity>
                    <ThemedText style={styles.teamDetailTitle}>{teamDetails.team_name} Members</ThemedText>
                  </View>
                  
                  {teamDetails.members.length > 0 ? (
                    <FlatList
                      data={teamDetails.members}
                      renderItem={renderTeamMemberItem}
                      keyExtractor={(item) => item.id}
                      style={styles.membersList}
                    />
                  ) : (
                    <ThemedText style={styles.emptyText}>No member activity found for this week.</ThemedText>
                  )}
                </View>
              ) : weeklyReportView === 'teams' ? (
                // Teams view
                weeklyReports.length > 0 ? (
                  <>
                    <FlatList
                      data={weeklyReports}
                      renderItem={renderTeamReportItem}
                      keyExtractor={(item) => item.id}
                      style={styles.reportsList}
                    />
                    {weeklyReports.length > 0 && (
                      <SimpleBarChart 
                        data={weeklyReports.map(team => ({ 
                          label: team.team_name, 
                          value: team.total_minutes 
                        }))}
                        maxValue={Math.max(...weeklyReports.map(team => team.total_minutes), 1)}
                      />
                    )}
                  </>
                ) : (
                  <ThemedText style={styles.emptyText}>
                    No team activity data found for this week.
                  </ThemedText>
                )
              ) : (
                // All users view
                allUsersActivity.length > 0 ? (
                  <FlatList
                    data={allUsersActivity}
                    renderItem={renderAllUserItem}
                    keyExtractor={(item) => item.id}
                    style={styles.usersList}
                  />
                ) : (
                  <ThemedText style={styles.emptyText}>
                    No user activity found for this week.
                  </ThemedText>
                )
              )}
            </ThemedView>
            
            {reportType === 'cumulative' && (
              <>
                <View style={styles.reportTabs}>
                  <TouchableOpacity
                    style={[
                      styles.reportTab,
                      cumulativeView === 'teams' && styles.activeReportTab
                    ]}
                    onPress={() => {
                      setCumulativeView('teams');
                      setSelectedCumulativeTeam(null);
                    }}
                  >
                    <ThemedText style={[
                      styles.reportTabText,
                      cumulativeView === 'teams' && styles.activeReportTabText
                    ]}>Teams Ranking</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.reportTab,
                      cumulativeView === 'users' && styles.activeReportTab
                    ]}
                    onPress={() => {
                      setCumulativeView('users');
                      setSelectedCumulativeTeam(null);
                    }}
                  >
                    <ThemedText style={[
                      styles.reportTabText,
                      cumulativeView === 'users' && styles.activeReportTabText
                    ]}>All Users Ranking</ThemedText>
                  </TouchableOpacity>
                </View>
                
                {selectedCumulativeTeam && cumulativeView === 'teams' ? (
                  // Team members view
                  <View style={styles.teamDetailsContainer}>
                    <View style={styles.teamDetailHeader}>
                      <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleBackFromCumulativeTeamDetails}
                      >
                        <ThemedText style={styles.backButtonText}>← Back to Teams</ThemedText>
                      </TouchableOpacity>
                      <ThemedText style={styles.teamDetailTitle}>
                        {cumulativeTeamData.find(t => t.id === selectedCumulativeTeam)?.team_name} Members
                      </ThemedText>
                    </View>
                    
                    {(cumulativeTeamData.find(t => t.id === selectedCumulativeTeam)?.members || []).length > 0 ? (
                      <FlatList
                        data={cumulativeTeamData.find(t => t.id === selectedCumulativeTeam)?.members || []}
                        renderItem={renderCumulativeMemberItem}
                        keyExtractor={(item) => item.id}
                        style={styles.membersList}
                      />
                    ) : (
                      <ThemedText style={styles.emptyText}>No member activity found.</ThemedText>
                    )}
                  </View>
                ) : cumulativeView === 'teams' ? (
                  // Teams ranking view
                  cumulativeTeamData.length > 0 ? (
                    <FlatList
                      data={cumulativeTeamData}
                      renderItem={renderCumulativeTeamItem}
                      keyExtractor={(item) => item.id}
                      style={styles.reportsList}
                    />
                  ) : (
                    <ThemedText style={styles.emptyText}>
                      No team activity data found for this event.
                    </ThemedText>
                  )
                ) : (
                  // All users ranking view
                  cumulativeUserData.length > 0 ? (
                    <FlatList
                      data={cumulativeUserData}
                      renderItem={renderCumulativeMemberItem}
                      keyExtractor={(item) => item.id}
                      style={styles.usersList}
                    />
                  ) : (
                    <ThemedText style={styles.emptyText}>
                      No user activity found for this event.
                    </ThemedText>
                  )
                )}
              </>
            )}
          </>
        )}
        
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Milestone Achievements</ThemedText>
          
          {eventMilestones.length > 0 ? (
            <View style={styles.milestoneTabs}>
              {eventMilestones.map(milestone => {
                // Count achievements for this milestone
                const count = milestoneAchievements.filter(
                  a => a.milestone_id === milestone.id
                ).length;
                
                // Count unrewarded achievements
                const unrewardedCount = milestoneAchievements.filter(
                  a => a.milestone_id === milestone.id && !a.rewarded
                ).length;
                
                return (
                  <TouchableOpacity
                    key={milestone.id}
                    style={[
                      styles.milestoneTab,
                      selectedMilestone === milestone.id && styles.selectedMilestoneTab
                    ]}
                    onPress={() => {
                      console.log(`Setting selected milestone to: ${milestone.id}`);
                      setSelectedMilestone(milestone.id);
                    }}
                  >
                    <View style={[
                      styles.tabIndicator, 
                      milestone.milestone_minutes === 50 ? styles.bronze :
                      milestone.milestone_minutes === 250 ? styles.silver :
                      styles.gold
                    ]} />
                    <ThemedText style={styles.milestoneTabText}>
                      {milestone.milestone_name} ({milestone.milestone_minutes}m) - {count} 
                      {unrewardedCount > 0 && ` (${unrewardedCount} unrewarded)`}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <ThemedText style={styles.emptyText}>
              No milestones defined for this event.
            </ThemedText>
          )}
          
          {selectedMilestone === null ? (
            // Show all achievements when no milestone is selected
            <>
              {milestoneAchievements.length > 0 ? (
                <>
                  <ThemedText style={styles.infoText}>
                    Showing all {milestoneAchievements.length} achievements across all milestones. 
                    Select a specific milestone above to filter.
                  </ThemedText>
                  <FlatList
                    data={getAllAchievements()}
                    renderItem={renderMilestoneItem}
                    keyExtractor={(item) => item.id}
                    style={styles.milestonesList}
                  />
                </>
              ) : (
                <ThemedText style={styles.emptyText}>
                  No milestone achievements found for this event.
                </ThemedText>
              )}
            </>
          ) : (
            // A specific milestone is selected
            <>
              {filterAchievementsBySelectedMilestone().length > 0 ? (
                <FlatList
                  data={filterAchievementsBySelectedMilestone()}
                  renderItem={renderMilestoneItem}
                  keyExtractor={(item) => item.id}
                  style={styles.milestonesList}
                />
              ) : (
                <ThemedText style={styles.emptyText}>
                  No users have achieved this milestone yet.
                </ThemedText>
              )}
            </>
          )}
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginBottom: 24,
  },
  eventSelector: {
    marginBottom: 24,
  },
  selectorLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  picker: {
    height: 50,
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  androidPickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  androidPicker: {
    height: 50,
    width: '100%',
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionHeader: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  reportTypeTabs: {
    flexDirection: 'row',
    marginTop: 8,
  },
  reportTypeTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeReportTypeTab: {
    backgroundColor: '#0a7ea4',
  },
  reportTypeTabText: {
    color: '#666',
  },
  activeReportTypeTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  weekNavigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  weekNavButton: {
    padding: 10,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  weekNavButtonLeft: {
    marginRight: 8,
  },
  weekNavButtonRight: {
    marginLeft: 8,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#0a7ea4',
    borderRadius: 4,
  },
  weekLabel: {
    color: 'white',
    marginRight: 8,
  },
  chartContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  chartItemContainer: {
    marginBottom: 12,
  },
  chartLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  barContainer: {
    height: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  bar: {
    height: '100%',
    backgroundColor: '#0a7ea4',
    borderRadius: 4,
  },
  barValue: {
    position: 'absolute',
    right: 8,
    top: 3,
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  reportsList: {
    marginTop: 16,
  },
  reportItem: {
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  reportHeader: {
    marginBottom: 12,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  reportDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reportStat: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  milestoneTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 16,
  },
  milestoneTab: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  selectedMilestoneTab: {
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  tabIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  milestoneTabText: {
    fontSize: 14,
  },
  milestonesList: {
    marginTop: 8,
  },
  milestoneItem: {
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  rewardedItem: {
    backgroundColor: '#f0f7f0',
    borderColor: '#d0e0d0',
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#666',
    marginBottom: 8,
  },
  milestoneBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  achievedDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  rewardedBadge: {
    backgroundColor: '#e0f7e0',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  rewardedText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  rewardButton: {
    backgroundColor: '#0a7ea4',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  rewardButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
    color: '#666',
  },
  bronze: {
    backgroundColor: '#CD7F32',
  },
  silver: {
    backgroundColor: '#C0C0C0',
  },
  gold: {
    backgroundColor: '#FFD700',
  },
  infoText: {
    textAlign: 'center',
    marginVertical: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  reportTabs: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  reportTab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  activeReportTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0a7ea4',
  },
  reportTabText: {
    fontSize: 16,
    color: '#666',
  },
  activeReportTabText: {
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  teamDetailsContainer: {
    flex: 1,
  },
  teamDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamDetailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  backButtonText: {
    color: '#0a7ea4',
  },
  membersList: {
    flex: 1,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberEmail: {
    fontSize: 12,
    color: '#666',
  },
  memberMinutes: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  usersList: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userInfo: {
    flex: 1,
  },
  userTeam: {
    fontSize: 12,
    color: '#0a7ea4',
    marginTop: 4,
  },
  userMinutes: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
}); 