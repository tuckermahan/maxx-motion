import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function MemberDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Extract member data from params
  const member = {
    full_name: params.full_name as string,
    joined_at: params.joined_at as string,
    rank: Number(params.rank),
    total_minutes: Number(params.total_minutes),
    activities_logged: Number(params.activities_logged),
    current_milestone: params.current_milestone as string,
    contribution_percentage: params.contribution_percentage as string,
    avatar_url: params.avatar_url as string,
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <View style={styles.headerContent}>
            <Pressable 
              onPress={() => router.back()} 
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <IconSymbol
                name="chevron.left"
                size={28}
                color="white"
              />
            </Pressable>
            <ThemedText style={styles.headerTitle}>Member Details</ThemedText>
          </View>
        </ThemedView>

        <ThemedView style={styles.card}>
          <View style={styles.memberHeader}>
            <View style={styles.avatar}>
              <ThemedText style={styles.avatarText}>
                {member.full_name.split(' ').map(n => n[0]).join('')}
              </ThemedText>
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#DC143C',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    alignSelf: 'center',
    padding: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberHeader: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
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