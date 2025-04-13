import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Modal, Text, TouchableWithoutFeedback } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from './ui/IconSymbol';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';

export type AdminMenuProps = {
  position?: 'topRight' | 'topLeft';
};

export function AdminMenu({ position = 'topRight' }: AdminMenuProps) {
  console.log('AdminMenu component loaded with position:', position);
  const [menuVisible, setMenuVisible] = useState(false);
  const colorScheme = useColorScheme();
  
  // Create dynamic styles that depend on the theme
  const dynamicStyles = {
    menuButtonBackground: {
      backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
      padding: 8,
      borderRadius: 20,
    }
  };

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const navigateTo = (route: 'setup' | 'reports') => {
    closeMenu();
    router.push(`/admin/${route}` as any);
  };

  return (
    <View style={[styles.container, position === 'topLeft' ? styles.topLeft : styles.topRight]}>
      <View style={{
        backgroundColor: '#ff0000', // Red background for visibility
        padding: 10,
        borderRadius: 20,
      }}>
        <TouchableOpacity onPress={toggleMenu}>
          <Text style={{color: '#ffffff', fontWeight: 'bold'}}>ADMIN</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={menuVisible}
        onRequestClose={closeMenu}
      >
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <ThemedView
                style={[
                  styles.menuContent,
                  position === 'topLeft' ? styles.menuLeft : styles.menuRight
                ]}
              >
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigateTo('setup')}
                >
                  <ThemedText style={styles.menuItemText}>Setup</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigateTo('reports')}
                >
                  <ThemedText style={styles.menuItemText}>Reports</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  topRight: {
    top: 10,
    right: 10,
  },
  topLeft: {
    top: 10,
    left: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContent: {
    position: 'absolute',
    top: 50,
    width: 150,
    borderRadius: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuRight: {
    right: 10,
  },
  menuLeft: {
    left: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 16,
  },
}); 