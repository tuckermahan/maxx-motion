import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Animated, TouchableOpacity, Modal, Dimensions, Platform, Image, ImageBackground, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'expo-router';

const BADGE_SIZE = (Dimensions.get('window').width - 48) / 3;
const BADGE_PADDING = 6;
const GRID_PADDING = 16;

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  isUnlocked: boolean;
  progress: number;
  total: number;
  category: string;
  emoji: string;
  imageUrl: string;
}

const badges: Badge[] = [
  // Step-Based Goals
  {
    id: '1',
    name: 'Step Starter',
    icon: 'shoe-prints',
    description: '5k Steps in one day',
    isUnlocked: true,
    progress: 5000,
    total: 5000,
    category: 'Steps',
    emoji: '👣',
    imageUrl: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
  },
  {
    id: '2',
    name: 'Step Master',
    icon: 'walking',
    description: '10k Steps in one day',
    isUnlocked: false,
    progress: 7500,
    total: 10000,
    category: 'Steps',
    emoji: '👟',
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
  },
  {
    id: '3',
    name: 'Step Champion',
    icon: 'running',
    description: '20k Steps in one day',
    isUnlocked: false,
    progress: 12000,
    total: 20000,
    category: 'Steps',
    emoji: '👟',
    imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
  },

  // Workout Milestones
  {
    id: '4',
    name: 'Workout Beginner',
    icon: 'dumbbell',
    description: '10 Total Workouts',
    isUnlocked: true,
    progress: 10,
    total: 10,
    category: 'Workouts',
    emoji: '🏋️',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
  },
  {
    id: '5',
    name: 'Workout Expert',
    icon: 'dumbbell',
    description: '50 Total Workouts',
    isUnlocked: false,
    progress: 25,
    total: 50,
    category: 'Workouts',
    emoji: '🏋️',
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
  },
  {
    id: '6',
    name: 'Workout Master',
    icon: 'award',
    description: '100 Total Workouts',
    isUnlocked: false,
    progress: 45,
    total: 100,
    category: 'Workouts',
    emoji: '🏆',
    imageUrl: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
  },

  // Activity-Specific
  {
    id: '7',
    name: 'Runner\'s Badge',
    icon: 'running',
    description: 'Complete a 5k Run',
    isUnlocked: false,
    progress: 3,
    total: 5,
    category: 'Activities',
    emoji: '🏃',
    imageUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
  },
  {
    id: '8',
    name: 'Cyclist\'s Badge',
    icon: 'bicycle',
    description: 'Bike 25 Miles',
    isUnlocked: false,
    progress: 15,
    total: 25,
    category: 'Activities',
    emoji: '🚴',
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
  },
  {
    id: '9',
    name: 'Yogi\'s Badge',
    icon: 'pray',
    description: '10 Yoga Sessions',
    isUnlocked: false,
    progress: 6,
    total: 10,
    category: 'Activities',
    emoji: '🧘‍♂️',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
  },

  // Time-Based Challenges
  {
    id: '10',
    name: 'Early Bird',
    icon: 'sun',
    description: 'Workout Before 7 AM',
    isUnlocked: true,
    progress: 5,
    total: 5,
    category: 'Time',
    emoji: '🌅',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
  },
  {
    id: '11',
    name: 'Weekend Warrior',
    icon: 'calendar',
    description: '5 Weekend Workouts',
    isUnlocked: false,
    progress: 3,
    total: 5,
    category: 'Time',
    emoji: '💪',
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
  },
  {
    id: '12',
    name: 'Night Owl',
    icon: 'moon',
    description: 'Workout After 10 PM',
    isUnlocked: false,
    progress: 2,
    total: 5,
    category: 'Time',
    emoji: '🌙',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
  },
];

type Milestone = {
  id: string;
  milestone_name: string;
  milestone_minutes: number;
  achieved: boolean;
  achieved_at?: string;
  rewarded: boolean;
  rewarded_at?: string;
};

