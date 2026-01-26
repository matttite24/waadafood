import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import PedidoCard from '@/components/PedidoCard';

interface Pedido {
    id: string;
    comercio_id: string;
    cliente_id?: string;
    estado: 'pendiente' | 'preparado' | 'entregado' | 'cancelado';
    total: number;
    resumen_pedido?: string | { resumen?: string;[key: string]: any };
    detalles?: any;
    created_at: string;
    updated_at?: string;
    cliente_nombre?: string;
    cliente_telefono?: string;
}

interface DatosCliente {
    nombre: string;
    telefono: string;
    esSandbox: boolean;
}

interface KanbanColumnProps {
    titulo: string;
    color: string;
    bgLight: string;
    pedidos: Pedido[];
    updatingId: string | null;
    onActualizarEstado: (id: string, nuevoEstado: string) => void;
    onEliminar: (id: string) => void;
    onPedidoPress: (id: string) => void;
    formatearFecha: (fecha: string) => string;
    parseDetalles: (resumen: any, detalles: any) => string;
    generarDatosCliente: (pedido: Pedido, index: number) => DatosCliente;
}

export default function KanbanColumn({
    titulo,
    color,
    bgLight,
    pedidos,
    updatingId,
    onActualizarEstado,
    onEliminar,
    onPedidoPress,
    formatearFecha,
    parseDetalles,
    generarDatosCliente
}: KanbanColumnProps) {
    return (
        <View style={styles.column}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={[styles.colorDot, { backgroundColor: color }]} />
                    <Text style={[styles.titulo, { color }]}>{titulo}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: color }]}>
                    <Text style={styles.badgeText}>{pedidos.length}</Text>
                </View>
            </View>

            {/* Lista de Pedidos */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {pedidos.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyText, { color }]}>
                            Sin pedidos
                        </Text>
                    </View>
                ) : (
                    pedidos.map((pedido, index) => (
                        <PedidoCard
                            key={pedido.id}
                            pedido={pedido}
                            datosCliente={generarDatosCliente(pedido, index)}
                            isUpdating={updatingId === pedido.id}
                            onActualizarEstado={onActualizarEstado}
                            onEliminar={onEliminar}
                            formatearFecha={formatearFecha}
                            parseDetalles={parseDetalles}
                            onPress={() => onPedidoPress(pedido.id)}
                        />
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    column: {
        flex: 1,
        marginHorizontal: 6,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginBottom: 12,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    colorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    titulo: {
        fontSize: 14,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    badge: {
        minWidth: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '900',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 6,
        paddingBottom: 24,
    },
    emptyState: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 13,
        fontWeight: '600',
        opacity: 0.5,
    },
});
