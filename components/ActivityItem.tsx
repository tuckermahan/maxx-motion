import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface ActivityItemProps {
    type: string;
    date: string;
    duration: number;
    source: string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ type, date, duration, source }) => {
    const getActivityColor = (activityType: string): string => {
        switch (activityType.toLowerCase()) {
            case 'running':
                return '#4CAF50';
            case 'yoga':
                return '#FFA726';
            case 'weight training':
                return '#AB47BC';
            default:
                return '#2196F3';
        }
    };

    const getInitial = (activityType: string): string => {
        return activityType.charAt(0).toUpperCase();
    };

    return (
        <ThemedView style={styles.container}>
            <View style={[styles.iconContainer, { backgroundColor: getActivityColor(type) }]}>
                <ThemedText style={styles.initial}>{getInitial(type)}</ThemedText>
            </View>
            <View style={styles.content}>
                <ThemedText style={styles.type}>{type}</ThemedText>
                <ThemedText style={styles.details}>{date} • {duration} minutes</ThemedText>
            </View>
            <ThemedText style={styles.source}>{source}</ThemedText>
        </ThemedView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    initial: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    type: {
        fontSize: 16,
        fontWeight: '500',
    },
    details: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    source: {
        fontSize: 14,
        color: '#666',
    },
});

export default ActivityItem; 