import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Animated, TouchableOpacity, Modal, Dimensions, Platform, Image, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { FontAwesome5 } from '@expo/vector-icons';

const BADGE_SIZE = (Dimensions.get('window').width - 48) / 3;

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

export default function AchievementsScreen() {
  const [showAchievement, setShowAchievement] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(5);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const scaleAnim = new Animated.Value(1);

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

    // Get category color based on category name
    const getCategoryColor = (category: string) => {
      switch (category) {
        case 'Steps': return '#4CAF50'; // Green
        case 'Workouts': return '#2196F3'; // Blue
        case 'Activities': return '#FF9800'; // Orange
        case 'Time': return '#9C27B0'; // Purple
        default: return '#607D8B'; // Default gray
      }
    };

    const categoryColor = getCategoryColor(item.category);

    // Render progress emojis
    const renderProgressEmojis = () => {
      const totalEmojis = 5; // Show 5 emojis for progress

      // For Step Champion and Workout Master, show 0 progress
      let progress = item.progress;
      if (item.name === 'Step Champion' || item.name === 'Workout Master') {
        progress = 0;
      }

      // For completed badges, show full progress
      if (item.isUnlocked) {
        progress = item.total;
      }

      const filledEmojis = Math.ceil((progress / item.total) * totalEmojis);
      const emojis = [];

      // Use the badge's emoji property
      const progressEmoji = item.emoji;

      for (let i = 0; i < totalEmojis; i++) {
        emojis.push(
          <Text key={i} style={[styles.progressEmoji, i < filledEmojis ? styles.progressEmojiFilled : styles.progressEmojiEmpty]}>
            {progressEmoji}
          </Text>
        );
      }

      return (
        <View style={styles.progressEmojiContainer}>
          {emojis}
        </View>
      );
    };

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
            !item.isUnlocked && styles.badgeLocked,
            item.isUnlocked && styles.badgeUnlocked,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          {item.isUnlocked && (
            <View style={styles.unlockedIndicator}>
              <FontAwesome5 name="check-circle" size={16} color="#4CAF50" />
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

          <View style={styles.progressContainer}>
            {renderProgressEmojis()}
            <Text style={styles.progressText}>
              {item.name === 'Step Champion' || item.name === 'Workout Master' ? 0 : item.progress}/{item.total}
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderBadgeModal = (badge: Badge) => {
    // Get category color based on category name
    const getCategoryColor = (category: string) => {
      switch (category) {
        case 'Steps': return '#4CAF50'; // Green
        case 'Workouts': return '#2196F3'; // Blue
        case 'Activities': return '#FF9800'; // Orange
        case 'Time': return '#9C27B0'; // Purple
        default: return '#607D8B'; // Default gray
      }
    };

    const categoryColor = getCategoryColor(badge.category);

    // Render progress emojis for modal
    const renderModalProgressEmojis = () => {
      const totalEmojis = 5; // Show 5 emojis for progress

      // For Step Champion and Workout Master, show 0 progress
      let progress = badge.progress;
      if (badge.name === 'Step Champion' || badge.name === 'Workout Master') {
        progress = 0;
      }

      // For completed badges, show full progress
      if (badge.isUnlocked) {
        progress = badge.total;
      }

      const filledEmojis = Math.ceil((progress / badge.total) * totalEmojis);
      const emojis = [];

      // Use the badge's emoji property
      const progressEmoji = badge.emoji;

      for (let i = 0; i < totalEmojis; i++) {
        emojis.push(
          <Text key={i} style={[styles.modalProgressEmoji, i < filledEmojis ? styles.modalProgressEmojiFilled : styles.modalProgressEmojiEmpty]}>
            {progressEmoji}
          </Text>
        );
      }

      return (
        <View style={styles.modalProgressEmojiContainer}>
          {emojis}
        </View>
      );
    };

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
          {renderModalProgressEmojis()}
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
            <Text style={styles.pageTitle}>Achievements</Text>
            <Text style={styles.tagline}>Track your motion. Reach your potential.</Text>
          </View>
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

      <FlatList
        data={badges}
        renderItem={renderBadge}
        numColumns={3}
        contentContainerStyle={styles.badgeGrid}
        showsVerticalScrollIndicator={false}
      />

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
    backgroundColor: '#F5F5F5',
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
    padding: 6,
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
    borderColor: '#4CAF50',
    borderWidth: 2,
    shadowColor: '#4CAF50',
    shadowOpacity: 0.2,
  },
  unlockedIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 2,
    zIndex: 1,
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
  progressContainer: {
    marginTop: 4,
    alignItems: 'center',
    paddingBottom: 8,
  },
  progressEmojiContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 4,
  },
  progressEmoji: {
    fontSize: 14,
    marginHorizontal: 2,
  },
  progressEmojiFilled: {
    opacity: 1,
  },
  progressEmojiEmpty: {
    opacity: 0.3,
  },
  progressText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
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
}); 