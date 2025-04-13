import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export function TabBar({ 
  children, 
  style = {} 
}: { 
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View style={[styles.tabBar, style]}>
      {children}
    </View>
  );
}

export function TabItem({ 
  label, 
  active = false, 
  onPress 
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity 
      style={[styles.tab, active && styles.activeTab]} 
      onPress={onPress}
    >
      <Text style={[styles.tabText, active && styles.activeTabText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#DC143C', // Use your theme color
  },
  tabText: {
    color: '#888',
  },
  activeTabText: {
    fontWeight: 'bold',
    color: '#000',
  },
}); 