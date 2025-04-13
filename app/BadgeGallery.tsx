import React from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar } from 'react-native';
import SampleBadges from '../components/SampleBadges';

export default function BadgeGallery() {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.content}>
                <SampleBadges />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
    },
}); 