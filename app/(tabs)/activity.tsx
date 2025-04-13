import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ImageBackground, Modal, TouchableOpacity, Pressable, StyleSheet, Platform, Alert, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TabBar, TabItem } from '@/components/ui/tabs';
import { ListItem } from '@/components/ui/list-item';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TextInput } from 'react-native';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/lib/auth';

// Types for our Supabase data
type ActivityType = {
  id: string;
  type_name: string;
  type_emoji: string;
  description: string;
};

type Event = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
};

type UserActivity = {
  id: string;
  user_id: string;
  event_id: string;
  activity_type: string;
  activity_type_linked: string;
  activity_type_emoji?: string;
  activity_minutes: number;
  activity_date: string;
  activity_source: string;
  created_at: string;
  event?: {
    name: string;
  };
};

type RootStackParamList = {
  WorkoutDetail: { categoryId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Review Activities component
function ActivityReview({ refreshTrigger, onRefreshComplete, onEditActivity }: {
  refreshTrigger: number,
  onRefreshComplete: () => void,
  onEditActivity: (activity: UserActivity) => void
}) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activityTypes, setActivityTypes] = useState<{ [key: string]: ActivityType }>({});

  useEffect(() => {
    fetchUserActivities();
    fetchActivityTypes();
  }, [refreshTrigger]);

  const fetchActivityTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_types')
        .select('*');

      if (error) throw error;

      const typeMap: { [key: string]: ActivityType } = {};
      if (data) {
        data.forEach(type => {
          typeMap[type.id] = type;
        });
      }

      setActivityTypes(typeMap);
    } catch (err) {
      console.error('Error fetching activity types:', err);
    }
  };

  const fetchUserActivities = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          event:event_id (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('activity_date', { ascending: false });

      if (error) throw error;

      // Add emoji to each activity based on type
      const activitiesWithEmoji = data?.map(activity => {
        const activityType = activityTypes[activity.activity_type_linked];
        return {
          ...activity,
          activity_type_emoji: activityType?.type_emoji || '🏃‍♂️'
        };
      }) || [];

      setActivities(activitiesWithEmoji);
      onRefreshComplete();
    } catch (err) {
      console.error('Error fetching user activities:', err);
      setError('Failed to load your activities');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.centeredContent}>
        <Text>Loading your activities...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContent}>
        <Text style={styles.errorText}>{error}</Text>
        <Button
          label="Try Again"
          onPress={fetchUserActivities}
          variant="primary"
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  if (activities.length === 0) {
    return (
      <View style={styles.centeredContent}>
        <Text style={styles.emptyStateText}>You haven't logged any activities yet.</Text>
        <Text style={styles.emptyStateSubtext}>Head over to the "Add Activity" tab to get started!</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.reviewContainer}>
      {activities.map(activity => (
        <TouchableOpacity
          key={activity.id}
          style={styles.activityItem}
          onPress={() => onEditActivity(activity)}
        >
          <View style={styles.activityIconContainer}>
            <Text style={styles.activityIcon}>
              {activity.activity_type_emoji || '🏃‍♂️'}
            </Text>
          </View>
          <View style={styles.activityDetails}>
            <Text style={styles.activityType}>{activity.activity_type}</Text>
            <Text style={styles.activityMeta}>
              {formatDate(activity.activity_date)} • {activity.activity_minutes} minutes
            </Text>
            {activity.event && (
              <Text style={styles.eventName}>
                {activity.event.name}
              </Text>
            )}
          </View>
          <View style={styles.editIconContainer}>
            <Text style={styles.editIcon}>✏️</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

export default function Activity() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [upcomingEvent, setUpcomingEvent] = useState<Event | null>(null);
  const [hasActivities, setHasActivities] = useState(false);

  // Toast notification
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastOpacity] = useState(new Animated.Value(0));

  // State for refreshing the activities list
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Activity editing
  const [editActivityModalVisible, setEditActivityModalVisible] = useState(false);
  const [currentEditActivity, setCurrentEditActivity] = useState<UserActivity | null>(null);

  useEffect(() => {
    fetchActivityTypes();
    fetchEvents();
  }, []);

  useEffect(() => {
    if (user && currentEvent) {
      checkUserActivities();
    }
  }, [user, currentEvent]);

  // Toast animation
  useEffect(() => {
    if (showToast) {
      Animated.sequence([
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowToast(false);
      });
    }
  }, [showToast, toastOpacity]);

  const showSuccessToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const fetchActivityTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('activity_types')
        .select('*');

      if (error) throw error;
      setActivityTypes(data || []);
    } catch (err) {
      console.error('Error fetching activity types:', err);
      setError('Failed to load activity types');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Fetch current active event
      const { data: currentData, error: currentError } = await supabase
        .from('events')
        .select('*')
        .lte('start_date', today)
        .gte('end_date', today)
        .order('start_date', { ascending: false })
        .limit(1);

      if (currentError) throw currentError;

      if (currentData && currentData.length > 0) {
        setCurrentEvent(currentData[0]);
      } else {
        // If no current event, fetch upcoming event
        const { data: upcomingData, error: upcomingError } = await supabase
          .from('events')
          .select('*')
          .gt('start_date', today)
          .order('start_date', { ascending: true })
          .limit(1);

        if (upcomingError) throw upcomingError;

        if (upcomingData && upcomingData.length > 0) {
          setUpcomingEvent(upcomingData[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const checkUserActivities = async () => {
    if (!user || !currentEvent) return;

    try {
      const { data, error } = await supabase
        .from('activities')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', currentEvent.id)
        .limit(1);

      if (error) throw error;

      setHasActivities(data && data.length > 0);
    } catch (err) {
      console.error('Error checking user activities:', err);
    }
  };

  const navigateToWorkout = (categoryId: string, typeName: string, typeEmoji: string) => {
    // Instead of navigating to a detail page, open the manual entry modal with this activity type
    setManualEntry({
      ...manualEntry,
      activity_type: typeName,
      activity_type_linked: categoryId,
      activity_type_emoji: typeEmoji
    });
    setManualEntryModalVisible(true);
  };

  const [trackerModalVisible, setTrackerModalVisible] = useState(false);
  const [manualEntryModalVisible, setManualEntryModalVisible] = useState(false);
  const [activityTypeModalVisible, setActivityTypeModalVisible] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    activity_type: '',
    activity_type_linked: '',
    activity_type_emoji: '',
    activity_minutes: '',
    activity_date: new Date(),
    activity_source: 'manual'
  });

  const trackerOptions = [
    { id: 'apple', name: 'Apple Health', icon: '🍎' },
    { id: 'google', name: 'Google Fit', icon: '🏃' },
    { id: 'fitbit', name: 'Fitbit', icon: '⌚' },
    { id: 'strava', name: 'Strava', icon: '🚴' },
  ];

  const handleTrackerSelection = async (trackerId: string) => {
    // TODO: Implement tracker connection logic
    console.log('Selected tracker:', trackerId);
    setTrackerModalVisible(false);
  };

  const handleActivityTypeSelection = (typeId: string, typeName: string, typeEmoji: string) => {
    setManualEntry({
      ...manualEntry,
      activity_type: typeName,
      activity_type_linked: typeId,
      activity_type_emoji: typeEmoji
    });
    setActivityTypeModalVisible(false);
  };

  const handleManualSubmit = async () => {
    try {
      if (!manualEntry.activity_type || !manualEntry.activity_minutes) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      if (!user) {
        Alert.alert('Error', 'You must be logged in to log activity');
        return;
      }

      // Check if we have an event to associate with this activity
      if (!currentEvent && !upcomingEvent) {
        Alert.alert('Error', 'No active or upcoming event available');
        return;
      }

      // Use the current event if available, otherwise use the upcoming event
      const eventId = currentEvent ? currentEvent.id : upcomingEvent?.id;

      const { data, error } = await supabase
        .from('activities')
        .insert([{
          user_id: user.id,
          event_id: eventId,
          activity_type: manualEntry.activity_type,
          activity_type_linked: manualEntry.activity_type_linked,
          activity_minutes: parseInt(manualEntry.activity_minutes),
          activity_date: manualEntry.activity_date.toISOString().split('T')[0],
          activity_source: 'manual'
        }]);

      if (error) throw error;
      setManualEntryModalVisible(false);

      // Reset form
      setManualEntry({
        activity_type: '',
        activity_type_linked: '',
        activity_type_emoji: '',
        activity_minutes: '',
        activity_date: new Date(),
        activity_source: 'manual'
      });

      // Show success message
      showSuccessToast(`${manualEntry.activity_minutes} minutes of ${manualEntry.activity_type} logged!`);

      // Update hasActivities flag if this was for the current event
      if (currentEvent && eventId === currentEvent.id) {
        setHasActivities(true);
      }

      // Trigger refresh of activities list
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error('Error:', error);
      Alert.alert('Error', error.message || 'Failed to log activity');
    }
  };

  // Function to handle activity edit
  const handleEditActivity = (activity: UserActivity) => {
    setCurrentEditActivity(activity);

    // Populate the entry form with existing data
    setManualEntry({
      activity_type: activity.activity_type,
      activity_type_linked: activity.activity_type_linked,
      activity_type_emoji: activity.activity_type_emoji || '',
      activity_minutes: activity.activity_minutes.toString(),
      activity_date: new Date(activity.activity_date),
      activity_source: activity.activity_source
    });

    setEditActivityModalVisible(true);
  };

  // Function to update an existing activity
  const handleUpdateActivity = async () => {
    if (!currentEditActivity || !user) return;

    try {
      if (!manualEntry.activity_type || !manualEntry.activity_minutes) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      const { error } = await supabase
        .from('activities')
        .update({
          activity_type: manualEntry.activity_type,
          activity_type_linked: manualEntry.activity_type_linked,
          activity_minutes: parseInt(manualEntry.activity_minutes),
          activity_date: manualEntry.activity_date.toISOString().split('T')[0],
        })
        .eq('id', currentEditActivity.id)
        .eq('user_id', user.id); // Additional safety check

      if (error) throw error;

      setEditActivityModalVisible(false);

      // Reset state
      setCurrentEditActivity(null);
      setManualEntry({
        activity_type: '',
        activity_type_linked: '',
        activity_type_emoji: '',
        activity_minutes: '',
        activity_date: new Date(),
        activity_source: 'manual'
      });

      // Show success message
      showSuccessToast('Activity updated successfully!');

      // Trigger refresh of activities list
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error('Error updating activity:', error);
      Alert.alert('Error', error.message || 'Failed to update activity');
    }
  };

  // Function to delete an activity
  const handleDeleteActivity = async () => {
    if (!currentEditActivity || !user) return;

    // Confirmation dialog
    Alert.alert(
      'Delete Activity',
      'Are you sure you want to delete this activity? This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('activities')
                .delete()
                .eq('id', currentEditActivity.id)
                .eq('user_id', user.id); // Additional safety check

              if (error) throw error;

              setEditActivityModalVisible(false);

              // Reset state
              setCurrentEditActivity(null);
              setManualEntry({
                activity_type: '',
                activity_type_linked: '',
                activity_type_emoji: '',
                activity_minutes: '',
                activity_date: new Date(),
                activity_source: 'manual'
              });

              // Show success message
              showSuccessToast('Activity deleted successfully');

              // Trigger refresh of activities list
              setRefreshTrigger(prev => prev + 1);
            } catch (error: any) {
              console.error('Error deleting activity:', error);
              Alert.alert('Error', error.message || 'Failed to delete activity');
            }
          }
        }
      ]
    );
  };

  // Add a platform-specific date picker component
  // This is a simplified example - you'd need to implement the actual date picker
  const DateInput = () => {
    if (Platform.OS === 'web') {
      return (
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={manualEntry.activity_date.toISOString().split('T')[0]}
          onChange={(e) => {
            const dateStr = e.nativeEvent.text;
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              setManualEntry({
                ...manualEntry,
                activity_date: date
              });
            }
          }}
        />
      );
    } else {
      // Use DateTimePicker from @react-native-community/datetimepicker for mobile
      return (
        <Button
          label={manualEntry.activity_date.toLocaleDateString()}
          onPress={() => {/* Show native date picker */ }}
          variant="secondary"
        />
      );
    }
  };

  // Helper to render the event banner
  const renderEventBanner = () => {
    if (currentEvent) {
      if (!hasActivities) {
        // If there's a current event but user has no activities, show "Start Your Journey"
        return (
          <View style={styles.challengeCard}>
            <View style={styles.challengeInfo}>
              <Text style={styles.challengeTitle}>Start Your Journey!</Text>
              <Text style={styles.challengeDates}>Add some data to start scoring points for {currentEvent.name}</Text>
            </View>
            <View style={styles.activeTag}>
              <Text style={styles.activeTagText}>NEW</Text>
            </View>
          </View>
        );
      }

      // User has activities for current event, show regular event banner
      return (
        <View style={styles.challengeCard}>
          <View style={styles.challengeInfo}>
            <Text style={styles.challengeTitle}>{currentEvent.name}</Text>
            <Text style={styles.challengeDates}>Active until {new Date(currentEvent.end_date).toLocaleDateString()}</Text>
          </View>
          <View style={styles.activeTag}>
            <Text style={styles.activeTagText}>ACTIVE</Text>
          </View>
        </View>
      );
    } else if (upcomingEvent) {
      return (
        <View style={styles.challengeCard}>
          <View style={styles.challengeInfo}>
            <Text style={styles.challengeTitle}>{upcomingEvent.name}</Text>
            <Text style={styles.challengeDates}>Starts {new Date(upcomingEvent.start_date).toLocaleDateString()}</Text>
          </View>
          <View style={styles.activeTag}>
            <Text style={styles.activeTagText}>UPCOMING</Text>
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.challengeCard}>
          <View style={styles.challengeInfo}>
            <Text style={styles.challengeTitle}>Start Your Journey!</Text>
            <Text style={styles.challengeDates}>Add some data to start scoring points</Text>
          </View>
          <View style={styles.activeTag}>
            <Text style={styles.activeTagText}>NEW</Text>
          </View>
        </View>
      );
    }
  };

  // New states for main page tabs
  const [activeTab, setActiveTab] = useState('add');

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/images/gym-equipment.png')}
        style={styles.headerBackground}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(196, 30, 58, 0.9)', 'rgba(128, 128, 128, 0.85)']}
          locations={[0, 0.5]}
          style={styles.headerOverlay}
        >
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>MAXX Motion</ThemedText>
          </View>
          <View style={styles.headerContent}>
            <ThemedText style={styles.pageTitle}>Activity</ThemedText>
            <ThemedText style={styles.tagline}>Log your progress.</ThemedText>
          </View>
        </LinearGradient>
      </ImageBackground>

      {/* Main activity page tabs */}
      <View style={styles.mainTabs}>
        <TouchableOpacity
          style={[styles.mainTab, activeTab === 'add' && styles.activeMainTab]}
          onPress={() => setActiveTab('add')}
        >
          <Text style={[styles.mainTabText, activeTab === 'add' && styles.activeMainTabText]}>
            Add Activity
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTab, activeTab === 'review' && styles.activeMainTab]}
          onPress={() => setActiveTab('review')}
        >
          <Text style={[styles.mainTabText, activeTab === 'review' && styles.activeMainTabText]}>
            Review Activities
          </Text>
        </TouchableOpacity>
      </View>

      {/* Event banner - show in both tabs */}
      {renderEventBanner()}

      {/* Add Activity Tab Content */}
      {activeTab === 'add' && (
        <>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setTrackerModalVisible(true)}
            >
              <Text style={styles.actionButtonText}>Connect Tracker</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                // Reset the manual entry form when opening it from scratch
                setManualEntry({
                  activity_type: '',
                  activity_type_linked: '',
                  activity_type_emoji: '',
                  activity_minutes: '',
                  activity_date: new Date(),
                  activity_source: 'manual'
                });
                setManualEntryModalVisible(true);
              }}
            >
              <Text style={styles.actionButtonText}>Manual Entry</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Add By Activity Type</Text>
          </View>

          <ScrollView style={styles.content}>
            {loading ? (
              <Text style={{ padding: 20, textAlign: 'center' }}>Loading activity types...</Text>
            ) : error ? (
              <Text style={{ padding: 20, textAlign: 'center', color: 'red' }}>{error}</Text>
            ) : (
              activityTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={styles.categoryItem}
                  onPress={() => navigateToWorkout(type.id, type.type_name, type.type_emoji)}
                >
                  <View style={styles.categoryIconContainer}>
                    <Text style={styles.categoryIcon}>{type.type_emoji}</Text>
                  </View>
                  <Text style={styles.categoryName}>{type.type_name}</Text>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </>
      )}

      {/* Review Activities Tab Content */}
      {activeTab === 'review' && (
        <ActivityReview
          refreshTrigger={refreshTrigger}
          onRefreshComplete={() => setIsRefreshing(false)}
          onEditActivity={handleEditActivity}
        />
      )}

      {/* Success Toast */}
      {showToast && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      {/* Tracker Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={trackerModalVisible}
        onRequestClose={() => setTrackerModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Choose Tracker</ThemedText>
            {trackerOptions.map((tracker) => (
              <Pressable
                key={tracker.id}
                style={({ pressed }) => [
                  styles.trackerOption,
                  pressed && styles.trackerOptionPressed
                ]}
                onPress={() => handleTrackerSelection(tracker.id)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Connect to ${tracker.name}`}
              >
                <Text style={styles.trackerIcon}>{tracker.icon}</Text>
                <Text style={styles.trackerName}>{tracker.name}</Text>
              </Pressable>
            ))}
            <Button
              label="Cancel"
              onPress={() => setTrackerModalVisible(false)}
              variant="secondary"
            />
          </View>
        </View>
      </Modal>

      {/* Manual Entry Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={manualEntryModalVisible}
        onRequestClose={() => setManualEntryModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>
              {manualEntry.activity_type
                ? `Log ${manualEntry.activity_type} Activity`
                : 'Manual Activity Entry'}
            </ThemedText>

            {/* Activity Type Display/Selector */}
            {manualEntry.activity_type ? (
              <View style={styles.selectedActivityType}>
                <Text style={styles.selectedActivityEmoji}>{manualEntry.activity_type_emoji}</Text>
                <Text style={styles.selectedActivityName}>{manualEntry.activity_type}</Text>
                <TouchableOpacity
                  style={styles.changeButton}
                  onPress={() => setActivityTypeModalVisible(true)}
                >
                  <Text style={styles.changeButtonText}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Pressable
                style={styles.input}
                onPress={() => setActivityTypeModalVisible(true)}
              >
                <Text style={{ fontSize: 16, color: '#999' }}>
                  Select Activity Type
                </Text>
              </Pressable>
            )}

            <TextInput
              style={styles.input}
              placeholder="Duration (minutes)"
              keyboardType="numeric"
              value={manualEntry.activity_minutes}
              onChangeText={(text) => setManualEntry({ ...manualEntry, activity_minutes: text })}
            />

            <DateInput />

            <View style={styles.buttonContainer}>
              <Button
                label="Submit"
                onPress={handleManualSubmit}
                variant="primary"
                style={{ marginBottom: 8 }}
              />
              <Button
                label="Cancel"
                onPress={() => setManualEntryModalVisible(false)}
                variant="secondary"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Activity Type Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={activityTypeModalVisible}
        onRequestClose={() => setActivityTypeModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Select Activity Type</ThemedText>
            <ScrollView style={{ maxHeight: 300 }}>
              {activityTypes.map((type) => (
                <Pressable
                  key={type.id}
                  style={({ pressed }) => [
                    styles.trackerOption,
                    pressed && styles.trackerOptionPressed
                  ]}
                  onPress={() => handleActivityTypeSelection(type.id, type.type_name, type.type_emoji)}
                >
                  <Text style={styles.trackerIcon}>{type.type_emoji}</Text>
                  <Text style={styles.trackerName}>{type.type_name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Button
              label="Cancel"
              onPress={() => setActivityTypeModalVisible(false)}
              variant="secondary"
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </Modal>

      {/* Edit Activity Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editActivityModalVisible}
        onRequestClose={() => setEditActivityModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>
              Edit Activity
            </ThemedText>

            {/* Activity Type Display/Selector */}
            {manualEntry.activity_type ? (
              <View style={styles.selectedActivityType}>
                <Text style={styles.selectedActivityEmoji}>{manualEntry.activity_type_emoji}</Text>
                <Text style={styles.selectedActivityName}>{manualEntry.activity_type}</Text>
                <TouchableOpacity
                  style={styles.changeButton}
                  onPress={() => setActivityTypeModalVisible(true)}
                >
                  <Text style={styles.changeButtonText}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Pressable
                style={styles.input}
                onPress={() => setActivityTypeModalVisible(true)}
              >
                <Text style={{ fontSize: 16, color: '#999' }}>
                  Select Activity Type
                </Text>
              </Pressable>
            )}

            <TextInput
              style={styles.input}
              placeholder="Duration (minutes)"
              keyboardType="numeric"
              value={manualEntry.activity_minutes}
              onChangeText={(text) => setManualEntry({ ...manualEntry, activity_minutes: text })}
            />

            <DateInput />

            <View style={styles.buttonContainer}>
              <Button
                label="Update"
                onPress={handleUpdateActivity}
                variant="primary"
                style={{ marginBottom: 8 }}
              />
              <Button
                label="Delete"
                onPress={handleDeleteActivity}
                variant="secondary"
                style={{ marginBottom: 8 }}
              />
              <Button
                label="Cancel"
                onPress={() => setEditActivityModalVisible(false)}
                variant="secondary"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerBackground: {
    height: 300,
  },
  headerOverlay: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 16,
    zIndex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
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
  // Main top-level tabs
  mainTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  mainTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeMainTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#C41E3A',
  },
  mainTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
  },
  activeMainTabText: {
    color: '#C41E3A',
  },
  // Old tabs - renamed to avoid conflicts
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
  },
  activeTabText: {
    color: '#2196F3',
  },
  challengeCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C41E3A',
    marginBottom: 4,
  },
  challengeDates: {
    fontSize: 14,
    color: '#666',
  },
  activeTag: {
    backgroundColor: '#C41E3A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  activeTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#C41E3A',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  chevron: {
    fontSize: 24,
    color: '#999',
  },
  toast: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  trackerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#F5F5F5',
  },
  trackerOptionPressed: {
    backgroundColor: '#E0E0E0',
  },
  trackerIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  trackerName: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    justifyContent: 'center',
  },
  buttonContainer: {
    marginTop: 8,
  },
  selectedActivityType: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  selectedActivityEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  selectedActivityName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 16,
  },
  changeButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  // Activity Review Styles
  reviewContainer: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  activityItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    alignItems: 'center',
  },
  activityIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  activityIcon: {
    fontSize: 24,
  },
  activityDetails: {
    flex: 1,
  },
  activityType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activityMeta: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  eventName: {
    fontSize: 12,
    color: '#C41E3A',
  },
  editIconContainer: {
    padding: 8,
  },
  editIcon: {
    fontSize: 18,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#C41E3A',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});