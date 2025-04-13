import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const BADGE_SIZE = (Dimensions.get('window').width - 32) / 2;

interface BadgeProps {
    name: string;
    icon: string;
    iconType: 'fontawesome' | 'material' | 'ionicon' | 'emoji';
    emoji?: string;
    isUnlocked: boolean;
    progress?: number;
    total?: number;
    onPress?: () => void;
    style?: any;
}

const Badge: React.FC<BadgeProps> = ({
    name,
    icon,
    iconType,
    emoji,
    isUnlocked,
    progress = 0,
    total = 1,
    onPress,
    style,
}) => {
    const renderIcon = () => {
        if (iconType === 'emoji' && emoji) {
            return <Text style={styles.emojiIcon}>{emoji}</Text>;
        } else if (iconType === 'material') {
            return (
                <MaterialCommunityIcons
                    name={icon}
                    size={40}
                    color={isUnlocked ? '#C41E3A' : '#999'}
                />
            );
        } else if (iconType === 'ionicon') {
            return (
                <Ionicons
                    name={icon}
                    size={40}
                    color={isUnlocked ? '#C41E3A' : '#999'}
                />
            );
        } else {
            return (
                <FontAwesome5
                    name={icon}
                    size={40}
                    color={isUnlocked ? '#C41E3A' : '#999'}
                />
            );
        }
    };

    return (
        <TouchableOpacity
            style={[styles.badgeContainer, style]}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={!onPress}
        >
            <LinearGradient
                colors={isUnlocked ? ['#FFD700', '#FFA500'] : ['#A9A9A9', '#808080']}
                style={styles.badge}
            >
                {renderIcon()}
                <Text style={[styles.badgeName, !isUnlocked && styles.badgeNameLocked]}>
                    {name}
                </Text>
                {!isUnlocked && (
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { width: `${(progress / total) * 100}%` }]} />
                    </View>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
};

const SampleBadges: React.FC = () => {
    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Sample Badges</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Emoji Badges</Text>
                <View style={styles.badgeRow}>
                    <Badge
                        name="Early Riser"
                        icon="sun"
                        iconType="emoji"
                        emoji="🌅"
                        isUnlocked={true}
                    />
                    <Badge
                        name="Night Owl"
                        icon="moon"
                        iconType="emoji"
                        emoji="🌙"
                        isUnlocked={false}
                        progress={2}
                        total={3}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Material Icons</Text>
                <View style={styles.badgeRow}>
                    <Badge
                        name="Marathon Pro"
                        icon="run"
                        iconType="material"
                        isUnlocked={true}
                    />
                    <Badge
                        name="Strength King"
                        icon="dumbbell"
                        iconType="material"
                        isUnlocked={false}
                        progress={15}
                        total={20}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ionicons</Text>
                <View style={styles.badgeRow}>
                    <Badge
                        name="Team Spirit"
                        icon="people"
                        iconType="ionicon"
                        isUnlocked={true}
                    />
                    <Badge
                        name="Consistency"
                        icon="calendar"
                        iconType="ionicon"
                        isUnlocked={false}
                        progress={5}
                        total={7}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>FontAwesome Icons</Text>
                <View style={styles.badgeRow}>
                    <Badge
                        name="Swimming Pro"
                        icon="swimming-pool"
                        iconType="fontawesome"
                        isUnlocked={true}
                    />
                    <Badge
                        name="Yoga Master"
                        icon="pray"
                        iconType="fontawesome"
                        isUnlocked={false}
                        progress={8}
                        total={10}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Special Badges</Text>
                <View style={styles.badgeRow}>
                    <Badge
                        name="VIP Member"
                        icon="crown"
                        iconType="fontawesome"
                        isUnlocked={true}
                        style={styles.vipBadge}
                    />
                    <Badge
                        name="Challenge Winner"
                        icon="trophy"
                        iconType="fontawesome"
                        isUnlocked={true}
                        style={styles.winnerBadge}
                    />
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        color: '#555',
    },
    badgeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    badgeContainer: {
        width: BADGE_SIZE,
        marginBottom: 16,
    },
    badge: {
        aspectRatio: 1,
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    emojiIcon: {
        fontSize: 50,
        marginBottom: 8,
    },
    badgeName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#000',
        textAlign: 'center',
    },
    badgeNameLocked: {
        color: '#666',
    },
    progressContainer: {
        width: '100%',
        height: 3,
        backgroundColor: '#E0E0E0',
        borderRadius: 1.5,
        marginTop: 8,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#C41E3A',
        borderRadius: 1.5,
    },
    vipBadge: {
        transform: [{ scale: 1.1 }],
    },
    winnerBadge: {
        transform: [{ scale: 1.1 }],
    },
});

export default SampleBadges; 