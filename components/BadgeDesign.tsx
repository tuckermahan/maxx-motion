import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { SvgUri } from 'react-native-svg';

const BADGE_SIZE = (Dimensions.get('window').width - 48) / 3;

interface BadgeProps {
    name: string;
    icon: string;
    iconType: 'fontawesome' | 'material' | 'ionicon' | 'emoji' | 'svg';
    emoji?: string;
    isUnlocked: boolean;
    progress?: number;
    total?: number;
    onPress: () => void;
}

export const BadgeDesign: React.FC<BadgeProps> = ({
    name,
    icon,
    iconType,
    emoji,
    isUnlocked,
    progress = 0,
    total = 1,
    onPress,
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
        } else if (iconType === 'svg') {
            return (
                <SvgUri
                    width="40"
                    height="40"
                    uri={icon}
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
        <TouchableOpacity style={styles.badgeContainer} onPress={onPress} activeOpacity={0.7}>
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

const styles = StyleSheet.create({
    badgeContainer: {
        width: BADGE_SIZE,
        padding: 8,
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
}); 