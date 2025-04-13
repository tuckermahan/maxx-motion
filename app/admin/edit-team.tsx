import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform, FlatList } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useUser } from '../../contexts/UserContext';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

type TeamMember = {
  id: string;
  user_id: string;
  team_id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
};

type User = {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
};

export default function EditTeamScreen() {
  const params = useLocalSearchParams();
  const teamId = params.id as string;
  const { userProfile, loading: userLoading } = useUser();
  
  const [isLoading, setIsLoading] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [eventName, setEventName] = useState('');
  const [captain, setCaptain] = useState<User | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [isSearchingForCaptain, setIsSearchingForCaptain] = useState(false);

  // Redirect non-admin users
  useEffect(() => {
    if (!userLoading && userProfile && !userProfile.is_admin) {
      router.replace('/(tabs)');
    }
  }, [userProfile, userLoading]);

  // Fetch team details
  useEffect(() => {
    if (teamId) {
      fetchTeamDetails();
    } else {
      Alert.alert('Error', 'No team ID provided');
      router.back();
    }
  }, [teamId]);

  const fetchTeamDetails = async () => {
    try {
      setIsLoading(true);
      
      // Fetch team info
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*, events(name)')
        .eq('id', teamId)
        .single();
      
      if (teamError) {
        console.error('Error fetching team:', teamError);
        Alert.alert('Error', 'Failed to load team details');
        return;
      }
      
      if (teamData) {
        setTeamName(teamData.team_name);
        setEventName(teamData.events?.name || 'Unknown Event');
        
        // Fetch captain details if there is one
        if (teamData.captain_id) {
          const { data: captainData, error: captainError } = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url')
            .eq('id', teamData.captain_id)
            .single();
          
          if (captainError) {
            console.error('Error fetching captain:', captainError);
          } else if (captainData) {
            setCaptain(captainData);
          }
        }
        
        // Fetch team members
        await fetchTeamMembers();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      // First get the team_members entries
      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId);
      
      if (memberError) {
        console.error('Error fetching team members:', memberError);
        return;
      }
      
      if (!memberData || memberData.length === 0) {
        setMembers([]);
        return;
      }
      
      // Then get the profile information for each member
      const enhancedMembers: TeamMember[] = [];
      for (const member of memberData) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('full_name, email, avatar_url')
          .eq('id', member.user_id)
          .single();
        
        if (userError) {
          console.error(`Error fetching user ${member.user_id}:`, userError);
        } else if (userData) {
          enhancedMembers.push({
            id: member.id,
            user_id: member.user_id,
            team_id: member.team_id,
            full_name: userData.full_name,
            email: userData.email,
            avatar_url: userData.avatar_url
          });
        }
      }
      
      setMembers(enhancedMembers);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const searchUsers = async () => {
    if (!userSearchQuery.trim()) {
      Alert.alert('Error', 'Please enter a search term');
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .or(`full_name.ilike.%${userSearchQuery}%,email.ilike.%${userSearchQuery}%`)
        .limit(10);
      
      if (error) {
        console.error('Error searching users:', error);
        Alert.alert('Error', 'Failed to search users');
        return;
      }
      
      setUserSearchResults(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTeamName = async () => {
    if (!teamName.trim()) {
      Alert.alert('Error', 'Team name cannot be empty');
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('teams')
        .update({ team_name: teamName })
        .eq('id', teamId);
      
      if (error) {
        console.error('Error updating team name:', error);
        Alert.alert('Error', 'Failed to update team name');
        return;
      }
      
      Alert.alert('Success', 'Team name updated successfully');
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetCaptain = async (user: User) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('teams')
        .update({ captain_id: user.id })
        .eq('id', teamId);
      
      if (error) {
        console.error('Error setting captain:', error);
        Alert.alert('Error', 'Failed to set team captain');
        return;
      }
      
      setCaptain(user);
      setShowUserSearch(false);
      setUserSearchQuery('');
      setUserSearchResults([]);
      setIsSearchingForCaptain(false);
      
      // Check if user is already a member, if not add them
      const isMember = members.some(member => member.user_id === user.id);
      if (!isMember) {
        await addTeamMember(user);
      }
      
      Alert.alert('Success', 'Team captain updated successfully');
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCaptain = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('teams')
        .update({ captain_id: null })
        .eq('id', teamId);
      
      if (error) {
        console.error('Error removing captain:', error);
        Alert.alert('Error', 'Failed to remove team captain');
        return;
      }
      
      setCaptain(null);
      Alert.alert('Success', 'Team captain removed successfully');
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const addTeamMember = async (user: User) => {
    try {
      setIsLoading(true);
      
      // Check if user is already a member
      const existingMember = members.find(member => member.user_id === user.id);
      if (existingMember) {
        Alert.alert('Info', 'This user is already a team member');
        return;
      }
      
      // Add the user to the team
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: user.id
        })
        .select();
      
      if (error) {
        console.error('Error adding team member:', error);
        Alert.alert('Error', 'Failed to add team member');
        return;
      }
      
      // Refresh team members
      await fetchTeamMembers();
      
      setShowUserSearch(false);
      setUserSearchQuery('');
      setUserSearchResults([]);
      
      Alert.alert('Success', 'Team member added successfully');
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, userId: string) => {
    // Don't allow removing the captain from members
    if (captain && captain.id === userId) {
      Alert.alert(
        'Cannot Remove Captain',
        'The team captain cannot be removed from the team. Please change the captain first.'
      );
      return;
    }
    
    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member from the team?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const { error } = await supabase
                .from('team_members')
                .delete()
                .eq('id', memberId);
              
              if (error) {
                console.error('Error removing team member:', error);
                Alert.alert('Error', 'Failed to remove team member');
                return;
              }
              
              // Refresh team members
              await fetchTeamMembers();
              
              Alert.alert('Success', 'Team member removed successfully');
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
        <ThemedText type="title" style={styles.title}>Edit Team</ThemedText>
        <ThemedText style={styles.subtitle}>{eventName}</ThemedText>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Team Name</ThemedText>
          <View style={styles.teamNameContainer}>
            <TextInput
              style={styles.input}
              value={teamName}
              onChangeText={setTeamName}
              placeholder="Enter team name"
            />
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleUpdateTeamName}
            >
              <ThemedText style={styles.saveButtonText}>Save</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Team Captain</ThemedText>
          {captain ? (
            <View style={styles.captainContainer}>
              <View style={styles.userInfo}>
                <ThemedText style={styles.userName}>{captain.full_name}</ThemedText>
                <ThemedText style={styles.userEmail}>{captain.email}</ThemedText>
              </View>
              <View style={styles.captainActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => {
                    setIsSearchingForCaptain(true);
                    setShowUserSearch(true);
                  }}
                >
                  <ThemedText style={styles.actionButtonText}>Change</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.removeButton]}
                  onPress={handleRemoveCaptain}
                >
                  <ThemedText style={styles.removeButtonText}>Remove</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => {
                setIsSearchingForCaptain(true);
                setShowUserSearch(true);
              }}
            >
              <ThemedText style={styles.addButtonText}>+ Assign Captain</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Team Members</ThemedText>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => {
                setIsSearchingForCaptain(false);
                setShowUserSearch(true);
              }}
            >
              <ThemedText style={styles.addButtonText}>+ Add Member</ThemedText>
            </TouchableOpacity>
          </View>
          
          {showUserSearch && (
            <View style={styles.searchContainer}>
              <View style={styles.searchRow}>
                <TextInput
                  style={[styles.input, {flex: 1}]}
                  placeholder="Search by name or email"
                  value={userSearchQuery}
                  onChangeText={setUserSearchQuery}
                />
                <TouchableOpacity 
                  style={styles.searchButton}
                  onPress={searchUsers}
                >
                  <ThemedText style={styles.searchButtonText}>Search</ThemedText>
                </TouchableOpacity>
              </View>
              
              {userSearchResults.length > 0 && (
                <FlatList
                  data={userSearchResults}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.searchResultItem}
                      onPress={() => isSearchingForCaptain ? handleSetCaptain(item) : addTeamMember(item)}
                    >
                      <ThemedText style={styles.resultName}>{item.full_name}</ThemedText>
                      <ThemedText style={styles.resultEmail}>{item.email}</ThemedText>
                    </TouchableOpacity>
                  )}
                  style={styles.searchResultsList}
                />
              )}
              
              <TouchableOpacity 
                style={styles.cancelSearchButton}
                onPress={() => {
                  setShowUserSearch(false);
                  setUserSearchQuery('');
                  setUserSearchResults([]);
                }}
              >
                <ThemedText>Cancel Search</ThemedText>
              </TouchableOpacity>
            </View>
          )}
          
          {members.length > 0 ? (
            <View style={styles.membersList}>
              {members.map(member => (
                <View key={member.id} style={styles.memberItem}>
                  <View style={styles.userInfo}>
                    <ThemedText style={styles.userName}>{member.full_name}</ThemedText>
                    <ThemedText style={styles.userEmail}>{member.email}</ThemedText>
                    {captain && captain.id === member.user_id && (
                      <View style={styles.captainBadge}>
                        <ThemedText style={styles.captainBadgeText}>Captain</ThemedText>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.removeButton]}
                    onPress={() => handleRemoveMember(member.id, member.user_id)}
                  >
                    <ThemedText style={styles.removeButtonText}>Remove</ThemedText>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <ThemedText style={styles.emptyText}>No team members found. Add members to get started.</ThemedText>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>Back to Event</ThemedText>
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
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  teamNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
  },
  captainContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#666',
    fontSize: 14,
  },
  captainActions: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#0a7ea4',
  },
  actionButtonText: {
    color: '#0a7ea4',
  },
  removeButton: {
    borderColor: 'red',
  },
  removeButtonText: {
    color: 'red',
  },
  addButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
  },
  searchContainer: {
    marginTop: 12,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 10,
  },
  searchButtonText: {
    color: 'white',
  },
  searchResultsList: {
    maxHeight: 300,
    marginBottom: 12,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultEmail: {
    color: '#666',
    fontSize: 14,
  },
  cancelSearchButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    alignItems: 'center',
  },
  membersList: {
    marginTop: 12,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  captainBadge: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  captainBadgeText: {
    color: 'white',
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 12,
  },
  buttonContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },
}); 