import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Divider, Button } from 'react-native-paper';
import AppBottomSheet from '@/components/AppBottomSheet';
import { Clock, User, CurrencyDollar as DollarSign } from 'phosphor-react-native';
import { formatCurrency, formatRelativeTime } from '@/shared/utils/formatters';

interface IncompleteSaleDetailProps {
    visible: boolean;
    onClose: () => void;
    sale: any;
}

export default function IncompleteSaleDetail({
    visible,
    onClose,
    sale,
}: IncompleteSaleDetailProps) {
    if (!sale) return null;

    return (
        <AppBottomSheet
            visible={visible}
            onClose={onClose}
            title="Venta Incompleta"
            index={1}
            snapPoints={['50%', '75%']}
        >
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.container}>
                    {/* Cliente Info */}
                    <View style={styles.infoSection}>
                        <View style={styles.infoRow}>
                            <User size={18} color="#64748B" />
                            <Text variant="bodyMedium" style={styles.infoText}>
                                {sale.cliente_nombre || "Cliente Anónimo"}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Clock size={18} color="#64748B" />
                            <Text variant="bodyMedium" style={styles.infoText}>
                                {formatRelativeTime(sale._creationTime)}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <DollarSign size={18} color="#00754A" />
                            <Text variant="bodyMedium" style={[styles.infoText, { color: '#00754A', fontWeight: '700' }]}>
                                {formatCurrency(sale.total)}
                            </Text>
                        </View>
                    </View>

                    <Divider style={styles.divider} />

                    {/* Resumen del pedido */}
                    <View style={styles.section}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>Resumen del pedido</Text>
                        <Text variant="bodyMedium" style={styles.resumen}>
                            {sale.resumen_pedido || "Sin resumen disponible"}
                        </Text>
                    </View>

                    {/* Detalles de productos */}
                    {sale.detalles && Array.isArray(sale.detalles) && sale.detalles.length > 0 && (
                        <>
                            <Divider style={styles.divider} />
                            <View style={styles.section}>
                                <Text variant="titleMedium" style={styles.sectionTitle}>Productos en el carrito</Text>
                                {sale.detalles.map((item: any, idx: number) => (
                                    <View key={idx} style={styles.productItem}>
                                        <View style={styles.productInfo}>
                                            <Text variant="bodyMedium" style={styles.productName}>
                                                {item.cantidad}x {item.nombre}
                                            </Text>
                                            {item.notas && (
                                                <Text variant="bodySmall" style={styles.productNotes}>
                                                    {item.notas}
                                                </Text>
                                            )}
                                        </View>
                                        <Text variant="bodyMedium" style={styles.productPrice}>
                                            {formatCurrency((item.precio || 0) * (item.cantidad || 1))}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    {/* Dirección de entrega */}
                    {sale.direccion_entrega && (
                        <>
                            <Divider style={styles.divider} />
                            <View style={styles.section}>
                                <Text variant="titleMedium" style={styles.sectionTitle}>Dirección de entrega</Text>
                                <Text variant="bodyMedium" style={styles.address}>
                                    {sale.direccion_entrega}
                                </Text>
                            </View>
                        </>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                        <Button
                            mode="outlined"
                            onPress={onClose}
                            style={styles.button}
                            textColor="#64748B"
                        >
                            Cerrar
                        </Button>
                        <Button
                            mode="contained"
                            onPress={() => {
                                // TODO: Implementar envío de recordatorio
                                console.log('Enviar recordatorio a:', sale.cliente_nombre);
                            }}
                            style={[styles.button, { backgroundColor: '#00754A' }]}
                            icon="send"
                        >
                            Enviar Recordatorio
                        </Button>
                    </View>
                </View>
            </ScrollView>
        </AppBottomSheet>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 4,
        paddingBottom: 40,
    },
    infoSection: {
        gap: 12,
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoText: {
        color: '#475569',
        fontSize: 15,
    },
    divider: {
        marginVertical: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    section: {
        gap: 12,
    },
    sectionTitle: {
        color: '#1E3932',
        fontWeight: '800',
        fontSize: 16,
    },
    resumen: {
        color: '#475569',
        lineHeight: 22,
    },
    productItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    productInfo: {
        flex: 1,
        gap: 4,
    },
    productName: {
        color: '#1E3932',
        fontWeight: '600',
    },
    productNotes: {
        color: '#64748B',
        fontStyle: 'italic',
    },
    productPrice: {
        color: '#00754A',
        fontWeight: '700',
    },
    address: {
        color: '#475569',
        lineHeight: 22,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    button: {
        flex: 1,
    },
});
