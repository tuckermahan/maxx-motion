import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

export function ListItem({ 
  icon, 
  title, 
  subtitle, 
  onPress, 
  showChevron = false 
}: {
  icon?: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      {icon && (
        <Text style={styles.icon}>{icon}</Text>
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {showChevron && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  icon: {
    fontSize: 20,
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  chevron: {
    fontSize: 20,
    color: '#888',
  },
}); 