import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, FlatList } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useUser } from '../../contexts/UserContext';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

type User = {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
};

export default function CreateTeamScreen() {
  const params = useLocalSearchParams();
  const eventId = params.eventId as string;
  const { userProfile, loading: userLoading } = useUser();
  
  const [isLoading, setIsLoading] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedCaptain, setSelectedCaptain] = useState<User | null>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [eventName, setEventName] = useState('');

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
        .select('name')
        .eq('id', eventId)
        .single();
      
      if (error) {
        console.error('Error fetching event details:', error);
        Alert.alert('Error', 'Failed to load event details');
        return;
      }
      
      setEventName(data.name);
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a search term');
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(10);
      
      if (error) {
        console.error('Error searching users:', error);
        Alert.alert('Error', 'Failed to search users');
        return;
      }
      
      setSearchResults(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCaptain = (user: User) => {
    setSelectedCaptain(user);
    setShowUserSearch(false);
  };

  const validateForm = () => {
    if (!teamName.trim()) {
      Alert.alert('Error', 'Please enter a team name');
      return false;
    }

    return true;
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleCreateTeam = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      // Create the team
      const teamData = {
        event_id: eventId,
        team_name: teamName,
        captain_id: selectedCaptain?.id
      };

      const { data: createdTeam, error } = await supabase
        .from('teams')
        .insert(teamData)
        .select();

      if (error) {
        console.error('Error creating team:', error);
        Alert.alert('Error', 'Failed to create team');
        return;
      }

      // If invited by email and no captain selected
      if (inviteEmail && !selectedCaptain && validateEmail(inviteEmail)) {
        // We'd send an invitation email here in a real-world scenario
        Alert.alert('Note', `Invitation will be sent to ${inviteEmail}`);
      }

      Alert.alert(
        'Success', 
        'Team created successfully', 
        [{ text: 'OK', onPress: () => router.push('/admin/setup' as any) }]
      );
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
        <ThemedText type="title" style={styles.title}>Create Team</ThemedText>
        
        {eventName && (
          <ThemedText style={styles.subtitle}>For event: {eventName}</ThemedText>
        )}

        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.label}>Team Name</ThemedText>
          <TextInput
            style={styles.input}
            value={teamName}
            onChangeText={setTeamName}
            placeholder="Enter team name"
          />
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.label}>Team Captain</ThemedText>
          
          {!showUserSearch ? (
            <>
              {selectedCaptain ? (
                <View style={styles.selectedUserContainer}>
                  <ThemedText style={styles.selectedUserName}>
                    {selectedCaptain.full_name} ({selectedCaptain.email})
                  </ThemedText>
                  <TouchableOpacity onPress={() => setSelectedCaptain(null)}>
                    <ThemedText style={styles.removeText}>Remove</ThemedText>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.captainOptions}>
                  <TouchableOpacity 
                    style={styles.optionButton}
                    onPress={() => setShowUserSearch(true)}
                  >
                    <ThemedText style={styles.optionButtonText}>Select Existing User</ThemedText>
                  </TouchableOpacity>
                  
                  <ThemedText style={styles.orText}>OR</ThemedText>
                  
                  <View style={styles.emailContainer}>
                    <ThemedText style={styles.emailLabel}>Invite by Email:</ThemedText>
                    <TextInput
                      style={[styles.input, styles.emailInput]}
                      value={inviteEmail}
                      onChangeText={setInviteEmail}
                      placeholder="captain@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              )}
            </>
          ) : (
            <View style={styles.searchContainer}>
              <View style={styles.searchRow}>
                <TextInput
                  style={[styles.input, styles.searchInput]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search by name or email"
                />
                <TouchableOpacity 
                  style={styles.searchButton}
                  onPress={searchUsers}
                >
                  <ThemedText style={styles.searchButtonText}>Search</ThemedText>
                </TouchableOpacity>
              </View>
              
              {searchResults.length > 0 && (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.userItem}
                      onPress={() => handleSelectCaptain(item)}
                    >
                      <ThemedText style={styles.userName}>{item.full_name}</ThemedText>
                      <ThemedText style={styles.userEmail}>{item.email}</ThemedText>
                    </TouchableOpacity>
                  )}
                  style={styles.userList}
                />
              )}
              
              <TouchableOpacity 
                style={styles.cancelSearchButton}
                onPress={() => setShowUserSearch(false)}
              >
                <ThemedText style={styles.cancelSearchText}>Cancel Search</ThemedText>
              </TouchableOpacity>
            </View>
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
            onPress={handleCreateTeam}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <ThemedText style={styles.submitButtonText}>Create Team</ThemedText>
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
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 24,
    fontStyle: 'italic',
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
  captainOptions: {
    marginTop: 8,
  },
  optionButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 12,
  },
  optionButtonText: {
    fontSize: 16,
  },
  orText: {
    textAlign: 'center',
    marginVertical: 12,
    fontSize: 16,
  },
  emailContainer: {
    marginTop: 8,
  },
  emailLabel: {
    marginBottom: 8,
  },
  emailInput: {
    marginTop: 4,
  },
  searchContainer: {
    marginTop: 8,
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  searchButtonText: {
    color: 'white',
  },
  cancelSearchButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelSearchText: {
    fontSize: 16,
  },
  userList: {
    maxHeight: 200,
    marginTop: 8,
  },
  userItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  selectedUserContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  selectedUserName: {
    fontSize: 16,
  },
  removeText: {
    color: 'red',
    fontSize: 14,
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
}); 