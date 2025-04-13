import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform, FlatList } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useUser } from '../../contexts/UserContext';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';

type Milestone = {
  id: string;
  minutes: number;
  name: string;
};

type Team = {
  id: string; // This will be temporary for new teams
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

export default function CreateEventScreen() {
  const { userProfile, loading: userLoading } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [eventName, setEventName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)));
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [eventYear, setEventYear] = useState(new Date().getFullYear().toString());
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: '1', minutes: 500, name: 'Bronze' },
    { id: '2', minutes: 1000, name: 'Silver' },
    { id: '3', minutes: 1500, name: 'Gold' }
  ]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [captainSearchQuery, setCaptainSearchQuery] = useState('');
  const [captainSearchResults, setCaptainSearchResults] = useState<User[]>([]);
  const [showCaptainSearch, setShowCaptainSearch] = useState(false);
  
  const isWeb = Platform.OS === 'web';

  // Redirect non-admin users
  React.useEffect(() => {
    if (!userLoading && userProfile && !userProfile.is_admin) {
      router.replace('/(tabs)');
    }
  }, [userProfile, userLoading]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      
      // If end date is before the new start date, update end date too
      if (endDate < selectedDate) {
        const newEndDate = new Date(selectedDate);
        newEndDate.setDate(selectedDate.getDate() + 30); // Default to 30 days after start
        setEndDate(newEndDate);
      }
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
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
    const newId = (milestones.length + 1).toString();
    const newMinutes = milestones.length > 0 
      ? milestones[milestones.length - 1].minutes + 500 
      : 500;
      
    setMilestones([
      ...milestones, 
      { 
        id: newId, 
        minutes: newMinutes, 
        name: `Milestone ${newId}` 
      }
    ]);
  };

  const handleUpdateMilestone = (id: string, field: 'minutes' | 'name', value: string) => {
    setMilestones(milestones.map(milestone => 
      milestone.id === id 
        ? { 
            ...milestone, 
            [field]: field === 'minutes' ? parseInt(value) || 0 : value 
          } 
        : milestone
    ));
  };

  const handleRemoveMilestone = (id: string) => {
    setMilestones(milestones.filter(milestone => milestone.id !== id));
  };

  const generateTempId = () => `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

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

  const handleAddTeam = () => {
    if (!newTeamName.trim()) {
      Alert.alert('Error', 'Please enter a team name');
      return;
    }

    const newTeam: Team = {
      id: generateTempId(),
      team_name: newTeamName,
    };

    setTeams([...teams, newTeam]);
    setNewTeamName('');
    setIsAddingTeam(false);
  };

  const handleUpdateTeamName = (teamId: string, newName: string) => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Team name cannot be empty');
      return;
    }

    setTeams(teams.map(team => 
      team.id === teamId ? { ...team, team_name: newName } : team
    ));
    setEditingTeamId(null);
  };

  const handleSetTeamCaptain = (teamId: string, captain: User) => {
    setTeams(teams.map(team => 
      team.id === teamId 
        ? { 
            ...team, 
            captain_id: captain.id,
            captain_name: captain.full_name,
            captain_email: captain.email
          } 
        : team
    ));
    setShowCaptainSearch(false);
    setCaptainSearchQuery('');
    setCaptainSearchResults([]);
  };

  const handleRemoveTeam = (teamId: string) => {
    setTeams(teams.filter(team => team.id !== teamId));
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

    if (milestones.length === 0) {
      Alert.alert('Error', 'Please add at least one milestone');
      return false;
    }

    return true;
  };

  const handleCreateEvent = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      // Create the event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert({
          name: eventName,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: 'Upcoming',
          event_year: parseInt(eventYear)
        })
        .select();

      if (eventError) {
        console.error('Error creating event:', eventError);
        Alert.alert('Error', 'Failed to create event');
        return;
      }

      const eventId = eventData[0].id;

      // Create the milestones
      const milestonesData = milestones.map(milestone => ({
        event_id: eventId,
        milestone_minutes: milestone.minutes,
        milestone_name: milestone.name
      }));

      const { error: milestonesError } = await supabase
        .from('milestones')
        .insert(milestonesData);

      if (milestonesError) {
        console.error('Error creating milestones:', milestonesError);
        Alert.alert('Warning', 'Event was created but milestones could not be added');
      }

      // Create the teams
      if (teams.length > 0) {
        const teamsData = teams.map(team => ({
          event_id: eventId,
          team_name: team.team_name,
          captain_id: team.captain_id
        }));

        const { error: teamsError } = await supabase
          .from('teams')
          .insert(teamsData);

        if (teamsError) {
          console.error('Error creating teams:', teamsError);
          Alert.alert('Warning', 'Event was created but teams could not be added');
        }
      }

      // Show success message
      Alert.alert('Success', 'Event created successfully');
      
      // Perform direct navigation without depending on Alert's onPress
      console.log('Navigating to admin setup after event creation');
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

  if (userLoading) {
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
        <ThemedText type="title" style={styles.title}>Create Event</ThemedText>

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
            <>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <ThemedText>{formatDate(startDate)}</ThemedText>
              </TouchableOpacity>
              {showStartDatePicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  onChange={handleStartDateChange}
                />
              )}
            </>
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
            <>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <ThemedText>{formatDate(endDate)}</ThemedText>
              </TouchableOpacity>
              {showEndDatePicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="default"
                  onChange={handleEndDateChange}
                  minimumDate={startDate}
                />
              )}
            </>
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
          
          {milestones.map(milestone => (
            <View key={milestone.id} style={styles.milestoneRow}>
              <View style={styles.milestoneInputGroup}>
                <TextInput
                  style={[styles.input, styles.milestoneInput]}
                  value={milestone.minutes.toString()}
                  onChangeText={(value) => handleUpdateMilestone(milestone.id, 'minutes', value)}
                  keyboardType="numeric"
                  placeholder="Minutes"
                />
                <TextInput
                  style={[styles.input, styles.milestoneNameInput]}
                  value={milestone.name}
                  onChangeText={(value) => handleUpdateMilestone(milestone.id, 'name', value)}
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
          
          {teams.length > 0 ? (
            <View style={styles.teamsList}>
              {teams.map(team => (
                <View key={team.id} style={styles.teamItem}>
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
                              onPress={() => handleSetTeamCaptain(team.id, item)}
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
                  
                  <TouchableOpacity 
                    style={styles.removeTeamButton}
                    onPress={() => handleRemoveTeam(team.id)}
                  >
                    <ThemedText style={styles.removeText}>Remove Team</ThemedText>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <ThemedText style={styles.emptyText}>No teams added. Add a team to get started.</ThemedText>
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
            onPress={handleCreateEvent}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <ThemedText style={styles.submitButtonText}>Create Event</ThemedText>
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
  removeTeamButton: {
    padding: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  removeText: {
    color: 'red',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
}); 