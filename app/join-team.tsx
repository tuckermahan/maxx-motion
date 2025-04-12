import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Button, ActivityIndicator, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getAvailableTeams, addUserToTeam, getTeamsForEvent, inspectTableStructure } from '@/lib/services/auth';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

type Team = {
  id: string;
  team_name: string;
  created_at: string;
}

export default function JoinTeamScreen() {
  const params = useLocalSearchParams();
  const eventId = params.eventId as string;
  const eventName = params.eventName as string;
  
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  // Fetch user session and teams for the selected event
  useEffect(() => {
    const checkAuthAndLoadTeams = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error || !data.session) {
          // Not authenticated, redirect to login
          console.log('Join Team: Not authenticated, redirecting to login');
          router.replace('/login');
          return;
        }
        
        // Get the user ID for checking event registration
        const userId = data.session.user.id;
        
        console.log('Loading teams for user:', userId);
        
        // Debug: Check table structures to understand relationships
        console.log('Inspecting teams table structure...');
        await inspectTableStructure('teams');
        await inspectTableStructure('event_registrations');
        
        // If no event ID is provided, check if the user is registered for any event
        if (!eventId) {
          console.log('No event ID provided, checking user registrations');
          
          const { data: userRegistrations, error: regError } = await supabase
            .from('event_registrations')
            .select('event_id')
            .eq('user_id', userId);
            
          if (regError) {
            console.error('Error checking user registrations:', regError);
          } else if (userRegistrations && userRegistrations.length > 0) {
            // User is registered for at least one event, use the most recent one
            const latestEventId = userRegistrations[0].event_id;
            console.log(`User is registered for event: ${latestEventId}`);
            
            // Get teams for this event
            const teamsData = await getTeamsForEvent(latestEventId);
            console.log(`Got ${teamsData.length} teams for event ${latestEventId}`);
            
            setTeams(teamsData);
            setLoading(false);
            return;
          } else {
            console.log('User is not registered for any event');
            Alert.alert(
              'No Event Selected', 
              'You need to join an event before selecting a team.',
              [{ text: 'OK', onPress: () => router.replace('/join-event' as any) }]
            );
            return;
          }
        }
        
        // If we have an event ID, verify user is registered for this event
        if (eventId) {
          const { data: registration, error: regError } = await supabase
            .from('event_registrations')
            .select('id')
            .eq('user_id', userId)
            .eq('event_id', eventId)
            .single();
            
          if (regError && regError.code !== 'PGRST116') {
            console.error('Error checking event registration:', regError);
          }
          
          if (!registration) {
            console.warn('User not registered for this event, redirecting to event selection');
            Alert.alert(
              'Registration Required', 
              'You need to register for an event first.',
              [{ text: 'OK', onPress: () => router.replace('/join-event' as any) }]
            );
            return;
          }
          
          console.log('User is registered for event, fetching teams');
          
          // Get teams for this event
          const teamsData = await getTeamsForEvent(eventId);
          console.log(`Got ${teamsData.length} teams for event ${eventId}`);
          
          if (teamsData.length === 0) {
            Alert.alert('No Teams Available', 'There are no teams available for this event yet.');
          }
          
          setTeams(teamsData);
        } else {
          // Fallback to all teams if no event ID is provided
          const teamsData = await getAvailableTeams();
          console.log(`No event ID provided, showing all ${teamsData.length} teams`);
          setTeams(teamsData);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Join Team setup error:', err);
        setLoading(false);
      }
    };
    
    checkAuthAndLoadTeams();
  }, [eventId]);

  const joinTeamAndNavigate = async () => {
    if (!selectedTeamId) {
      Alert.alert('Selection Required', 'Please select a team to join.');
      return;
    }

    try {
      setJoining(true);
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        Alert.alert('Error', 'You need to be logged in to join a team.');
        return;
      }

      const userId = data.session.user.id;
      const userName = data.session.user.user_metadata?.full_name || 
                      data.session.user.user_metadata?.name || 
                      data.session.user.email?.split('@')[0] || 'User';
                      
      console.log('Attempting to add user:', userId, 'to team:', selectedTeamId);
      
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
        
        console.log('Created profile for user before team joining');
      }
      
      // Check if user is already a member of this team
      const { data: existingMember, error: checkError } = await supabase
        .from('team_members')
        .select('id')
        .eq('user_id', userId)
        .eq('team_id', selectedTeamId)
        .single();
        
      if (existingMember) {
        console.log('User already a member of this team, proceeding to dashboard');
        router.replace('/(tabs)');
        return;
      }
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing team membership:', checkError);
      }
      
      // Add user to the team
      const { error: insertError } = await supabase
        .from('team_members')
        .insert({
          user_id: userId,
          team_id: selectedTeamId,
          joined_at: new Date().toISOString()
        });
        
      if (insertError) {
        console.error('Error adding user to team:', insertError);
        Alert.alert('Team Join Error', `Failed to join team: ${insertError.message}`);
        return;
      }
      
      console.log('Successfully joined team, navigating to dashboard');
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Error joining team:', err);
      Alert.alert('Error', 'An unexpected error occurred while joining the team.');
    } finally {
      setJoining(false);
    }
  };

  const renderTeamItem = ({ item }: { item: Team }) => {
    const isSelected = selectedTeamId === item.id;
    
    return (
      <TouchableOpacity 
        style={[styles.teamItem, isSelected && styles.selectedTeamItem]} 
        onPress={() => setSelectedTeamId(item.id)}
      >
        <ThemedText style={styles.teamName}>{item.team_name}</ThemedText>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={styles.loadingText}>Loading teams...</Text>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Join a Team</ThemedText>
      
      {eventName && (
        <ThemedText style={styles.eventName}>
          Event: {eventName}
        </ThemedText>
      )}
      
      <ThemedText style={styles.subtitle}>Select a team to join</ThemedText>
      
      {teams.length === 0 ? (
        <ThemedView style={styles.emptyStateContainer}>
          <ThemedText style={styles.noTeams}>
            {eventId
              ? `No teams are available for this event.`
              : `No teams are available at this time.`}
          </ThemedText>
          <View style={styles.backButtonContainer}>
            <Button
              title="Go Back to Events"
              onPress={() => router.replace('/join-event' as any)}
            />
          </View>
        </ThemedView>
      ) : (
        <FlatList
          data={teams}
          renderItem={renderTeamItem}
          keyExtractor={item => item.id}
          style={styles.teamList}
          contentContainerStyle={styles.teamListContent}
        />
      )}
      
      <View style={styles.buttonContainer}>
        {joining ? (
          <View style={styles.joiningContainer}>
            <ActivityIndicator size="small" color="#0a7ea4" />
            <Text style={styles.joiningText}>Joining team...</Text>
          </View>
        ) : (
          <Button 
            title="Join Team and Continue" 
            onPress={joinTeamAndNavigate}
            disabled={joining || !selectedTeamId} 
          />
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  eventName: {
    fontSize: 18,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  subtitle: {
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
  teamList: {
    width: '100%',
    marginVertical: 20,
  },
  teamListContent: {
    paddingBottom: 20,
  },
  teamItem: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedTeamItem: {
    backgroundColor: '#e0f0ff',
    borderColor: '#0a7ea4',
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  noTeams: {
    marginTop: 30,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: 20,
    width: '100%',
  },
  joiningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  joiningText: {
    marginLeft: 10,
    color: '#0a7ea4',
    fontSize: 16,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backButtonContainer: {
    marginTop: 20,
  },
}); 