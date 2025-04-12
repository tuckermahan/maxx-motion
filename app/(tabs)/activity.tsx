import React, { useState } from 'react';
import { View, Text, ScrollView, ImageBackground, Modal, TouchableOpacity, Pressable, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TabBar, TabItem } from '@/components/ui/tabs';
import { ListItem } from '@/components/ui/list-item';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TextInput } from 'react-native';
import { supabase } from '@/lib/supabase';

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

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: 'transparent', dark: 'transparent' }}
      headerImage={
        <ImageBackground
          source={require('../assets/images/gym-equipment.png')}
          style={{ height: 300, width: '100%', backgroundColor: '#000000' }}
          resizeMode="cover"
          imageStyle={{ opacity: 0.9 }}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', padding: 20 }}>
            <Text style={{ fontSize: 32, fontWeight: '700', color: 'white', marginBottom: 8 }}>MAXX Motion</Text>
            <Text style={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.8)', fontWeight: '400' }}>
              Track your motion. Reach your potential.
            </Text>
          </View>
        </ImageBackground>
      }
    >
      <ThemedView style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>
        <ThemedText style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
          Activity Selection
        </ThemedText>
        
        <TabBar>
          <TabItem label="Workouts" active onPress={() => {}} />
          <TabItem label="Challenges" onPress={() => {}} />
        </TabBar>
        
        <Card style={{ 
            backgroundColor: '#FFF0F0', 
            marginVertical: 20,
            borderRadius: 20,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.04,
            shadowRadius: 12,
            elevation: 3,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ marginRight: 12 }}>
              <Text style={{ fontSize: 24 }}>📧</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>
                Start Your Journey!
              </Text>
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
                Add some data to start scoring points
              </Text>
              <Button 
                label="Connect Tracker" 
                onPress={() => setTrackerModalVisible(true)} 
                variant="primary"
                style={{ marginBottom: 8 }}
              />
              <Button 
                label="Manual Entry" 
                onPress={() => setManualEntryModalVisible(true)} 
                variant="primary"
              />
            </View>
          </View>
        </Card>
        
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
          Add By Activity Type
        </Text>
        
        <ScrollView>
          {workoutCategories.map((category) => (
            <ListItem
              key={category.id}
              icon={category.icon}
              title={category.name}
              onPress={() => navigateToWorkout(category.id)}
              showChevron
            />
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
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
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