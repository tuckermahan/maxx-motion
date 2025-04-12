import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Button, ActivityIndicator, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getAvailableEvents, registerUserForEvent, updateTeamsWithEventIds } from '@/lib/services/auth';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

type Event = {
  id: string;
  name: string;
  event_year: string;
  start_date: string;
  end_date: string;
  created_at: string;
  status?: 'Active' | 'Upcoming' | 'Archive';
}

export default function JoinEventScreen() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Upcoming' | null>(null);

  // Fetch user session and events
  useEffect(() => {
    const checkAuthAndLoadEvents = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error || !data.session) {
          // Not authenticated, redirect to login
          console.log('Join Event: Not authenticated, redirecting to login');
          router.replace('/login');
          return;
        }
        
        // Fetch available events
        const eventsData = await getAvailableEvents(statusFilter || undefined);
        setEvents(eventsData);
        setLoading(false);
      } catch (err) {
        console.error('Join Event setup error:', err);
        setLoading(false);
      }
    };
    
    checkAuthAndLoadEvents();
  }, [statusFilter]);

  // Add a function to handle status filter changes
  const handleStatusFilter = (status: 'Active' | 'Upcoming' | null) => {
    setStatusFilter(status);
  };

  const navigateToJoinTeam = async () => {
    if (!selectedEventId) {
      Alert.alert('Selection Required', 'Please select an event to join.');
      return;
    }

    try {
      setRegistering(true);
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        Alert.alert('Error', 'You need to be logged in to join an event.');
        return;
      }

      const userId = data.session.user.id;
      const userName = data.session.user.user_metadata?.full_name || 
                      data.session.user.user_metadata?.name || 
                      data.session.user.email?.split('@')[0] || 'User';
      
      console.log('Attempting to register user:', userId, 'for event:', selectedEventId);
      
      // First, make sure the user has a profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
        
      if (!profileData && profileError) {
        console.log('Profile not found, creating one first');
        
        // Create a minimal profile based on the schema
        const { error: insertProfileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: userName,
            email: data.session.user.email,
            avatar_url: null
          });
          
        if (insertProfileError) {
          console.error('Failed to create profile:', insertProfileError);
          
          // Try with just the ID if adding name fails
          const { error: minimalError } = await supabase
            .from('profiles')
            .insert({ id: userId });
            
          if (minimalError) {
            console.error('Failed even with minimal profile:', minimalError);
            Alert.alert('Error', 'Unable to create user profile. Please try again later.');
            return;
          }
        }
        
        console.log('Created profile for user before event registration');
      }
      
      // Check if user is already registered for this event
      const { data: existingReg, error: checkError } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('user_id', userId)
        .eq('event_id', selectedEventId)
        .single();
        
      if (existingReg) {
        console.log('User already registered for this event, proceeding to team selection');
        router.replace('/join-team' as any);
        return;
      }
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing registration:', checkError);
      }
      
      // Register for the event
      const { error: insertError } = await supabase
        .from('event_registrations')
        .insert({
          user_id: userId,
          event_id: selectedEventId,
          registered_at: new Date().toISOString()
        });
        
      if (insertError) {
        console.error('Error registering for event:', insertError);
        Alert.alert('Registration Error', `Failed to register: ${insertError.message}`);
        return;
      }
      
      // Find event name from the events array
      const selectedEvent = events.find(event => event.id === selectedEventId);
      const eventName = selectedEvent?.name || 'Selected Event';
      
      console.log('Successfully registered for event, navigating to join-team');
      // Pass the event ID and name to the join-team page
      router.replace({
        pathname: '/join-team',
        params: { 
          eventId: selectedEventId,
          eventName: eventName
        }
      } as any);
    } catch (err) {
      console.error('Error joining event:', err);
      Alert.alert('Error', 'An unexpected error occurred during registration.');
    } finally {
      setRegistering(false);
    }
  };

  const renderEventItem = ({ item }: { item: Event }) => {
    const isSelected = selectedEventId === item.id;
    
    return (
      <TouchableOpacity 
        style={[styles.eventItem, isSelected && styles.selectedEventItem]} 
        onPress={() => setSelectedEventId(item.id)}
      >
        <ThemedText style={styles.eventTitle}>{item.name}</ThemedText>
        <View style={styles.eventDetailsRow}>
          <ThemedText style={styles.eventDetails}>{item.event_year}</ThemedText>
          {item.status && (
            <ThemedText style={[styles.eventStatus, 
              item.status === 'Active' && styles.activeStatus,
              item.status === 'Upcoming' && styles.upcomingStatus,
              item.status === 'Archive' && styles.archiveStatus
            ]}>
              {item.status}
            </ThemedText>
          )}
        </View>
        <ThemedText style={styles.eventDates}>
          {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Join an Event</ThemedText>
      <ThemedText style={styles.subtitle}>Select an event to join</ThemedText>
      
      {/* Status filter buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, statusFilter === null && styles.activeFilterButton]}
          onPress={() => handleStatusFilter(null)}
        >
          <Text style={[styles.filterButtonText, statusFilter === null && styles.activeFilterText]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, statusFilter === 'Active' && styles.activeFilterButton]}
          onPress={() => handleStatusFilter('Active')}
        >
          <Text style={[styles.filterButtonText, statusFilter === 'Active' && styles.activeFilterText]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, statusFilter === 'Upcoming' && styles.activeFilterButton]}
          onPress={() => handleStatusFilter('Upcoming')}
        >
          <Text style={[styles.filterButtonText, statusFilter === 'Upcoming' && styles.activeFilterText]}>
            Upcoming
          </Text>
        </TouchableOpacity>
      </View>
      
      {events.length === 0 ? (
        <ThemedText style={styles.noEvents}>No events available at this time.</ThemedText>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={item => item.id}
          style={styles.eventList}
          contentContainerStyle={styles.eventListContent}
        />
      )}
      
      <View style={styles.buttonContainer}>
        {registering ? (
          <View style={styles.registeringContainer}>
            <ActivityIndicator size="small" color="#0a7ea4" />
            <Text style={styles.registeringText}>Registering for event...</Text>
          </View>
        ) : (
          <Button 
            title="Next: Join a Team" 
            onPress={navigateToJoinTeam}
            disabled={registering || !selectedEventId} 
          />
        )}
      </View>

      {/* Dev tools - REMOVE IN PRODUCTION */}
      {__DEV__ && (
        <View style={styles.devTools}>
          <Text style={styles.devToolsTitle}>Developer Tools</Text>
          <TouchableOpacity
            style={styles.devButton}
            onPress={async () => {
              try {
                // Add useful developer actions here if needed
                const { data: teams } = await supabase.from('teams').select('*');
                const { data: events } = await supabase.from('events').select('*');
                console.log('All teams:', teams);
                console.log('All events:', events);
                Alert.alert('Debug Info', `Found ${teams?.length || 0} teams and ${events?.length || 0} events`);
              } catch (err) {
                console.error('Debug error:', err);
              }
            }}
          >
            <Text style={styles.devButtonText}>Show Database Info</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.devButton}
            onPress={async () => {
              try {
                setLoading(true);
                const result = await updateTeamsWithEventIds();
                if (result) {
                  Alert.alert('Success', 'Teams have been linked to events successfully!');
                } else {
                  Alert.alert('Error', 'Failed to link teams to events. Check console for details.');
                }
              } catch (err) {
                console.error('Error linking teams to events:', err);
                Alert.alert('Error', 'An unexpected error occurred.');
              } finally {
                setLoading(false);
              }
            }}
          >
            <Text style={styles.devButtonText}>Link Teams to Events</Text>
          </TouchableOpacity>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  subtitle: {
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
  },
  eventList: {
    width: '100%',
    marginVertical: 20,
  },
  eventListContent: {
    paddingBottom: 20,
  },
  eventItem: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedEventItem: {
    backgroundColor: '#e0f0ff',
    borderColor: '#0a7ea4',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  eventDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDetails: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  eventStatus: {
    fontSize: 12,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  activeStatus: {
    color: '#008000',
  },
  upcomingStatus: {
    color: '#0000FF',
  },
  archiveStatus: {
    color: '#808080',
  },
  eventDates: {
    fontSize: 12,
    color: '#555',
  },
  noEvents: {
    marginTop: 30,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: 20,
    width: '100%',
  },
  buttonSpacer: {
    height: 10,
  },
  registeringContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  registeringText: {
    marginLeft: 10,
    color: '#0a7ea4',
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 400,
  },
  filterButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 4,
    minWidth: 70,
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  devTools: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignSelf: 'stretch',
    marginHorizontal: 20,
  },
  devToolsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  devButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  devButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
}); 