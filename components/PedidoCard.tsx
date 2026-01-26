import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Avatar } from 'react-native-paper';
import { Trash, CaretRight, Hash } from 'phosphor-react-native';

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

interface PedidoCardProps {
    pedido: Pedido;
    datosCliente: DatosCliente;
    isUpdating: boolean;
    onActualizarEstado: (id: string, nuevoEstado: string) => void;
    onEliminar: (id: string) => void;
    formatearFecha: (fecha: string) => string;
    parseDetalles: (resumen: any, detalles: any) => string;
    onPress?: () => void;
}

const getStatusConfig = (estado: string) => {
    switch (estado) {
        case 'pendiente': return { label: 'Pendiente', color: '#854d0e', bg: '#fefce8', dot: '#eab308', cardBg: '#fffbeb' };
        case 'preparado': return { label: 'Preparado', color: '#1e40af', bg: '#eff6ff', dot: '#3182ce', cardBg: '#f0f7ff' };
        case 'entregado': return { label: 'Entregado', color: '#166534', bg: '#f0fdf4', dot: '#22c55e', cardBg: '#f2fdf5' };
        case 'cancelado': return { label: 'Cancelado', color: '#991b1b', bg: '#fef2f2', dot: '#ef4444', cardBg: '#fff5f5' };
        default: return { label: estado, color: '#475569', bg: '#f1f5f9', dot: '#94a3b8', cardBg: '#ffffff' };
    }
};

const PedidoCard = ({
    pedido,
    datosCliente,
    isUpdating,
    onActualizarEstado,
    onEliminar,
    formatearFecha,
    parseDetalles,
    onPress
}: PedidoCardProps) => {
    const cfg = getStatusConfig(pedido.estado);
    const initials = datosCliente.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const CardContent = (
        <View style={[styles.card, { backgroundColor: cfg.cardBg }]}>
            <View style={styles.cardContent}>
                {/* Top Row: Fecha + Chevron */}
                <View style={styles.headerRow}>
                    <Text style={styles.fechaText}>{formatearFecha(pedido.created_at)}</Text>
                    <CaretRight size={16} color="#94A3B8" />
                </View>

                {/* Main Content */}
                <View style={styles.mainRow}>
                    <View style={styles.leftCol}>
                        <View style={styles.idPill}>
                            <Hash size={10} color="#64748B" style={{ marginRight: 2 }} />
                            <Text style={styles.idText}>ID : {pedido.id.slice(0, 8)}</Text>
                        </View>

                        <View style={styles.detailsContainer}>
                            <Text style={styles.detailsText}>
                                {parseDetalles(pedido.resumen_pedido, pedido.detalles)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.rightCol}>
                        <View style={styles.amountContainer}>
                            <Text style={styles.currencyText}>$ </Text>
                            <Text style={styles.amountText}>{pedido.total.toFixed(2)}</Text>
                        </View>

                        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                            <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
                            <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                    </View>
                </View>

                {/* Footer: Cliente + Acciones */}
                <View style={styles.footerRow}>
                    <View style={styles.clientInfo}>
                        <Avatar.Text size={18} label={initials} style={styles.avatar} labelStyle={styles.avatarLabel} />
                        <Text style={styles.clientName} numberOfLines={1}>
                            {datosCliente.nombre}
                        </Text>
                    </View>

                    <View style={styles.actionButtons}>
                        {pedido.estado === 'pendiente' && (
                            <TouchableOpacity
                                onPress={() => onActualizarEstado(pedido.id, 'preparado')}
                                disabled={isUpdating}
                                style={[styles.actionBtn, { backgroundColor: '#2563eb' }]}
                            >
                                <Text style={styles.actionLabel}>Preparar</Text>
                            </TouchableOpacity>
                        )}
                        {pedido.estado === 'preparado' && (
                            <TouchableOpacity
                                onPress={() => onActualizarEstado(pedido.id, 'entregado')}
                                disabled={isUpdating}
                                style={[styles.actionBtn, { backgroundColor: '#059669' }]}
                            >
                                <Text style={styles.actionLabel}>Entregar</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={() => onEliminar(pedido.id)}
                            style={[
                                styles.deleteBtn,
                                pedido.estado === 'cancelado' && { backgroundColor: 'rgba(239, 68, 68, 0.15)' }
                            ]}
                        >
                            <Trash
                                size={16}
                                color="#ef4444"
                                style={{ opacity: pedido.estado === 'cancelado' ? 1 : 0.6 }}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                {CardContent}
            </TouchableOpacity>
        );
    }

    return CardContent;
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 24,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    cardContent: {
        padding: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    fechaText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
    },
    mainRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    leftCol: {
        flex: 1,
        marginRight: 10,
    },
    idPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.06)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    idText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
    },
    detailsContainer: {
        marginTop: 2,
    },
    detailsText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        lineHeight: 20,
    },
    rightCol: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    currencyText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
    },
    amountText: {
        fontSize: 26,
        fontWeight: '900',
        color: '#0f172a',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusLabel: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.08)',
    },
    clientInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    avatar: {
        backgroundColor: 'rgba(0,0,0,0.08)',
    },
    avatarLabel: {
        fontSize: 10,
        color: '#475569',
        fontWeight: '800',
    },
    clientName: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    actionBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',

    },
    deleteBtn: {
        padding: 6,
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderRadius: 8,
    }
});

export default PedidoCard;
