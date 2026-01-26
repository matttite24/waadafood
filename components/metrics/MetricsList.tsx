import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, List, Avatar, useTheme } from 'react-native-paper';

interface MetricsListProps {
    title: string;
    data: any[];
    renderItem: (item: any, index: number) => React.ReactNode;
    emptyMessage?: string;
    emptyIcon?: React.ReactNode;
}

export default function MetricsList({
    title,
    data,
    renderItem,
    emptyMessage = "Sin datos disponibles",
    emptyIcon
}: MetricsListProps) {
    const theme = useTheme();

    return (
        <Surface elevation={0} style={styles.listSurface}>
            <View style={styles.listHeader}>
                <Text variant="titleMedium" style={styles.sectionTitle}>{title}</Text>
            </View>
            {data && data.length > 0 ? (
                data.map((item, idx) => (
                    <View key={idx}>
                        {renderItem(item, idx)}
                    </View>
                ))
            ) : (
                <View style={styles.emptyState}>
                    {emptyIcon}
                    <Text style={styles.emptyText}>{emptyMessage}</Text>
                </View>
            )}
        </Surface>
    );
}

const styles = StyleSheet.create({
    listSurface: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
        marginBottom: 10,
        padding: 10,
    },
    listHeader: {
        paddingHorizontal: 10,
        paddingTop: 10,
        paddingBottom: 4,
    },
    sectionTitle: {
        marginLeft: 0,
        color: '#1E3932',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: -0.5,
        opacity: 0.8,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        color: '#94A3B8',
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
    },
});
