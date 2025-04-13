import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform, FlatList } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useUser } from '../../contexts/UserContext';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

type Milestone = {
  id: string;
  event_id: string;
  milestone_minutes: number;
  milestone_name: string;
};

type Team = {
  id: string;
  event_id: string;
  team_name: string;
  captain_id?: string;
  captain_name?: string;
  captain_email?: string;
};

type User = {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
};

export default function EditEventScreen() {
  const params = useLocalSearchParams();
  const eventId = params.id as string;
  const { userProfile, loading: userLoading } = useUser();
  
  const [isLoading, setIsLoading] = useState(false);
  const [eventName, setEventName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [eventYear, setEventYear] = useState(new Date().getFullYear().toString());
  const [status, setStatus] = useState<'Upcoming' | 'Active' | 'Archive'>('Upcoming');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [captainSearchQuery, setCaptainSearchQuery] = useState('');
  const [captainSearchResults, setCaptainSearchResults] = useState<User[]>([]);
  const [showCaptainSearch, setShowCaptainSearch] = useState(false);
  
  const isWeb = Platform.OS === 'web';

  // Redirect non-admin users
  useEffect(() => {
    if (!userLoading && userProfile && !userProfile.is_admin) {
      router.replace('/(tabs)');
    }
  }, [userProfile, userLoading]);

  // Fetch event details
  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
      fetchEventMilestones();
    } else {
      Alert.alert('Error', 'No event ID provided');
      router.back();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (error) {
        console.error('Error fetching event details:', error);
        Alert.alert('Error', 'Failed to load event details');
        return;
      }
      
      if (data) {
        setEventName(data.name);
        setStartDate(new Date(data.start_date));
        setEndDate(new Date(data.end_date));
        setEventYear(data.event_year?.toString() || new Date().getFullYear().toString());
        setStatus(data.status);
      }

      // After fetching event details, fetch teams
      await fetchTeams();
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEventMilestones = async () => {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('event_id', eventId)
        .order('milestone_minutes', { ascending: true });
      
      if (error) {
        console.error('Error fetching milestones:', error);
        Alert.alert('Error', 'Failed to load milestones');
        return;
      }
      
      setMilestones(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const fetchTeams = async () => {
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('event_id', eventId)
        .order('team_name');
      
      if (teamsError) {
        console.error('Error fetching teams:', teamsError);
        return;
      }
      
      // Fetch captain details for each team
      const enhancedTeams = [];
      for (const team of teamsData || []) {
        if (team.captain_id) {
          const { data: captainData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', team.captain_id)
            .single();
          
          if (captainData) {
            enhancedTeams.push({
              ...team,
              captain_name: captainData.full_name,
              captain_email: captainData.email
            });
          } else {
            enhancedTeams.push(team);
          }
        } else {
          enhancedTeams.push(team);
        }
      }
      
      setTeams(enhancedTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  // Web-specific date input handlers
  const handleWebStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setStartDate(newDate);
      
      // If end date is before the new start date, update end date too
      if (endDate < newDate) {
        const newEndDate = new Date(newDate);
        newEndDate.setDate(newDate.getDate() + 30); // Default to 30 days after start
        setEndDate(newEndDate);
      }
    }
  };

  const handleWebEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setEndDate(newDate);
    }
  };

  const formatDateForInput = (date: Date) => {
    // Adjust for timezone to prevent off-by-one errors
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return localDate.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  };

  const handleAddMilestone = () => {
    // Create a temporary ID (will be replaced by DB upon save)
    const tempId = `temp-${Date.now()}`;
    
    // Calculate a reasonable milestone minute value based on existing ones
    let newMinutes = 500;
    if (milestones.length > 0) {
      newMinutes = Math.max(...milestones.map(m => m.milestone_minutes)) + 500;
    }
    
    const newMilestone: Milestone = {
      id: tempId,
      event_id: eventId,
      milestone_minutes: newMinutes,
      milestone_name: 'New Milestone'
    };
    
    setMilestones([...milestones, newMilestone]);
  };

  const handleUpdateMilestone = (id: string, field: 'milestone_minutes' | 'milestone_name', value: string) => {
    setMilestones(milestones.map(milestone => 
      milestone.id === id 
        ? { 
            ...milestone, 
            [field]: field === 'milestone_minutes' ? parseInt(value) || 0 : value 
          } 
        : milestone
    ));
  };

  const handleRemoveMilestone = (id: string) => {
    Alert.alert(
      'Remove Milestone',
      'Are you sure you want to remove this milestone?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            if (id.startsWith('temp-')) {
              // It's a new milestone that hasn't been saved, just remove from state
              setMilestones(milestones.filter(m => m.id !== id));
            } else {
              // It's an existing milestone, need to delete from DB
              deleteMilestone(id);
            }
          }
        }
      ]
    );
  };

  const deleteMilestone = async (id: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting milestone:', error);
        Alert.alert('Error', 'Failed to delete milestone');
        return;
      }
      
      setMilestones(milestones.filter(m => m.id !== id));
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    if (!eventName.trim()) {
      Alert.alert('Error', 'Please enter an event name');
      return false;
    }

    if (startDate >= endDate) {
      Alert.alert('Error', 'End date must be after start date');
      return false;
    }
    
    if (!eventYear || isNaN(parseInt(eventYear))) {
      Alert.alert('Error', 'Please enter a valid event year');
      return false;
    }

    return true;
  };

  const handleSaveEvent = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      // Update the event
      const { error: eventError } = await supabase
        .from('events')
        .update({
          name: eventName,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: status,
          event_year: parseInt(eventYear)
        })
        .eq('id', eventId);

      if (eventError) {
        console.error('Error updating event:', eventError);
        Alert.alert('Error', 'Failed to update event');
        return;
      }

      // Handle new milestones (with temp IDs)
      const newMilestones = milestones.filter(m => m.id.startsWith('temp-'));
      if (newMilestones.length > 0) {
        const { error: newMilestonesError } = await supabase
          .from('milestones')
          .insert(newMilestones.map(m => ({
            event_id: m.event_id,
            milestone_minutes: m.milestone_minutes,
            milestone_name: m.milestone_name
          })));

        if (newMilestonesError) {
          console.error('Error adding new milestones:', newMilestonesError);
          Alert.alert('Warning', 'Event was updated but some milestones could not be added');
        }
      }

      // Update existing milestones
      const existingMilestones = milestones.filter(m => !m.id.startsWith('temp-'));
      for (const milestone of existingMilestones) {
        const { error: updateError } = await supabase
          .from('milestones')
          .update({
            milestone_minutes: milestone.milestone_minutes,
            milestone_name: milestone.milestone_name
          })
          .eq('id', milestone.id);
        
        if (updateError) {
          console.error(`Error updating milestone ${milestone.id}:`, updateError);
        }
      }

      // Show success message
      Alert.alert('Success', 'Event updated successfully');
      
      // Perform direct navigation without depending on Alert's onPress
      console.log('Navigating to admin setup after event update');
      // Use a small timeout to ensure Alert is visible before navigation
      setTimeout(() => {
        router.replace('/admin/setup' as any);
      }, 500);
      
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const searchCaptains = async () => {
    if (!captainSearchQuery.trim()) {
      Alert.alert('Error', 'Please enter a search term');
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .or(`full_name.ilike.%${captainSearchQuery}%,email.ilike.%${captainSearchQuery}%`)
        .limit(10);
      
      if (error) {
        console.error('Error searching captains:', error);
        Alert.alert('Error', 'Failed to search users');
        return;
      }
      
      setCaptainSearchResults(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTeam = async () => {
    if (!newTeamName.trim()) {
      Alert.alert('Error', 'Please enter a team name');
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('teams')
        .insert({
          event_id: eventId,
          team_name: newTeamName,
        })
        .select();
      
      if (error) {
        console.error('Error adding team:', error);
        Alert.alert('Error', 'Failed to add team');
        return;
      }
      
      // Reset form and fetch teams
      setNewTeamName('');
      setIsAddingTeam(false);
      await fetchTeams();
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTeamName = async (teamId: string, newName: string) => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Team name cannot be empty');
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('teams')
        .update({ team_name: newName })
        .eq('id', teamId);
      
      if (error) {
        console.error('Error updating team:', error);
        Alert.alert('Error', 'Failed to update team');
        return;
      }
      
      setEditingTeamId(null);
      await fetchTeams();
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetTeamCaptain = async (teamId: string, captainId: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('teams')
        .update({ captain_id: captainId })
        .eq('id', teamId);
      
      if (error) {
        console.error('Error setting team captain:', error);
        Alert.alert('Error', 'Failed to set team captain');
        return;
      }
      
      setShowCaptainSearch(false);
      await fetchTeams();
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTeam = async (teamId: string) => {
    Alert.alert(
      'Remove Team',
      'Are you sure you want to remove this team?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const { error } = await supabase
                .from('teams')
                .delete()
                .eq('id', teamId);
              
              if (error) {
                console.error('Error removing team:', error);
                Alert.alert('Error', 'Failed to remove team');
                return;
              }
              
              await fetchTeams();
            } catch (error) {
              console.error('Unexpected error:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  if (userLoading || isLoading) {
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
        <ThemedText type="title" style={styles.title}>Edit Event</ThemedText>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.label}>Event Name</ThemedText>
          <TextInput
            style={styles.input}
            value={eventName}
            onChangeText={setEventName}
            placeholder="Enter event name"
          />
        </ThemedView>
        
        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.label}>Event Year</ThemedText>
          <TextInput
            style={styles.input}
            value={eventYear}
            onChangeText={setEventYear}
            placeholder="Enter event year"
            keyboardType="numeric"
          />
        </ThemedView>
        
        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.label}>Status</ThemedText>
          <View style={styles.statusContainer}>
            <TouchableOpacity 
              style={[
                styles.statusOption, 
                status === 'Upcoming' && styles.statusOptionActive
              ]}
              onPress={() => setStatus('Upcoming')}
            >
              <ThemedText style={status === 'Upcoming' ? styles.statusTextActive : styles.statusText}>
                Upcoming
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.statusOption, 
                status === 'Active' && styles.statusOptionActive
              ]}
              onPress={() => setStatus('Active')}
            >
              <ThemedText style={status === 'Active' ? styles.statusTextActive : styles.statusText}>
                Active
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.statusOption, 
                status === 'Archive' && styles.statusOptionActive
              ]}
              onPress={() => setStatus('Archive')}
            >
              <ThemedText style={status === 'Archive' ? styles.statusTextActive : styles.statusText}>
                Complete
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.label}>Start Date</ThemedText>
          {isWeb ? (
            <View style={styles.webDateContainer}>
              <input
                type="date"
                value={formatDateForInput(startDate)}
                onChange={handleWebStartDateChange}
                style={{
                  width: '100%',
                  fontSize: 16,
                  padding: 2,
                  border: 'none'
                }}
              />
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => Alert.alert('Use Native Date Picker', 'This feature is only available in native apps')}
            >
              <ThemedText>{formatDate(startDate)}</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.label}>End Date</ThemedText>
          {isWeb ? (
            <View style={styles.webDateContainer}>
              <input
                type="date"
                value={formatDateForInput(endDate)}
                onChange={handleWebEndDateChange}
                min={formatDateForInput(startDate)}
                style={{
                  width: '100%',
                  fontSize: 16,
                  padding: 2,
                  border: 'none'
                }}
              />
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => Alert.alert('Use Native Date Picker', 'This feature is only available in native apps')}
            >
              <ThemedText>{formatDate(endDate)}</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.label}>Milestones</ThemedText>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddMilestone}
            >
              <ThemedText style={styles.addButtonText}>+ Add Milestone</ThemedText>
            </TouchableOpacity>
          </View>
          
          {milestones.map((milestone) => (
            <View key={milestone.id} style={styles.milestoneRow}>
              <View style={styles.milestoneInputGroup}>
                <TextInput
                  style={[styles.input, styles.milestoneInput]}
                  value={milestone.milestone_minutes.toString()}
                  onChangeText={(value) => handleUpdateMilestone(milestone.id, 'milestone_minutes', value)}
                  keyboardType="numeric"
                  placeholder="Minutes"
                />
                <TextInput
                  style={[styles.input, styles.milestoneNameInput]}
                  value={milestone.milestone_name}
                  onChangeText={(value) => handleUpdateMilestone(milestone.id, 'milestone_name', value)}
                  placeholder="Name"
                />
              </View>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => handleRemoveMilestone(milestone.id)}
              >
                <ThemedText style={styles.removeButtonText}>×</ThemedText>
              </TouchableOpacity>
            </View>
          ))}
          
          {milestones.length === 0 && (
            <ThemedText style={styles.emptyText}>No milestones found. Add one to get started.</ThemedText>
          )}
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.label}>Teams</ThemedText>
            {!isAddingTeam && (
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setIsAddingTeam(true)}
              >
                <ThemedText style={styles.addButtonText}>+ Add Team</ThemedText>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Add team form */}
          {isAddingTeam && (
            <View style={styles.addTeamForm}>
              <TextInput
                style={styles.input}
                placeholder="Enter team name"
                value={newTeamName}
                onChangeText={setNewTeamName}
              />
              <View style={styles.teamActionButtons}>
                <TouchableOpacity 
                  style={styles.cancelActionButton}
                  onPress={() => {
                    setIsAddingTeam(false);
                    setNewTeamName('');
                  }}
                >
                  <ThemedText>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.addActionButton}
                  onPress={handleAddTeam}
                >
                  <ThemedText style={{color: 'white'}}>Add Team</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* Teams list */}
          {teams.length > 0 ? (
            <View style={styles.teamsList}>
              {teams.map(team => (
                <View key={team.id} style={styles.teamItem}>
                  {/* Team name (editable) */}
                  {editingTeamId === team.id ? (
                    <View style={styles.editTeamNameContainer}>
                      <TextInput
                        style={styles.input}
                        value={team.team_name}
                        onChangeText={(text) => {
                          setTeams(teams.map(t => 
                            t.id === team.id ? {...t, team_name: text} : t
                          ));
                        }}
                      />
                      <View style={styles.teamActionButtons}>
                        <TouchableOpacity 
                          style={styles.cancelActionButton}
                          onPress={() => setEditingTeamId(null)}
                        >
                          <ThemedText>Cancel</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.addActionButton}
                          onPress={() => handleUpdateTeamName(team.id, team.team_name)}
                        >
                          <ThemedText style={{color: 'white'}}>Save</ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.teamNameRow}>
                      <ThemedText style={styles.teamName}>{team.team_name}</ThemedText>
                      <TouchableOpacity 
                        onPress={() => setEditingTeamId(team.id)}
                        style={styles.editButton}
                      >
                        <ThemedText style={styles.editText}>Edit</ThemedText>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {/* Team captain */}
                  <View style={styles.teamCaptainSection}>
                    <ThemedText style={styles.teamSectionTitle}>Captain:</ThemedText>
                    {team.captain_name ? (
                      <View style={styles.captainInfo}>
                        <ThemedText>{team.captain_name}</ThemedText>
                        <ThemedText style={styles.captainEmail}>{team.captain_email}</ThemedText>
                        <TouchableOpacity 
                          onPress={() => {
                            setShowCaptainSearch(true);
                            setEditingTeamId(team.id);
                          }}
                          style={styles.changeCaptainButton}
                        >
                          <ThemedText style={styles.editText}>Change</ThemedText>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        onPress={() => {
                          setShowCaptainSearch(true);
                          setEditingTeamId(team.id);
                        }}
                        style={styles.addCaptainButton}
                      >
                        <ThemedText style={styles.editText}>Assign Captain</ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {/* Captain search UI */}
                  {showCaptainSearch && editingTeamId === team.id && (
                    <View style={styles.captainSearchContainer}>
                      <View style={styles.searchRow}>
                        <TextInput
                          style={[styles.input, {flex: 1}]}
                          placeholder="Search by name or email"
                          value={captainSearchQuery}
                          onChangeText={setCaptainSearchQuery}
                        />
                        <TouchableOpacity 
                          style={styles.searchButton}
                          onPress={searchCaptains}
                        >
                          <ThemedText style={{color: 'white'}}>Search</ThemedText>
                        </TouchableOpacity>
                      </View>
                      
                      {captainSearchResults.length > 0 && (
                        <FlatList
                          data={captainSearchResults}
                          keyExtractor={item => item.id}
                          renderItem={({ item }) => (
                            <TouchableOpacity 
                              style={styles.searchResultItem}
                              onPress={() => handleSetTeamCaptain(team.id, item.id)}
                            >
                              <ThemedText style={styles.resultName}>{item.full_name}</ThemedText>
                              <ThemedText style={styles.resultEmail}>{item.email}</ThemedText>
                            </TouchableOpacity>
                          )}
                          style={styles.searchResultsList}
                        />
                      )}
                      
                      <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={() => {
                          setShowCaptainSearch(false);
                          setCaptainSearchQuery('');
                          setCaptainSearchResults([]);
                        }}
                      >
                        <ThemedText>Cancel Search</ThemedText>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {/* Team actions */}
                  <View style={styles.teamActions}>
                    <TouchableOpacity 
                      style={styles.removeTeamButton}
                      onPress={() => handleRemoveTeam(team.id)}
                    >
                      <ThemedText style={styles.removeText}>Remove Team</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.manageTeamButton}
                      onPress={() => router.push(`/admin/edit-team?id=${team.id}` as any)}
                    >
                      <ThemedText style={styles.manageText}>Advanced Edit</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <ThemedText style={styles.emptyText}>No teams found. Add a team to get started.</ThemedText>
          )}
        </ThemedView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isLoading}
          >
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSaveEvent}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <ThemedText style={styles.submitButtonText}>Save Changes</ThemedText>
            )}
          </TouchableOpacity>
        </View>
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
  formGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
  },
  webDateContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusOption: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
  },
  statusOptionActive: {
    backgroundColor: '#0a7ea4',
  },
  statusText: {
    fontSize: 14,
  },
  statusTextActive: {
    fontSize: 14,
    color: 'white',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  milestoneInputGroup: {
    flex: 1,
    flexDirection: 'row',
  },
  milestoneInput: {
    flex: 1,
    marginRight: 10,
  },
  milestoneNameInput: {
    flex: 2,
  },
  removeButton: {
    padding: 8,
    marginLeft: 10,
  },
  removeButtonText: {
    fontSize: 24,
    color: 'red',
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
  },
  submitButton: {
    flex: 2,
    padding: 12,
    backgroundColor: '#0a7ea4',
    borderRadius: 4,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
  },
  addTeamForm: {
    marginTop: 12,
    marginBottom: 16,
  },
  teamActionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelActionButton: {
    padding: 8,
    borderRadius: 4,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  addActionButton: {
    backgroundColor: '#0a7ea4',
    padding: 8,
    borderRadius: 4,
  },
  teamsList: {
    marginTop: 12,
  },
  teamItem: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  teamNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButton: {
    padding: 4,
  },
  editText: {
    color: '#0a7ea4',
  },
  teamCaptainSection: {
    marginTop: 8,
    marginBottom: 12,
  },
  teamSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  captainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  captainEmail: {
    color: '#666',
    marginLeft: 8,
  },
  changeCaptainButton: {
    marginLeft: 8,
  },
  addCaptainButton: {
    padding: 4,
    alignSelf: 'flex-start',
  },
  captainSearchContainer: {
    marginTop: 8,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchButton: {
    backgroundColor: '#0a7ea4',
    padding: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  searchResultsList: {
    maxHeight: 200,
    marginBottom: 8,
  },
  searchResultItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultName: {
    fontWeight: 'bold',
  },
  resultEmail: {
    color: '#666',
    fontSize: 12,
  },
  editTeamNameContainer: {
    marginBottom: 12,
  },
  teamActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  removeTeamButton: {
    padding: 8,
  },
  removeText: {
    color: 'red',
  },
  manageTeamButton: {
    padding: 8,
  },
  manageText: {
    color: '#0a7ea4',
  },
}); 