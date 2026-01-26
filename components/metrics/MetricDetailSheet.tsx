import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import AppBottomSheet from '@/components/AppBottomSheet';
import * as PhosphorIcons from 'phosphor-react-native';

interface MetricDetailSheetProps {
    visible: boolean;
    onClose: () => void;
    metricName: string | null;
    metricDetails: any; // Usamos any para flexibilizar con SHARED_METRIC_DETAILS
}

export default function MetricDetailSheet({
    visible,
    onClose,
    metricName,
    metricDetails
}: MetricDetailSheetProps) {
    const selectedMetric = metricName && metricDetails[metricName];
    const Icon = selectedMetric ? (PhosphorIcons as any)[selectedMetric.iconName] || PhosphorIcons.TrendUp : null;

    return (
        <AppBottomSheet
            visible={visible}
            onClose={onClose}
            title={metricName || "Métrica"}
            index={1}
            snapPoints={['35%', '45%']}
        >
            {selectedMetric && (
                <View style={styles.detailContent}>
                    <View style={styles.detailHeader}>
                        <View style={[styles.detailIconContainer, { backgroundColor: `${selectedMetric.color}15` }]}>
                            {Icon && <Icon size={32} color={selectedMetric.color} weight="duotone" />}
                        </View>
                        <View style={{ flex: 1, flexDirection: 'column' }}>
                            <Text variant="titleMedium" style={{ fontWeight: '800', color: '#1E3932' }}>
                                ¿Qué es esta métrica?
                            </Text>
                            <Text variant="bodySmall" style={{ color: '#64748B' }}>
                                Entiende mejor tus números
                            </Text>
                        </View>
                    </View>

                    <Text variant="bodyLarge" style={styles.detailDescription}>
                        {selectedMetric.description}
                    </Text>

                    <Divider style={styles.detailDivider} />

                    <View style={styles.formulaContainer}>
                        <Text variant="labelLarge" style={styles.formulaLabel}>Cálculo:</Text>
                        <View style={styles.formulaBadge}>
                            <Text style={styles.formulaText}>{selectedMetric.formula}</Text>
                        </View>
                    </View>
                </View>
            )}
        </AppBottomSheet>
    );
}

const styles = StyleSheet.create({
    detailContent: {
        padding: 4,
    },
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 20,
    },
    detailIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailDescription: {
        color: '#475569',
        lineHeight: 24,
        fontSize: 16,
    },
    detailDivider: {
        marginVertical: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    formulaContainer: {
        gap: 12,
    },
    formulaLabel: {
        color: '#1E3932',
        fontWeight: '800',
    },
    formulaBadge: {
        backgroundColor: '#F1F5F9',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    formulaText: {
        fontFamily: 'monospace',
        fontSize: 13,
        color: '#475569',
    },
});
