import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

interface BlurViewWrapperProps {
    children: React.ReactNode;
    style?: ViewStyle;
    intensity?: number;
    tint?: 'light' | 'dark' | 'default';
}

export default function BlurViewWrapper({
    children,
    style,
    intensity = 30,
    tint = 'light'
}: BlurViewWrapperProps) {
    if (Platform.OS === 'web') {
        return (
            <View style={[styles.webBlur, style]}>
                {children}
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
    webBlur: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        // @ts-ignore
        backdropFilter: 'blur(20px)',
        overflow: 'hidden',
    },
});
