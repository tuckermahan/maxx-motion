import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Image, Pressable, Platform, ImageBackground, Text, ActivityIndicator, TouchableOpacity, Modal, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

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

type Team = {
  id: string;
  team_name: string;
  team_minute_goal: number;
  captain_id: string;
  event_id: string;
};

type Event = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'Upcoming' | 'Active' | 'Archive';
};

// Type for the nested data structure returned by the team members query
type TeamMembershipQueryResult = {
  team_id: string;
  teams: {
    id: string;
    team_name: string;
    team_minute_goal: number;
    captain_id: string;
    event_id: string;
    events: {
      id: string;
      name: string;
      start_date: string;
      end_date: string;
      status: 'Upcoming' | 'Active' | 'Archive';
    }
  }
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  noTeamContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noTeamText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  noTeamTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  noTeamSubtext: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  joinEventButton: {
    backgroundColor: '#C41E3A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  joinEventButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  joinButton: {
    backgroundColor: '#C41E3A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerBackground: {
    width: '100%',
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
  mainContent: {
    padding: 16,
  },
  scrollContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  goalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default function TeamScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);

  // New state variables for database data
  const [loading, setLoading] = useState(true);
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [userEvent, setUserEvent] = useState<Event | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamRank, setTeamRank] = useState<number | null>(null);
  const [totalTeamMinutes, setTotalTeamMinutes] = useState<number>(0);
  const [teamStats, setTeamStats] = useState({
    totalMinutes: 0,
    targetMinutes: 0,
    activeMembers: 0,
    weeklyGrowth: 0,
    avgMinPerMember: 0,
  });
  const [goalEditModalVisible, setGoalEditModalVisible] = useState(false);
  const [newGoalValue, setNewGoalValue] = useState('');

  // Fetch user's team from active or upcoming event
  useEffect(() => {
    if (user) {
      fetchUserTeamAndEvent();
    }
  }, [user]);

  // Fetch team members when team is loaded
  useEffect(() => {
    if (userTeam) {
      fetchTeamMembers();
      fetchTeamRank();
    }
  }, [userTeam]);

  // Update team stats when team members or total minutes change
  useEffect(() => {
    if (userTeam && teamMembers.length > 0) {
      fetchTeamStats();
    }
  }, [userTeam, teamMembers, totalTeamMinutes]);

  // Update the useEffect to debounce search and prevent performance issues
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (searchQuery.trim() === '') {
        setFilteredMembers(teamMembers);
      } else {
        const query = searchQuery.toLowerCase().trim();
        const results = teamMembers.filter(member => {
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
  }, [searchQuery, teamMembers]);

  // Fetch user's team and event
  const fetchUserTeamAndEvent = async () => {
    try {
      setLoading(true);

      console.log('Fetching teams for user:', user?.id);

      // Get user's team memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('team_members')
        .select('team_id, teams!inner(id, team_name, team_minute_goal, captain_id, event_id, events!inner(id, name, start_date, end_date, status))')
        .eq('user_id', user?.id);

      if (membershipError) {
        console.error('Error fetching team memberships:', membershipError);
        setLoading(false);
        return;
      }

      console.log('Team memberships found:', memberships?.length || 0);
      console.log('Raw membership data:', JSON.stringify(memberships));

      if (!memberships || memberships.length === 0) {
        // User is not part of any team
        console.log('No team memberships found for user');
        setLoading(false);
        return;
      }

      // Find active event team first
      let activeEventTeam = null;

      // Try to find an active event
      for (const membership of memberships) {
        // Access nested properties safely - handle teams as an array
        const teamsArray = membership?.teams;
        if (teamsArray && Array.isArray(teamsArray) && teamsArray.length > 0) {
          const team = teamsArray[0];
          console.log('Checking team:', team?.team_name);

          const eventsArray = team.events;
          if (eventsArray && Array.isArray(eventsArray) && eventsArray.length > 0) {
            const event = eventsArray[0];
            console.log('Found event with status:', event?.status);

            if (event.status === 'Active') {
              console.log('Active event found:', event?.name);
              activeEventTeam = membership;
              break;
            }
          } else {
            console.log('No events found for team');
          }
        } else {
          console.log('Teams array is empty or not properly structured');
        }
      }

      // If no active event, look for upcoming event
      if (!activeEventTeam) {
        console.log('No active event found, looking for upcoming events');
        for (const membership of memberships) {
          const teamsArray = membership?.teams;
          if (teamsArray && Array.isArray(teamsArray) && teamsArray.length > 0) {
            const team = teamsArray[0];
            const eventsArray = team.events;
            if (eventsArray && Array.isArray(eventsArray) && eventsArray.length > 0) {
              const event = eventsArray[0];
              if (event.status === 'Upcoming') {
                console.log('Upcoming event found:', event?.name);
                activeEventTeam = membership;
                break;
              }
            }
          }
        }
      }

      // If neither active nor upcoming, use the first one (likely archived)
      if (!activeEventTeam && memberships.length > 0) {
        console.log('No active or upcoming events found, using first available membership');
        activeEventTeam = memberships[0];
      }

      if (activeEventTeam) {
        console.log('Selected team membership:', activeEventTeam);
        const teamsArray = activeEventTeam.teams;

        // Check if teams is already an object rather than an array
        if (teamsArray && typeof teamsArray === 'object') {
          let team;
          let eventsData;

          // Handle both array and direct object cases
          if (Array.isArray(teamsArray)) {
            console.log('Teams is an array with length:', teamsArray.length);
            if (teamsArray.length > 0) {
              team = teamsArray[0];
            }
          } else {
            console.log('Teams is a direct object');
            team = teamsArray;
          }

          if (team) {
            console.log('Team found:', team.team_name);

            const teamData = {
              id: team.id || '',
              team_name: team.team_name || '',
              team_minute_goal: team.team_minute_goal || 10000,
              captain_id: team.captain_id || '',
              event_id: team.event_id || ''
            };

            // Handle events the same way - could be array or direct object
            if (team.events) {
              if (Array.isArray(team.events)) {
                console.log('Events is an array with length:', team.events.length);
                if (team.events.length > 0) {
                  eventsData = team.events[0];
                }
              } else {
                console.log('Events is a direct object');
                eventsData = team.events;
              }

              if (eventsData) {
                console.log('Event found:', eventsData.name, 'with status:', eventsData.status);

                const eventData = {
                  id: eventsData.id || '',
                  name: eventsData.name || '',
                  start_date: eventsData.start_date || '',
                  end_date: eventsData.end_date || '',
                  status: (eventsData.status as 'Upcoming' | 'Active' | 'Archive') || 'Archive'
                };

                console.log('Setting user team:', teamData);
                console.log('Setting user event:', eventData);

                setUserTeam(teamData);
                setUserEvent(eventData);
              } else {
                console.log('No valid event data found');
              }
            } else {
              console.log('No events property found on team');
            }
          } else {
            console.log('No valid team found');
          }
        } else {
          console.log('Teams property is not an object or is undefined');
        }
      } else {
        console.log('No active team membership found');
      }
    } catch (err) {
      console.error('Error fetching user team:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch team members
  const fetchTeamMembers = async () => {
    if (!userTeam) return;

    try {
      // Get all team members
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('id, team_id, user_id, joined_at, profiles!inner(id, full_name, avatar_url)')
        .eq('team_id', userTeam.id);

      if (membersError) {
        console.error('Error fetching team members:', membersError);
        return;
      }

      // Get activities for all team members
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('user_id, activity_minutes')
        .eq('event_id', userTeam.event_id);

      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
      }

      // Calculate minutes for each member
      const memberMinutes: { [key: string]: number } = {};

      activities?.forEach(activity => {
        memberMinutes[activity.user_id] = (memberMinutes[activity.user_id] || 0) + activity.activity_minutes;
      });

      // Calculate total minutes for the team
      const totalMinutes = Object.values(memberMinutes).reduce((sum, minutes) => sum + minutes, 0);
      setTotalTeamMinutes(totalMinutes);

      // Map members with their minutes and calculate contribution percentage
      const mappedMembers: TeamMember[] = [];

      if (members) {
        for (const member of members) {
          if (member) {
            // Handle profiles as an array if needed
            const profileData = member.profiles;
            const profile = Array.isArray(profileData) ? profileData[0] : profileData;

            if (profile) {
              const userMinutes = memberMinutes[member.user_id] || 0;
              const contributionPercentage = totalMinutes > 0
                ? ((userMinutes / totalMinutes) * 100).toFixed(1) + '%'
                : '0.0%';

              mappedMembers.push({
                id: member.id,
                user_id: member.user_id,
                team_id: member.team_id,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
                joined_at: member.joined_at,
                is_captain: userTeam.captain_id === member.user_id,
                total_minutes: userMinutes,
                contribution_percentage: contributionPercentage,
                rank: 0, // Will be set after sorting
              });
            }
          }
        }
      }

      // Sort by minutes (descending) and assign ranks
      mappedMembers.sort((a, b) => b.total_minutes - a.total_minutes);
      mappedMembers.forEach((member, index) => {
        member.rank = index + 1;
      });

      setTeamMembers(mappedMembers);
      setFilteredMembers(mappedMembers);
    } catch (err) {
      console.error('Error processing team members:', err);
    }
  };

  // Fetch team statistics
  const fetchTeamStats = async () => {
    if (!userTeam) return;

    try {
      // Get active members count (members with at least 1 minute logged)
      const activeMembers = teamMembers.filter(member => member.total_minutes > 0).length;

      // Calculate average minutes per member
      const avgMinPerMember = teamMembers.length > 0
        ? Math.round(totalTeamMinutes / teamMembers.length)
        : 0;

      // Calculate weekly growth (mock data for now)
      // In a real implementation, you would compare activity from current week vs previous week
      const weeklyGrowth = 15;

      setTeamStats({
        totalMinutes: totalTeamMinutes,
        targetMinutes: userTeam.team_minute_goal,
        activeMembers,
        weeklyGrowth,
        avgMinPerMember,
      });
    } catch (err) {
      console.error('Error calculating team stats:', err);
    }
  };

  // Fetch team rank in the event
  const fetchTeamRank = async () => {
    if (!userTeam) return;

    try {
      // Get all teams in the event
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id')
        .eq('event_id', userTeam.event_id);

      if (teamsError) {
        console.error('Error fetching teams:', teamsError);
        return;
      }

      // For each team, calculate total minutes
      const teamMinutes: { id: string, totalMinutes: number }[] = [];

      for (const team of teams) {
        // Get activities for this team's members
        const { data: teamMemberIds, error: memberError } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_id', team.id);

        if (memberError) {
          console.error(`Error fetching members for team ${team.id}:`, memberError);
          continue;
        }

        if (!teamMemberIds || teamMemberIds.length === 0) {
          teamMinutes.push({ id: team.id, totalMinutes: 0 });
          continue;
        }

        const userIds = teamMemberIds.map(m => m.user_id);

        // Get activities for these users
        const { data: activities, error: activitiesError } = await supabase
          .from('activities')
          .select('activity_minutes')
          .eq('event_id', userTeam.event_id)
          .in('user_id', userIds);

        if (activitiesError) {
          console.error(`Error fetching activities for team ${team.id}:`, activitiesError);
          continue;
        }

        const teamTotalMinutes = activities?.reduce((sum, activity) =>
          sum + activity.activity_minutes, 0) || 0;

        teamMinutes.push({ id: team.id, totalMinutes: teamTotalMinutes });
      }

      // Sort by minutes (descending)
      teamMinutes.sort((a, b) => b.totalMinutes - a.totalMinutes);

      // Find our team's rank
      const rank = teamMinutes.findIndex(team => team.id === userTeam.id) + 1;
      setTeamRank(rank);

    } catch (err) {
      console.error('Error calculating team rank:', err);
    }
  };

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

  // Show goal edit modal
  const showGoalEditModal = () => {
    setNewGoalValue(userTeam?.team_minute_goal.toString() || '10000');
    setGoalEditModalVisible(true);
  };

  // Handle edit team goal
  const handleEditTeamGoal = async () => {
    if (!userTeam) return;

    setGoalEditModalVisible(false);

    // Validate input
    const goalValue = parseInt(newGoalValue);
    if (isNaN(goalValue) || goalValue <= 0) {
      Alert.alert('Invalid Value', 'Please enter a positive number for the team goal');
      return;
    }

    // Update team goal in database
    try {
      const { error } = await supabase
        .from('teams')
        .update({ team_minute_goal: goalValue })
        .eq('id', userTeam.id);

      if (error) {
        console.error('Error updating team goal:', error);
        Alert.alert('Error', 'Failed to update team goal. Please try again.');
        return;
      }

      // Update local state
      setUserTeam({
        ...userTeam,
        team_minute_goal: goalValue
      });

      // Update team stats
      setTeamStats({
        ...teamStats,
        targetMinutes: goalValue
      });

      // Show success message
      Alert.alert('Success', 'Team goal updated successfully');
    } catch (error) {
      console.error('Error updating team goal:', error);
      Alert.alert('Error', 'Failed to update team goal. Please try again.');
    }
  };

  const navigateToJoinEvent = () => {
    router.push('/join-event');
  };

  const displayedMembers = showAllMembers ? teamMembers : teamMembers.slice(0, 5);

  // Calculate progress percentage
  const progressPercentage = userTeam && teamStats.targetMinutes > 0
    ? Math.min(100, (teamStats.totalMinutes / teamStats.targetMinutes) * 100)
    : 0;

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
            <Text style={styles.pageTitle}>Team</Text>
            <Text style={styles.tagline}>Track your motion. Reach your potential.</Text>
          </View>
        </LinearGradient>
      </ImageBackground>

      {!userTeam ? (
        <View style={styles.noTeamContainer}>
          <ThemedText style={styles.noTeamTitle}>You're not part of any team yet</ThemedText>
          <ThemedText style={styles.noTeamSubtext}>Join a team to start tracking your progress together!</ThemedText>
          <TouchableOpacity style={styles.joinButton} onPress={navigateToJoinEvent}>
            <ThemedText style={styles.joinButtonText}>Join an Event & Team</ThemedText>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C41E3A" />
          <Text style={styles.loadingText}>Loading team data...</Text>
        </View>
      ) : (
        <>
          <View style={styles.mainContent}>
            <ThemedView style={styles.card}>
              <View style={styles.teamInfo}>
                <View style={styles.teamIcon}>
                  <ThemedText style={styles.teamIconText}>
                    {userTeam.team_name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()}
                  </ThemedText>
                </View>
                <View style={styles.teamDetails}>
                  <ThemedText style={styles.teamName}>{userTeam.team_name}</ThemedText>
                  <ThemedText style={styles.teamSubtext}>
                    {teamMembers.length} Members • Captain: {teamMembers.find(m => m.is_captain)?.full_name || 'Unknown'}
                  </ThemedText>
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
                    <ThemedText style={styles.progressText}>
                      {teamStats.totalMinutes} / {teamStats.targetMinutes} minutes
                    </ThemedText>
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
                  ]}>RANK: {teamRank ? `${teamRank}${teamRank === 1 ? 'st' : teamRank === 2 ? 'nd' : teamRank === 3 ? 'rd' : 'th'}` : '...'}</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, hoveredButton === 'edit' && styles.actionButtonHovered]}
                  onHoverIn={() => setHoveredButton('edit')}
                  onHoverOut={() => setHoveredButton(null)}
                  onPress={showGoalEditModal}
                >
                  <ThemedText style={[
                    styles.actionButtonText,
                    hoveredButton === 'edit' && styles.actionButtonTextHovered
                  ]}>EDIT GOAL</ThemedText>
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
          </View>

          <ScrollView style={styles.scrollContent}>
            <View style={styles.content}>
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
                          source={{ uri: member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name)}&background=random` }}
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

                {searchQuery.trim() === '' && teamMembers.length > 5 && (
                  <Pressable
                    onPress={() => setShowAllMembers(!showAllMembers)}
                  >
                    <ThemedText style={styles.seeAllMembers}>
                      {showAllMembers ? 'SHOW LESS' : `SEE ALL MEMBERS (${teamMembers.length})`}
                    </ThemedText>
                  </Pressable>
                )}
              </ThemedView>
            </View>
          </ScrollView>
        </>
      )}

      <MemberDetails
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        member={selectedMember ? {
          full_name: selectedMember.full_name,
          joined_at: selectedMember.joined_at,
          rank: selectedMember.rank,
          total_minutes: selectedMember.total_minutes,
          activities_logged: Math.floor(selectedMember.total_minutes / 30), // Approximation
          current_milestone: `${Math.floor(selectedMember.total_minutes / 100) * 100} minutes`,
          contribution_percentage: selectedMember.contribution_percentage,
          avatar_url: selectedMember.avatar_url || '',
        } : null}
      />

      {/* Edit Goal Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={goalEditModalVisible}
        onRequestClose={() => setGoalEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Team Minute Goal</Text>
            <TextInput
              style={styles.goalInput}
              keyboardType="number-pad"
              value={newGoalValue}
              onChangeText={setNewGoalValue}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setGoalEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleEditTeamGoal}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
} 