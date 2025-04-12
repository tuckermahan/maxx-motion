import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TabBar, TabItem } from '@/components/ui/tabs';
import { ListItem } from '@/components/ui/list-item';

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
  
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Activity Selection
      </Text>
      
      <TabBar>
        <TabItem 
          label="Workouts" 
          active 
          onPress={() => {}} 
        />
        <TabItem 
          label="Challenges" 
          onPress={() => {}} 
        />
      </TabBar>
      
      <Card style={{ backgroundColor: '#FFF0F0', marginVertical: 20 }}>
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
              onPress={() => {}} 
              variant="primary"
              style={{ marginBottom: 8 }}
            />
            <Button 
              label="Manual Entry" 
              onPress={() => {}} 
              variant="primary"
            />
          </View>
        </View>
      </Card>
      
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
        Get Started
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
    </View>
  );
} 