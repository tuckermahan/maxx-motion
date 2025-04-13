import React, { useState } from 'react';
import { View, Text, ScrollView, ImageBackground, Modal, TouchableOpacity, Pressable, StyleSheet, Platform } from 'react-native';
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

type RootStackParamList = {
  WorkoutDetail: { categoryId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function Activity() {
  const navigation = useNavigation<NavigationProp>();
  
  const workoutCategories = [
    { id: 'bicep', name: 'Bicep', icon: '💪' },
    { id: 'bodyback', name: 'Body-Back', icon: '🔙' },
    { id: 'bodybutt', name: 'Body-Butt', icon: '🍑' },
    { id: 'legscore', name: 'Legs and Core', icon: '🦵' },
  ];
  
  const navigateToWorkout = (categoryId: string) => {
    navigation.navigate('WorkoutDetail', { categoryId });
  };

  const [trackerModalVisible, setTrackerModalVisible] = useState(false);
  const [manualEntryModalVisible, setManualEntryModalVisible] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    activity_type: '',
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

  const handleManualSubmit = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert([{
          user_id: 'current_user_id', // TODO: Get from auth
          ...manualEntry
        }]);

      if (error) throw error;
      setManualEntryModalVisible(false);
      // TODO: Add success feedback
    } catch (error) {
      console.error('Error:', error);
      // TODO: Add error feedback
    }
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
          onPress={() => {/* Show native date picker */}}
          variant="secondary"
        />
      );
    }
  };

  const [activeTab, setActiveTab] = useState('workouts');

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/images/gym-equipment.png')}
        style={styles.headerBackground}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(196, 30, 58, 0.9)', 'rgba(128, 128, 128, 0.85)']}
          locations={[0, 0.5]}
          style={styles.headerOverlay}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>MAXX Motion</Text>
            <View style={styles.userIcon}>
              <Text style={styles.userIconText}>U</Text>
            </View>
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.pageTitle}>Activity Tracking</Text>
            <Text style={styles.tagline}>Track your motion. Reach your potential.</Text>
          </View>
        </LinearGradient>
      </ImageBackground>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'workouts' && styles.activeTab]}
          onPress={() => setActiveTab('workouts')}
        >
          <Text style={[styles.tabText, activeTab === 'workouts' && styles.activeTabText]}>
            WORKOUTS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'challenges' && styles.activeTab]}
          onPress={() => setActiveTab('challenges')}
        >
          <Text style={[styles.tabText, activeTab === 'challenges' && styles.activeTabText]}>
            CHALLENGES
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.challengeCard}>
        <View style={styles.challengeInfo}>
          <Text style={styles.challengeTitle}>Start Your Journey!</Text>
          <Text style={styles.challengeDates}>Add some data to start scoring points</Text>
        </View>
        <View style={styles.activeTag}>
          <Text style={styles.activeTagText}>NEW</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setTrackerModalVisible(true)}
        >
          <Text style={styles.actionButtonText}>Connect Tracker</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setManualEntryModalVisible(true)}
        >
          <Text style={styles.actionButtonText}>Manual Entry</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Add By Activity Type</Text>
      </View>
        
      <ScrollView style={styles.content}>
        {workoutCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryItem}
            onPress={() => navigateToWorkout(category.id)}
          >
            <View style={styles.categoryIconContainer}>
              <Text style={styles.categoryIcon}>{category.icon}</Text>
            </View>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
            <ThemedText style={styles.modalTitle}>Manual Activity Entry</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Activity Type"
              value={manualEntry.activity_type}
              onChangeText={(text) => setManualEntry({...manualEntry, activity_type: text})}
            />
            <TextInput
              style={styles.input}
              placeholder="Duration (minutes)"
              keyboardType="numeric"
              value={manualEntry.activity_minutes}
              onChangeText={(text) => setManualEntry({...manualEntry, activity_minutes: text})}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    justifyContent: 'space-between',
    padding: 16,
    zIndex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  userIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userIconText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C41E3A',
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 20,
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: Platform.OS === 'web' ? '50%' : '90%',
    maxWidth: 400,
    minWidth: Platform.OS === 'web' ? 320 : 'auto',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  trackerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderRadius: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {})
  },
  trackerOptionPressed: {
    backgroundColor: '#f0f0f0',
  },
  trackerIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  trackerName: {
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 16,
  },
});