export default function AchievementsScreen() {
  const { userProfile } = useUser();
  const [showAchievement, setShowAchievement] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(5);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const scaleAnim = new Animated.Value(1);
  const router = useRouter();

  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    try {
      // Get the current active event
      const { data: activeEvent, error: eventError } = await supabase
        .from('events')
        .select('id')
        .eq('status', 'Active')
        .single();

      if (eventError) {
        console.error('Error fetching active event:', eventError);
        return;
      }

      // Fetch milestones for this event
      const { data: eventMilestones, error: milestonesError } = await supabase
        .from('milestones')
        .select('id, milestone_name, milestone_minutes, users_rewarded')
        .eq('event_id', activeEvent.id)
        .order('milestone_minutes', { ascending: true });

      if (milestonesError) {
        console.error('Error fetching milestones:', milestonesError);
        return;
      }

      // Fetch user's activities
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('activity_minutes, activity_date')
        .eq('event_id', activeEvent.id)
        .eq('user_id', userProfile?.id);

      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
        return;
      }

      // Calculate total minutes
      const total = activities?.reduce((sum, activity) => sum + activity.activity_minutes, 0) || 0;
      setTotalMinutes(total);

      // Process milestones
      const processedMilestones = eventMilestones.map(milestone => {
        const achieved = total >= milestone.milestone_minutes;
        const achievedDate = achieved ?
          activities?.sort((a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime())[0]?.activity_date :
          undefined;

        const usersRewarded = milestone.users_rewarded || [];
        const userReward = Array.isArray(usersRewarded) ?
          usersRewarded.find((r: any) => r.user_id === userProfile?.id) :
          null;

        return {
          id: milestone.id,
          milestone_name: milestone.milestone_name,
          milestone_minutes: milestone.milestone_minutes,
          achieved,
          achieved_at: achievedDate,
          rewarded: !!userReward,
          rewarded_at: userReward?.rewarded_at
        };
      });

      setMilestones(processedMilestones);
    } catch (error) {
      console.error('Error in fetchMilestones:', error);
    }
  };

  useEffect(() => {
    const pulseAnimation = Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulseAnimation).start();
  }, []);

  const renderStreak = () => {
    const flames = [];
    for (let i = 0; i < 30; i++) {
      flames.push(
        <FontAwesome5
          key={i}
          name="fire"
          size={16}
          color={i < currentStreak ? '#C41E3A' : '#E0E0E0'}
          style={styles.streakFlame}
        />
      );
    }
    return flames;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Steps':
        return '#4CAF50';
      case 'Workouts':
        return '#2196F3';
      case 'Activities':
        return '#FF9800';
      case 'Time':
        return '#9C27B0';
      default:
        return '#666';
    }
  };

  const renderProgressEmojis = (badge: Badge) => {
    const totalEmojis = 5;
    const filledEmojis = Math.floor((badge.progress / badge.total) * totalEmojis);

    return (
      <View style={styles.emojiContainer}>
        {[...Array(totalEmojis)].map((_, index) => (
          <Text key={index} style={styles.emoji}>
            {index < filledEmojis ? badge.emoji : '⚪️'}
          </Text>
        ))}
      </View>
    );
  };

  const renderBadge = ({ item, index }: { item: Badge; index: number }) => {
    const scaleAnim = new Animated.Value(1);

    const onPressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
      setSelectedBadge(item);
    };

    const categoryColor = getCategoryColor(item.category);

    return (
      <TouchableOpacity
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={styles.badgeContainer}
      >
        <Animated.View
          style={[
            styles.badge,
            item.isUnlocked ? styles.badgeUnlocked : styles.badgeLocked,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          {item.isUnlocked && (
            <View style={styles.unlockedOverlay}>
              <View style={styles.unlockedIndicator}>
                <FontAwesome5 name="check-circle" size={24} color="#4CAF50" />
              </View>
            </View>
          )}

          <Image
            source={{ uri: item.imageUrl }}
            style={styles.badgeImage}
            resizeMode="cover"
          />

          <View style={styles.badgeContent}>
            <Text style={[styles.badgeName, !item.isUnlocked && styles.badgeNameLocked]}>
              {item.name}
            </Text>
            <View style={[styles.categoryContainer, { backgroundColor: categoryColor }]}>
              <Text style={styles.badgeCategory}>{item.category}</Text>
            </View>
          </View>

          <View style={styles.emojiContainer}>
            {renderProgressEmojis(item)}
          </View>
          <Text style={styles.progressText}>
            {item.progress}/{item.total}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderBadgeModal = (badge: Badge) => {
    const categoryColor = getCategoryColor(badge.category);

    return (
      <View style={styles.modalContent}>
        <Image
          source={{ uri: badge.imageUrl }}
          style={styles.modalImage}
          resizeMode="cover"
        />
        <Text style={styles.modalTitle}>{badge.name}</Text>
        <View style={[styles.modalCategoryContainer, { backgroundColor: categoryColor }]}>
          <Text style={styles.modalCategoryText}>{badge.category}</Text>
        </View>
        <Text style={styles.modalDescription}>{badge.description}</Text>
        <>
          <Text style={styles.modalProgressTitle}>Progress:</Text>
          {renderProgressEmojis(badge)}
          <Text style={styles.modalProgressText}>
            {badge.name === 'Step Champion' || badge.name === 'Workout Master' ? 0 : badge.progress} of {badge.total} completed
          </Text>
        </>
        <TouchableOpacity
          style={styles.modalCloseButton}
          onPress={() => setSelectedBadge(null)}
        >
          <Text style={styles.modalCloseText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMilestoneProgress = () => {
    if (milestones.length === 0) return null;

    return (
      <View style={styles.milestoneSection}>
        <Text style={styles.milestoneTitle}>Event Milestones</Text>
        <View style={styles.totalMinutesContainer}>
          <Text style={styles.totalMinutesLabel}>Total Minutes:</Text>
          <Text style={styles.totalMinutesValue}>{totalMinutes}</Text>
        </View>

        {milestones.map((milestone, index) => (
          <View key={milestone.id} style={styles.milestoneCard}>
            <View style={styles.milestoneHeader}>
              <Text style={styles.milestoneName}>{milestone.milestone_name}</Text>
              <Text style={styles.milestoneMinutes}>{milestone.milestone_minutes} minutes</Text>
            </View>

            <View style={styles.milestoneProgressContainer}>
              <View style={[
                styles.milestoneProgressBar,
                { width: `${Math.min(100, (totalMinutes / milestone.milestone_minutes) * 100)}%` }
              ]} />
            </View>

            <View style={styles.milestoneStatus}>
              {milestone.achieved ? (
                <View style={styles.achievedBadge}>
                  <Text style={styles.achievedText}>
                    {milestone.rewarded ? '🏆 Rewarded' : '✨ Achieved'}
                  </Text>
                  <Text style={styles.achievedDate}>
                    {milestone.achieved_at ? new Date(milestone.achieved_at).toLocaleDateString() : ''}
                  </Text>
                </View>
              ) : (
                <Text style={styles.pendingText}>
                  {milestone.milestone_minutes - totalMinutes} minutes to go
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground
        source={require('@/assets/images/gym-equipment.png')}
        style={styles.headerBackground}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(196, 30, 58, 0.9)', 'rgba(128, 128, 128, 0.85)']}
          style={styles.headerOverlay}
          locations={[0, 0.5]}
        >
          <View style={styles.header}>
            <Text style={styles.pageTitle}>MAXX Motion</Text>
            <TouchableOpacity onPress={() => router.push('/profile')}>
              <FontAwesome5 name="user-circle" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>Achievements</Text>
          <Text style={styles.headerSubtitle}>Challenge yourself. Earn rewards.</Text>
        </LinearGradient>
      </ImageBackground>

      <View style={styles.streakContainer}>
        <View style={styles.streakIconContainer}>
          <FontAwesome5 name="crown" size={32} color="#FFD700" />
        </View>
        <View style={styles.streakInfo}>
          <Text style={styles.streakTitle}>{currentStreak} Day Streak!</Text>
          <View style={styles.streakFlamesContainer}>
            {renderStreak()}
          </View>
          <Text style={styles.streakSubtitle}>{7 - currentStreak} days until next reward</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {renderMilestoneProgress()}

        <View style={styles.achievementsSection}>
          <Text style={styles.achievementsTitle}>My Achievements</Text>
          <FlatList
            data={badges}
            renderItem={renderBadge}
            keyExtractor={item => item.id}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={styles.badgesGrid}
          />
        </View>
      </ScrollView>

      <Modal
        visible={selectedBadge !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <View style={styles.modalOverlay}>
          {selectedBadge && renderBadgeModal(selectedBadge)}
        </View>
      </Modal>

      <Modal
        visible={showAchievement}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAchievement(false)}
      >
        <View style={styles.achievementOverlay}>
          <View style={styles.achievementContent}>
            <View style={styles.celebrationIcon}>
              <FontAwesome5 name="trophy" size={48} color="#FFD700" />
            </View>
            <Text style={styles.achievementTitle}>New Achievement!</Text>
            <Text style={styles.achievementDescription}>You've unlocked "Early Riser"</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAchievement(false)}
            >
              <Text style={styles.modalCloseText}>Awesome!</Text>
            </TouchableOpacity>
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
    paddingTop: Constants.statusBarHeight,
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
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  streakIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  streakSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  streakFlamesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
    width: '100%',
  },
  streakFlame: {
    marginHorizontal: 0,
    marginVertical: 0,
  },
  badgeGrid: {
    padding: 12,
  },
  badgeContainer: {
    width: BADGE_SIZE,
    padding: BADGE_PADDING,
    backgroundColor: 'transparent',
  },
  badge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    position: 'relative',
  },
  badgeLocked: {
    opacity: 0.8,
  },
  badgeUnlocked: {
    backgroundColor: '#E8F5E9',
  },
  unlockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    zIndex: 1,
  },
  unlockedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
    zIndex: 2,
  },
  badgeImage: {
    width: '100%',
    height: 90,
    backgroundColor: '#f0f0f0',
  },
  badgeContent: {
    padding: 8,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    textAlign: 'center',
  },
  badgeNameLocked: {
    color: '#999',
  },
  categoryContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'center',
  },
  badgeCategory: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emojiContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  emoji: {
    fontSize: 16,
    marginHorizontal: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '80%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalCategoryContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  modalCategoryText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalProgressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  modalProgressEmojiContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalProgressEmoji: {
    fontSize: 24,
    marginHorizontal: 4,
  },
  modalProgressEmojiFilled: {
    opacity: 1,
  },
  modalProgressEmojiEmpty: {
    opacity: 0.3,
  },
  modalProgressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalCloseButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#C41E3A',
    borderRadius: 8,
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  achievementOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '80%',
  },
  celebrationIcon: {
    marginBottom: 16,
  },
  achievementTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  achievementDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  milestoneSection: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  milestoneTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  milestoneSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  totalMinutesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  totalMinutesLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  totalMinutesValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#C41E3A',
  },
  milestoneCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  milestoneMinutes: {
    fontSize: 14,
    color: '#666',
  },
  milestoneStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  achievedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievedText: {
    fontSize: 14,
    color: '#4CAF50',
    marginRight: 8,
  },
  achievedDate: {
    fontSize: 12,
    color: '#666',
  },
  pendingText: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
  },
  achievementsSection: {
    marginTop: 24,
    paddingHorizontal: GRID_PADDING,
  },
  achievementsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  milestoneProgressContainer: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  milestoneProgressBar: {
    height: '100%',
    backgroundColor: '#C41E3A',
    borderRadius: 4,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: BADGE_PADDING,
  },
}); 