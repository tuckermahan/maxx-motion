import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, FlatList, TextInput, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useUser } from '../../contexts/UserContext';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

// Define types for our data
type Event = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'Upcoming' | 'Active' | 'Archive';
};

type Team = {
  id: string;
  event_id: string;
  team_name: string;
  captain_id?: string;
};

type Milestone = {
  id: string;
  event_id: string;
  milestone_minutes: number;
  milestone_name: string;
};

export default function AdminSetupScreen() {
  const { userProfile, loading } = useUser();
  const [events, setEvents] = useState<Event[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeSection, setActiveSection] = useState<'events' | 'teams' | 'users'>('events');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventStats, setEventStats] = useState<{[key: string]: {totalRegistrations: number, teamRegistrations: {[key: string]: number}}}>(
    {}
  );

  // Redirect non-admin users
  React.useEffect(() => {
    if (!loading && userProfile && !userProfile.is_admin) {
      router.replace('/(tabs)');
    }
  }, [userProfile, loading]);

  // Load events on initial render
  useEffect(() => {
    if (userProfile?.is_admin) {
      fetchEvents();
    }
  }, [userProfile]);

  // Fetch events from Supabase
  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching events:', error);
        Alert.alert('Error', 'Failed to load events');
        return;
      }
      
      setEvents(data || []);
      
      // Fetch registration stats for each event
      if (data) {
        for (const event of data) {
          fetchEventStats(event.id);
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch teams for a specific event
  const fetchTeamsForEvent = async (eventId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('event_id', eventId);
      
      if (error) {
        console.error('Error fetching teams:', error);
        Alert.alert('Error', 'Failed to load teams');
        return;
      }
      
      setTeams(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch event registration statistics
  const fetchEventStats = async (eventId: string) => {
    try {
      // Get total registrations for the event
      const { data: registrations, error: regError } = await supabase
        .from('event_registrations')
        .select('count')
        .eq('event_id', eventId);
      
      if (regError) {
        console.error('Error fetching registrations:', regError);
        return;
      }
      
      // Get team registrations
      const { data: teams, error: teamError } = await supabase
        .from('teams')
        .select('id, team_name')
        .eq('event_id', eventId);
      
      if (teamError) {
        console.error('Error fetching teams:', teamError);
        return;
      }
      
      const teamStats: {[key: string]: number} = {};
      
      if (teams) {
        for (const team of teams) {
          const { data: members, error: membersError } = await supabase
            .from('team_members')
            .select('count')
            .eq('team_id', team.id);
          
          if (membersError) {
            console.error(`Error fetching members for team ${team.id}:`, membersError);
          } else if (members) {
            teamStats[team.id] = members[0]?.count || 0;
          }
        }
      }
      
      setEventStats(prev => ({
        ...prev,
        [eventId]: {
          totalRegistrations: registrations ? registrations[0]?.count || 0 : 0,
          teamRegistrations: teamStats
        }
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Change event status
  const updateEventStatus = async (eventId: string, newStatus: 'Upcoming' | 'Active' | 'Archive') => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('events')
        .update({ status: newStatus })
        .eq('id', eventId);
      
      if (error) {
        console.error('Error updating event status:', error);
        Alert.alert('Error', 'Failed to update event status');
        return;
      }
      
      // Refresh events list
      await fetchEvents();
      Alert.alert('Success', `Event status updated to ${newStatus}`);
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Create new event
  const navigateToCreateEvent = () => {
    router.push('/admin/create-event' as any);
  };

  // Edit existing event
  const navigateToEditEvent = (eventId: string) => {
    router.push(`/admin/edit-event?id=${eventId}` as any);
  };

  // Create team for event
  const navigateToCreateTeam = (eventId: string) => {
    router.push(`/admin/create-team?eventId=${eventId}` as any);
  };

  // Manage event milestones
  const navigateToManageMilestones = (eventId: string) => {
    router.push(`/admin/manage-milestones?eventId=${eventId}` as any);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Select an event to show details
  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    fetchTeamsForEvent(event.id);
    setActiveSection('teams');
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
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
        <ThemedText type="title" style={styles.title}>Admin Setup</ThemedText>
        
        {/* Navigation tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, activeSection === 'events' && styles.activeTab]} 
            onPress={() => setActiveSection('events')}
          >
            <ThemedText>Events</ThemedText>
          </TouchableOpacity>
          
          {selectedEvent && (
            <TouchableOpacity 
              style={[styles.tab, activeSection === 'teams' && styles.activeTab]} 
              onPress={() => setActiveSection('teams')}
            >
              <ThemedText>Teams</ThemedText>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Events Section */}
        {activeSection === 'events' && (
          <ThemedView style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">Event Management</ThemedText>
              <TouchableOpacity 
                style={styles.createButton} 
                onPress={navigateToCreateEvent}
              >
                <ThemedText style={styles.createButtonText}>+ Create Event</ThemedText>
              </TouchableOpacity>
            </View>
            
            {/* Event List */}
            {events.length > 0 ? (
              <FlatList
                data={events}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <ThemedView style={styles.eventCard}>
                    <TouchableOpacity onPress={() => handleSelectEvent(item)}>
                      <ThemedText style={styles.eventTitle}>{item.name}</ThemedText>
                      <View style={styles.eventDetails}>
                        <ThemedText>Status: {item.status}</ThemedText>
                        <ThemedText>
                          {formatDate(item.start_date)} - {formatDate(item.end_date)}
                        </ThemedText>
                      </View>
                      
                      {eventStats[item.id] && (
                        <ThemedText style={styles.registrationStats}>
                          Registrations: {eventStats[item.id].totalRegistrations}
                        </ThemedText>
                      )}
                      
                      <View style={styles.actionButtons}>
                        <TouchableOpacity 
                          style={styles.actionButton} 
                          onPress={() => navigateToEditEvent(item.id)}
                        >
                          <ThemedText style={styles.actionButtonText}>Edit</ThemedText>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.actionButton} 
                          onPress={() => navigateToManageMilestones(item.id)}
                        >
                          <ThemedText style={styles.actionButtonText}>Milestones</ThemedText>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.actionButton} 
                          onPress={() => updateEventStatus(item.id, 'Upcoming')}
                        >
                          <ThemedText style={styles.actionButtonText}>Set Upcoming</ThemedText>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.actionButton} 
                          onPress={() => updateEventStatus(item.id, 'Active')}
                        >
                          <ThemedText style={styles.actionButtonText}>Set Active</ThemedText>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.actionButton} 
                          onPress={() => updateEventStatus(item.id, 'Archive')}
                        >
                          <ThemedText style={styles.actionButtonText}>Set Complete</ThemedText>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  </ThemedView>
                )}
                style={styles.list}
              />
            ) : (
              <ThemedText style={styles.emptyText}>No events found. Create one to get started.</ThemedText>
            )}
          </ThemedView>
        )}
        
        {/* Teams Section */}
        {activeSection === 'teams' && selectedEvent && (
          <ThemedView style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">Teams for {selectedEvent.name}</ThemedText>
              <TouchableOpacity 
                style={styles.createButton} 
                onPress={() => navigateToCreateTeam(selectedEvent.id)}
              >
                <ThemedText style={styles.createButtonText}>+ Add Team</ThemedText>
              </TouchableOpacity>
            </View>
            
            {/* Team List */}
            {teams.length > 0 ? (
              <FlatList
                data={teams}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <ThemedView style={styles.teamCard}>
                    <ThemedText style={styles.teamTitle}>{item.team_name}</ThemedText>
                    
                    {eventStats[selectedEvent.id]?.teamRegistrations[item.id] !== undefined && (
                      <ThemedText style={styles.registrationStats}>
                        Members: {eventStats[selectedEvent.id].teamRegistrations[item.id]}
                      </ThemedText>
                    )}
                    
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.actionButton} 
                        onPress={() => router.push(`/admin/edit-team?id=${item.id}` as any)}
                      >
                        <ThemedText style={styles.actionButtonText}>Edit</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </ThemedView>
                )}
                style={styles.list}
              />
            ) : (
              <ThemedText style={styles.emptyText}>No teams found for this event. Add a team to get started.</ThemedText>
            )}
          </ThemedView>
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
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  activeTab: {
    backgroundColor: '#0a7ea4',
  },
  createButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  createButtonText: {
    color: 'white',
  },
  list: {
    width: '100%',
  },
  eventCard: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 12,
  },
  teamCard: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  teamTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  registrationStats: {
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
  },
}); 