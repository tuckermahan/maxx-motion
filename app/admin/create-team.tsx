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

type CreateCaptainForm = {
  full_name: string;
  email: string;
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
  const [showCreateCaptain, setShowCreateCaptain] = useState(false);
  const [newCaptain, setNewCaptain] = useState<CreateCaptainForm>({
    full_name: '',
    email: '',
  });
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
    setShowCreateCaptain(false);
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

  const validateNewCaptain = () => {
    if (!newCaptain.full_name.trim()) {
      Alert.alert('Error', 'Please enter captain name');
      return false;
    }

    if (!newCaptain.email.trim() || !validateEmail(newCaptain.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const createCaptainProfile = async (): Promise<User | null> => {
    if (!validateNewCaptain()) return null;

    try {
      setIsLoading(true);

      // Check if user with this email already exists
      const { data: existingUser, error: existingUserError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('email', newCaptain.email)
        .maybeSingle();

      if (existingUserError && existingUserError.code !== 'PGRST116') {
        console.error('Error checking for existing user:', existingUserError);
        Alert.alert('Error', 'Failed to check if user already exists');
        return null;
      }

      // If user exists, return that user
      if (existingUser) {
        Alert.alert('Notice', 'A user with this email already exists. Using existing user as team captain.');
        return existingUser as User;
      }

      // Create the auth user first (would normally happen through sign-up)
      // For admin purposes, we'll create a placeholder auth user
      // In a full implementation, you might send an invitation email instead
      
      // Instead, let's create just a profile entry since we're adding this manually
      const userId = crypto.randomUUID(); // Generate a random UUID for the profile
      
      const { data: newUser, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: newCaptain.full_name,
          email: newCaptain.email,
          created_at: new Date().toISOString(),
          is_admin: false
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating new captain profile:', createError);
        Alert.alert('Error', 'Failed to create new captain profile');
        return null;
      }

      Alert.alert('Success', 'New captain profile created');
      return newUser as User;
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      // If trying to create a new captain, do that first
      let captainToUse = selectedCaptain;
      
      if (showCreateCaptain && !selectedCaptain) {
        const newCaptainUser = await createCaptainProfile();
        if (newCaptainUser) {
          captainToUse = newCaptainUser;
        } else {
          // If captain creation failed, exit
          setIsLoading(false);
          return;
        }
      }

      // Create the team
      const teamData = {
        event_id: eventId,
        team_name: teamName,
        captain_id: captainToUse?.id
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

      // Show success message
      Alert.alert('Success', 'Team created successfully');
      
      // Navigate back to setup
      console.log('Navigating to admin setup after team creation');
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
          
          {/* Selected captain display */}
          {selectedCaptain && (
            <View style={styles.selectedUserContainer}>
              <ThemedText style={styles.selectedUserName}>
                {selectedCaptain.full_name} ({selectedCaptain.email})
              </ThemedText>
              <TouchableOpacity onPress={() => setSelectedCaptain(null)}>
                <ThemedText style={styles.removeText}>Remove</ThemedText>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Captain options when no captain is selected */}
          {!selectedCaptain && !showUserSearch && !showCreateCaptain && (
            <View style={styles.captainOptions}>
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={() => {
                  setShowUserSearch(true);
                  setShowCreateCaptain(false);
                }}
              >
                <ThemedText style={styles.optionButtonText}>Select Existing User</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={() => {
                  setShowCreateCaptain(true);
                  setShowUserSearch(false);
                }}
              >
                <ThemedText style={styles.optionButtonText}>Create New Captain</ThemedText>
              </TouchableOpacity>
            </View>
          )}
          
          {/* User search interface */}
          {showUserSearch && (
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
          
          {/* Create new captain form */}
          {showCreateCaptain && (
            <View style={styles.createCaptainContainer}>
              <ThemedText style={styles.sectionTitle}>Create New Captain</ThemedText>
              
              <ThemedText style={styles.inputLabel}>Full Name</ThemedText>
              <TextInput
                style={styles.input}
                value={newCaptain.full_name}
                onChangeText={(text) => setNewCaptain({...newCaptain, full_name: text})}
                placeholder="Enter captain's full name"
              />
              
              <ThemedText style={[styles.inputLabel, {marginTop: 12}]}>Email</ThemedText>
              <TextInput
                style={styles.input}
                value={newCaptain.email}
                onChangeText={(text) => setNewCaptain({...newCaptain, email: text})}
                placeholder="Enter captain's email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <View style={styles.createCaptainActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowCreateCaptain(false)}
                >
                  <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.applyButton}
                  onPress={async () => {
                    const newUser = await createCaptainProfile();
                    if (newUser) {
                      handleSelectCaptain(newUser);
                    }
                  }}
                >
                  <ThemedText style={styles.applyButtonText}>Create & Select</ThemedText>
                </TouchableOpacity>
              </View>
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
  createCaptainContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  createCaptainActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#0a7ea4',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginLeft: 8,
  },
  applyButtonText: {
    color: 'white',
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