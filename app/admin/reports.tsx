import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Alert, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useUser } from '../../contexts/UserContext';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

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
      
      // Query to get weekly team report data using the activities table
      // Join to get team data and count participants
      const { data, error } = await supabase
        .from('teams')
        .select(`
          id,
          team_name,
          team_members!inner(user_id),
          activities!inner(activity_minutes, user_id)
        `)
        .eq('event_id', selectedEvent.id)
        .gte('activities.activity_date', startOfWeek.toISOString().split('T')[0])
        .lte('activities.activity_date', endOfWeek.toISOString().split('T')[0])
        .eq('activities.event_id', selectedEvent.id);
      
      if (error) {
        console.error('Error fetching weekly report:', error);
        // Fallback to sample data for development
        const sampleTeams = [
          { id: '1', team_name: 'Team Alpha', total_minutes: 1250, participants_count: 5 },
          { id: '2', team_name: 'Team Beta', total_minutes: 980, participants_count: 4 },
          { id: '3', team_name: 'Team Gamma', total_minutes: 1530, participants_count: 6 },
          { id: '4', team_name: 'Team Delta', total_minutes: 750, participants_count: 3 },
        ];
        setWeeklyReports(sampleTeams);
      } else if (data) {
        // Process the returned data to calculate totals and participant counts
        const teamReports: TeamReport[] = [];
        
        data.forEach(team => {
          // Get unique users who logged activities
          const participantIds = new Set();
          let totalMinutes = 0;
          
          // Process each activity
          team.activities.forEach((activity: any) => {
            participantIds.add(activity.user_id);
            totalMinutes += activity.activity_minutes;
          });
          
          teamReports.push({
            id: team.id,
            team_name: team.team_name,
            total_minutes: totalMinutes,
            participants_count: participantIds.size
          });
        });
        
        setWeeklyReports(teamReports);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
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

  const renderTeamReportItem = ({ item }: { item: TeamReport }) => (
    <View style={styles.reportItem}>
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
    </View>
  );

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
              <ThemedText type="subtitle">Weekly Team Report</ThemedText>
              
              <View style={styles.datePickerContainer}>
                <ThemedText>Week: {formatDateRange()}</ThemedText>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <ThemedText style={styles.datePickerButtonText}>Change Week</ThemedText>
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
              
              {weeklyReports.length > 0 ? (
                <FlatList
                  data={weeklyReports}
                  renderItem={renderTeamReportItem}
                  keyExtractor={(item) => item.id}
                  style={styles.reportsList}
                />
              ) : (
                <ThemedText style={styles.emptyText}>
                  No team activity data found for this week.
                </ThemedText>
              )}
            </ThemedView>
            
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
          </>
        )}
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
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  datePickerButton: {
    padding: 8,
    backgroundColor: '#0a7ea4',
    borderRadius: 4,
  },
  datePickerButtonText: {
    color: 'white',
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
}); 