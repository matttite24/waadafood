import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text } from 'react-native-paper';

interface NotificationBadgeProps {
    count: number;
    color?: string;
    size?: 'small' | 'medium' | 'large';
}

export default function NotificationBadge({
    count,
    color = '#DC2626',
    size = 'medium'
}: NotificationBadgeProps) {
    if (count === 0) return null;

    const sizeStyles = {
        small: { minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4 },
        medium: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6 },
        large: { minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 8 },
    };

    const textSizes = {
        small: 10,
        medium: 12,
        large: 14,
    };

    return (
        <View
            style={[
                styles.badge,
                sizeStyles[size],
                { backgroundColor: color }
            ]}
        >
            <Text
                style={[
                    styles.badgeText,
                    { fontSize: textSizes[size] }
                ]}
            >
                {count > 99 ? '99+' : count}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 5,
    },
    badgeText: {
        color: '#FFFFFF',
        fontWeight: '900',
        textAlign: 'center',
    },
});
