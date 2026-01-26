import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Button, ActivityIndicator, useTheme, Chip } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { User, Phone, Clock, CurrencyDollar as DollarSign, Trash } from 'phosphor-react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

import { useAuth } from '@clerk/clerk-expo';

export default function DetallePedidoWeb() {
    const { userId } = useAuth();
    const theme = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams();

    // 1. Obtener ID del Comercio
    const comercio = useQuery(api.comercios.getByUserId, userId ? { userId } : "skip");

    const pedidoId = id as Id<"pedidos">;

    // Convex Hooks
    const pedidos = useQuery(api.pedidos.list, comercio ? { comercio_id: comercio._id } : "skip");
    const pedido = pedidos?.find(p => p._id === pedidoId);

    const updateStatus = useMutation(api.pedidos.updateStatus);
    const removePedido = useMutation(api.pedidos.remove);
    const sendMensaje = useMutation(api.mensajes.send);

    const [updating, setUpdating] = useState(false);

    const loading = pedidos === undefined;

    const actualizarEstado = async (nuevoEstado: string) => {
        if (!pedido) return;
        setUpdating(true);
        try {
            await updateStatus({ id: pedidoId, estado: nuevoEstado });

            if (pedido.cliente_id && (nuevoEstado === 'preparado' || nuevoEstado === 'entregado')) {
                const mensajes: Record<string, string> = {
                    preparado: "¡Tu pedido está listo! 🍔 Pronto lo recibirás.",
                    entregado: "¡Pedido entregado! Gracias por tu preferencia. 😊🍟"
                };
                const texto = mensajes[nuevoEstado];
                if (texto) {
                    await sendMensaje({
                        cliente_id: pedido.cliente_id,
                        comercio_id: pedido.comercio_id,
                        contenido: texto,
                        es_ia: true,
                        es_dueno: true,
                    });
                }
            }
        } catch (err: any) {
            Alert.alert('Error', err.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleEliminar = async () => {
        if (!pedido) return;
        try {
            await removePedido({ id: pedidoId });
            router.push('/pedidos');
        } catch (err: any) {
            Alert.alert('Error', err.message);
        }
    };

    const formatearFecha = (ms: number) => {
        const d = new Date(ms);
        return `${d.getDate()}/${d.getMonth() + 1} - ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'pendiente': return '#F59E0B';
            case 'preparado': return '#3B82F6';
            case 'entregado': return '#10B981';
            case 'cancelado': return '#EF4444';
            default: return theme.colors.outline;
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ marginTop: 12 }}>Cargando pedido...</Text>
            </View>
        );
    }

    if (!pedido) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={{ color: theme.colors.error }}>Pedido no encontrado</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
                <View style={styles.headerSection}>
                    <Chip mode="flat" style={[styles.estadoChip, { backgroundColor: getEstadoColor(pedido.estado) }]} textStyle={styles.estadoChipText}>
                        {pedido.estado.toUpperCase()}
                    </Chip>
                    <View style={styles.fechaRow}>
                        <Clock size={16} color={theme.colors.outline} />
                        <Text style={{ color: theme.colors.outline }}>{formatearFecha(pedido._creationTime)}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Cliente</Text>
                    <View style={styles.infoRow}><User size={18} /><Text>{pedido.cliente_nombre || 'Cliente'}</Text></View>
                    <View style={styles.infoRow}><Phone size={18} /><Text>{pedido.cliente_telefono || ''}</Text></View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Detalles</Text>
                    <Text>{typeof pedido.resumen_pedido === 'string' ? pedido.resumen_pedido : 'Ver detalles en chat'}</Text>
                </View>

                <View style={styles.totalSection}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>${pedido.total.toFixed(2)}</Text>
                </View>

                <View style={styles.actionsSection}>
                    <Text style={styles.sectionTitle}>Cambiar Estado</Text>
                    <View style={styles.estadoButtons}>
                        {['pendiente', 'preparado', 'entregado', 'cancelado'].map((est) => (
                            <Button key={est} mode={pedido.estado === est ? 'contained' : 'outlined'} onPress={() => actualizarEstado(est)} disabled={updating || pedido.estado === est} style={styles.estadoButton}>
                                {est}
                            </Button>
                        ))}
                    </View>
                </View>

                <Button mode="text" onPress={handleEliminar} textColor={theme.colors.error} icon={() => <Trash size={18} color={theme.colors.error} />}>
                    Eliminar Pedido
                </Button>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingBottom: 40 },
    content: { paddingTop: 94, paddingHorizontal: 20 },
    headerSection: { marginBottom: 24 },
    estadoChip: { alignSelf: 'flex-start' },
    estadoChipText: { color: '#FFFFFF', fontWeight: '800' },
    fechaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    section: { marginBottom: 24, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 16 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    totalSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 24 },
    totalLabel: { fontSize: 16, fontWeight: '700' },
    totalAmount: { fontSize: 24, fontWeight: '900' },
    actionsSection: { marginBottom: 24 },
    estadoButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    estadoButton: { flex: 1, minWidth: '45%' },
});
