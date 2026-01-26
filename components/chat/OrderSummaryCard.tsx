import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import { Trash, Plus, Minus } from 'phosphor-react-native';

interface OrderItem {
    nombre: string;
    cantidad: number;
    precio: number;
}

interface OrderData {
    items: OrderItem[];
    total: number;
}

interface OrderSummaryCardProps {
    orderData: OrderData;
    onUpdateQuantity?: (itemIndex: number, newQuantity: number) => void;
    onRemoveItem?: (itemIndex: number) => void;
}

const OrderSummaryCard = ({ orderData, onUpdateQuantity, onRemoveItem }: OrderSummaryCardProps) => {
    if (!orderData || orderData.items.length === 0) return null;

    return (
        <Surface style={styles.container} elevation={1}>
            <View style={styles.header}>
                <Text style={styles.title}>Tu Pedido</Text>
            </View>

            <View style={styles.itemsList}>
                {orderData.items.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                        <View style={styles.itemInfo}>
                            <Text style={styles.itemName}>{item.nombre}</Text>
                            <Text style={styles.itemPrice}>${item.precio.toFixed(2)} c/u</Text>
                        </View>

                        <View style={styles.itemControls}>
                            {onUpdateQuantity && (
                                <View style={styles.quantityControls}>
                                    <IconButton
                                        icon={() => <Minus size={14} color="#64748b" />}
                                        size={20}
                                        onPress={() => {
                                            const newQty = Math.max(1, item.cantidad - 1);
                                            onUpdateQuantity(index, newQty);
                                        }}
                                        style={styles.controlButton}
                                    />
                                    <Text style={styles.quantity}>{item.cantidad}</Text>
                                    <IconButton
                                        icon={() => <Plus size={14} color="#00754A" />}
                                        size={20}
                                        onPress={() => onUpdateQuantity(index, item.cantidad + 1)}
                                        style={styles.controlButton}
                                    />
                                </View>
                            )}

                            {!onUpdateQuantity && (
                                <Text style={styles.quantityStatic}>x{item.cantidad}</Text>
                            )}

                            <Text style={styles.subtotal}>
                                ${(item.precio * item.cantidad).toFixed(2)}
                            </Text>

                            {onRemoveItem && (
                                <IconButton
                                    icon={() => <Trash size={16} color="#EF4444" />}
                                    size={20}
                                    onPress={() => onRemoveItem(index)}
                                    style={styles.deleteButton}
                                />
                            )}
                        </View>
                    </View>
                ))}
            </View>

            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>${orderData.total.toFixed(2)}</Text>
            </View>
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
        maxWidth: '100%',
    },
    header: {
        marginBottom: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E3932',
    },
    itemsList: {
        gap: 12,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E3932',
        marginBottom: 2,
    },
    itemPrice: {
        fontSize: 12,
        color: '#64748b',
    },
    itemControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        paddingHorizontal: 4,
    },
    controlButton: {
        margin: 0,
    },
    quantity: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E3932',
        minWidth: 20,
        textAlign: 'center',
    },
    quantityStatic: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        marginRight: 8,
    },
    subtotal: {
        fontSize: 14,
        fontWeight: '700',
        color: '#00754A',
        minWidth: 60,
        textAlign: 'right',
    },
    deleteButton: {
        margin: 0,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 2,
        borderTopColor: '#E2E8F0',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E3932',
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: '800',
        color: '#00754A',
    },
});

export default OrderSummaryCard;
