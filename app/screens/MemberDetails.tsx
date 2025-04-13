import React from 'react';
import { StyleSheet, View, Pressable, Modal, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

type MemberDetailsProps = {
  isVisible: boolean;
  onClose: () => void;
  member: {
    full_name: string;
    joined_at: string;
    rank: number;
    total_minutes: number;
    activities_logged: number;
    current_milestone: string;
    contribution_percentage: string;
    avatar_url: string;
  } | null;
}

export default function MemberDetails({ isVisible, onClose, member }: MemberDetailsProps) {
  if (!member) return null;
  
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <ThemedView style={styles.modalContainer}>
        <ThemedView style={styles.modalContent}>
          <ThemedView style={styles.header}>
            <ThemedText style={styles.headerTitle}>Member Details</ThemedText>
            <Pressable 
              onPress={onClose} 
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.closeButtonContainer}>
                <ThemedText style={styles.closeX}>✕</ThemedText>
              </View>
            </Pressable>
          </ThemedView>

          <ThemedView style={styles.content}>
            <View style={styles.memberHeader}>
              <View style={styles.avatar}>
                {member.avatar_url ? (
                  <Image 
                    source={{ uri: member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name)}&background=random` }} 
                    style={styles.avatarImage} 
                  />
                ) : (
                  <ThemedText style={styles.avatarText}>
                    {member.full_name.split(' ').map(n => n[0]).join('')}
                  </ThemedText>
                )}
              </View>
              <View style={styles.memberInfo}>
                <ThemedText style={styles.memberName}>{member.full_name}</ThemedText>
                <ThemedText style={styles.memberSubtext}>
                  Member since {new Date(member.joined_at).toLocaleDateString('en-US', { 
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </ThemedText>
                <ThemedText style={styles.memberSubtext}>Team Rank: #{member.rank}</ThemedText>
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Activity Summary</ThemedText>
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryLabel}>Total Minutes:</ThemedText>
                <ThemedText style={styles.summaryValue}>{member.total_minutes}</ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryLabel}>Activities Logged:</ThemedText>
                <ThemedText style={styles.summaryValue}>{member.activities_logged}</ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryLabel}>Current Milestone:</ThemedText>
                <ThemedText style={styles.summaryValue}>{member.current_milestone}</ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryLabel}>Team Contribution:</ThemedText>
                <ThemedText style={styles.summaryValue}>{member.contribution_percentage}</ThemedText>
              </View>
            </View>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </Modal>
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
    width: '90%',
    maxWidth: 500,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    backgroundColor: '#C41E3A',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 10,
  },
  closeButtonContainer: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeX: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 24,
    textAlign: 'center',
  },
  content: {
    backgroundColor: 'white',
    padding: 20,
  },
  memberHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#333333',
  },
  memberSubtext: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  section: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333333',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
}); 