import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, FlatList } from 'react-native';
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

export default function ManageMilestonesScreen() {
  const params = useLocalSearchParams();
  const eventId = params.eventId as string;
  const { userProfile, loading: userLoading } = useUser();
  
  const [isLoading, setIsLoading] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [eventName, setEventName] = useState('');
  const [editMode, setEditMode] = useState(false);

  // Redirect non-admin users
  useEffect(() => {
    if (!userLoading && userProfile && !userProfile.is_admin) {
      router.replace('/(tabs)');
    }
  }, [userProfile, userLoading]);

  // Fetch event details and milestones
  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
      fetchMilestones();
    } else {
      Alert.alert('Error', 'No event ID provided');
      router.back();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
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
    }
  };

  const fetchMilestones = async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMilestone = () => {
    // Get the highest milestone minutes and add 500
    const highestMinutes = milestones.length > 0
      ? Math.max(...milestones.map(m => m.milestone_minutes))
      : 0;
    
    const newMilestone: Milestone = {
      id: 'new-' + Date.now(),
      event_id: eventId,
      milestone_minutes: highestMinutes + 500,
      milestone_name: `New Milestone`
    };
    
    setMilestones([...milestones, newMilestone]);
    setEditMode(true);
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
      'Confirm Delete',
      'Are you sure you want to delete this milestone?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // If it's a new milestone (not yet saved to DB)
            if (id.startsWith('new-')) {
              setMilestones(milestones.filter(m => m.id !== id));
            } else {
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
      Alert.alert('Success', 'Milestone deleted successfully');
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);
      
      // Group milestones into those to create and those to update
      const newMilestones = milestones.filter(m => m.id.startsWith('new-'));
      const existingMilestones = milestones.filter(m => !m.id.startsWith('new-'));
      
      // Create new milestones
      if (newMilestones.length > 0) {
        const { error: createError } = await supabase
          .from('milestones')
          .insert(newMilestones.map(m => ({
            event_id: m.event_id,
            milestone_minutes: m.milestone_minutes,
            milestone_name: m.milestone_name
          })));
        
        if (createError) {
          console.error('Error creating milestones:', createError);
          Alert.alert('Error', 'Failed to save new milestones');
          return;
        }
      }
      
      // Update existing milestones
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
          Alert.alert('Error', 'Failed to update some milestones');
          return;
        }
      }
      
      // Refresh the milestones list
      await fetchMilestones();
      setEditMode(false);
      Alert.alert('Success', 'Milestones updated successfully');
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { 
          text: 'Discard', 
          style: 'destructive',
          onPress: () => {
            fetchMilestones();
            setEditMode(false);
          }
        }
      ]
    );
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
        <ThemedText type="title" style={styles.title}>Manage Milestones</ThemedText>
        
        {eventName && (
          <ThemedText style={styles.subtitle}>For event: {eventName}</ThemedText>
        )}

        <View style={styles.actionsContainer}>
          {!editMode ? (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setEditMode(true)}
            >
              <ThemedText style={styles.editButtonText}>Edit Milestones</ThemedText>
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAddMilestone}
              >
                <ThemedText style={styles.addButtonText}>+ Add Milestone</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveChanges}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancelEdit}
                disabled={isLoading}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {milestones.length > 0 ? (
          <View style={styles.milestonesContainer}>
            {editMode ? (
              <FlatList
                data={milestones}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.milestoneEditItem}>
                    <View style={styles.milestoneInputGroup}>
                      <TextInput
                        style={[styles.input, styles.minutesInput]}
                        value={item.milestone_minutes.toString()}
                        onChangeText={(value) => handleUpdateMilestone(item.id, 'milestone_minutes', value)}
                        keyboardType="numeric"
                        placeholder="Minutes"
                      />
                      <TextInput
                        style={[styles.input, styles.nameInput]}
                        value={item.milestone_name}
                        onChangeText={(value) => handleUpdateMilestone(item.id, 'milestone_name', value)}
                        placeholder="Name"
                      />
                    </View>
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => handleRemoveMilestone(item.id)}
                    >
                      <ThemedText style={styles.removeButtonText}>×</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
                style={styles.milestonesList}
              />
            ) : (
              <FlatList
                data={milestones}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.milestoneItem}>
                    <View style={styles.milestoneInfo}>
                      <ThemedText style={styles.milestoneName}>{item.milestone_name}</ThemedText>
                      <ThemedText style={styles.milestoneMinutes}>{item.milestone_minutes} minutes</ThemedText>
                    </View>
                  </View>
                )}
                style={styles.milestonesList}
              />
            )}
          </View>
        ) : (
          <ThemedText style={styles.emptyText}>No milestones found for this event.</ThemedText>
        )}

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.backButtonText}>Back to Setup</ThemedText>
        </TouchableOpacity>
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
  actionsContainer: {
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: '#0a7ea4',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
  },
  editActions: {
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#0a7ea4',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 12,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
  },
  milestonesContainer: {
    marginBottom: 20,
  },
  milestonesList: {
    width: '100%',
  },
  milestoneItem: {
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  milestoneInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  milestoneMinutes: {
    fontSize: 14,
    color: '#666',
  },
  milestoneEditItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  milestoneInputGroup: {
    flex: 1,
    flexDirection: 'row',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
  },
  minutesInput: {
    flex: 1,
    marginRight: 10,
  },
  nameInput: {
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
    marginVertical: 20,
  },
  backButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    fontSize: 16,
  },
}); 