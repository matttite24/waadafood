import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';

interface MetricCardProps {
    title: string;
    value: string;
    icon: any;
    color: string;
    onPress: () => void;
}

export default function MetricCard({ title, value, icon, color, onPress }: MetricCardProps) {
    const Icon = icon;

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.cardRow}>
                <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
                    <Icon size={17} color={color} weight="duotone" />
                </View>
                <View style={styles.cardContent}>
                    <Text variant="labelSmall" style={styles.cardTitle}>{title}</Text>
                    <Text variant="titleLarge" style={[styles.cardValue, { color }]}>{value}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        width: '48%',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.06)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 3,
        elevation: 1,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    iconContainer: {
        width: 42,
        height: 42,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        flex: 1,
        gap: 0,
    },
    cardTitle: {
        color: 'rgba(30, 57, 50, 0.6)',
        fontWeight: '600',
        fontSize: 11,
        letterSpacing: 0,
    },
    cardValue: {
        fontWeight: '800',
        fontSize: 18,
        letterSpacing: -0.5,
    },
});
