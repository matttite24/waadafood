import React, { useState, useMemo } from 'react';
import { ScrollView, Alert, RefreshControl, View, TouchableOpacity, Platform, useWindowDimensions, StyleSheet } from 'react-native';
import { Text, ActivityIndicator, useTheme } from 'react-native-paper';
import { Package, Calendar } from 'phosphor-react-native';
import GlassmorphicHeader from '@/components/GlassmorphicHeader';
import PedidoCard from '@/components/PedidoCard';
import AppBottomSheet from '@/components/AppBottomSheet';
import AppChip from '@/components/AppChip';
import { useQuery, useMutation } from 'convex/react';
import { useAuth } from '@clerk/clerk-expo';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

export default function PedidosList({ searchQuery }: { searchQuery?: string }) {
    const theme = useTheme();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024 && Platform.OS === 'web';

    const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendiente' | 'preparado' | 'entregado' | 'cancelado'>('todos');
    const [showFiltrosModal, setShowFiltrosModal] = useState(false);

    const { userId } = useAuth();

    // 1. Get Commerce ID
    const comercio = useQuery(api.comercios.getByUserId, userId ? { userId } : "skip");

    // 2. Get Orders
    const pedidos = useQuery(api.pedidos.list, comercio ? { comercio_id: comercio._id } : "skip");

    const updateStatus = useMutation(api.pedidos.updateStatus);
    const removePedido = useMutation(api.pedidos.remove);
    const sendMensaje = useMutation(api.mensajes.send);

    const loading = pedidos === undefined || comercio === undefined;

    const actualizarEstado = async (id: string, nuevoEstado: string) => {
        if (!comercio) return;
        try {
            const pedidoId = id as Id<"pedidos">;
            await updateStatus({ id: pedidoId, estado: nuevoEstado });

            const pedido = pedidos?.find((p: any) => p._id === pedidoId);
            if (pedido?.cliente_id && (nuevoEstado === 'preparado' || nuevoEstado === 'entregado')) {
                const mensajes: Record<string, string> = {
                    preparado: "¡Tu pedido está listo! 🍔 Pronto lo recibirás.",
                    entregado: "¡Pedido entregado! Gracias por tu preferencia. 😊🍟"
                };
                const texto = mensajes[nuevoEstado];
                if (texto) {
                    await sendMensaje({
                        cliente_id: pedido.cliente_id,
                        comercio_id: comercio._id,
                        contenido: texto,
                        es_ia: true,
                        es_dueno: true,
                    });
                }
            }
        } catch (err: any) {
            Alert.alert('Error', err.message);
        }
    };

    const eliminarPedido = async (id: string) => {
        Alert.alert('Eliminar Pedido', '¿Estás seguro?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: () => removePedido({ id: id as Id<"pedidos"> }) }
        ]);
    };

    const pedidosFiltrados = useMemo(() => {
        if (!pedidos) return [];
        let f = pedidos;
        if (filtroEstado !== 'todos') f = f.filter((p: any) => p.estado === filtroEstado);
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            f = f.filter((p: any) => p.cliente_nombre?.toLowerCase().includes(q) || p._id.toLowerCase().includes(q));
        }
        return f;
    }, [pedidos, filtroEstado, searchQuery]);

    const formatearFecha = (ms: number) => {
        const d = new Date(ms);
        return `${d.getDate()}/${d.getMonth() + 1} - ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <GlassmorphicHeader title="Pedidos" icon={Calendar} onRightPress={() => setShowFiltrosModal(true)} />

            {loading ? (
                <View style={styles.loadingContainer}><ActivityIndicator size="small" color={theme.colors.primary} /></View>
            ) : (
                <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.listContent}>
                    <View style={{ paddingBottom: 16 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}>
                            {['todos', 'pendiente', 'preparado', 'entregado'].map((estado: any) => (
                                <AppChip key={estado} selected={filtroEstado === estado} onPress={() => setFiltroEstado(estado)}>{estado.charAt(0).toUpperCase() + estado.slice(1)}</AppChip>
                            ))}
                        </ScrollView>
                    </View>

                    {pedidosFiltrados.length === 0 ? (
                        <View style={{ alignItems: 'center', marginTop: 60, opacity: 0.5 }}><Package size={48} weight="regular" /><Text>Sin pedidos</Text></View>
                    ) : (
                        <View style={{ gap: 16 }}>
                            {pedidosFiltrados.map((p: any, index: number) => (
                                <PedidoCard
                                    key={p._id}
                                    isUpdating={false}
                                    pedido={{ ...p, id: p._id, created_at: new Date(p._creationTime).toISOString() }}
                                    datosCliente={{ nombre: p.cliente_nombre || `Cliente #${index + 1}`, telefono: p.cliente_telefono || '', esSandbox: false }}
                                    onActualizarEstado={actualizarEstado}
                                    onEliminar={eliminarPedido}
                                    formatearFecha={() => formatearFecha(p._creationTime)}
                                    parseDetalles={(r: any, d: any) => {
                                        if (typeof r === 'string' && r) return r;
                                        if (Array.isArray(d)) return d.map((i: any) => `${i.cantidad || 1}x ${i.nombre}`).join(", ");
                                        return 'Ver detalles';
                                    }}
                                />
                            ))}
                        </View>
                    )}
                </ScrollView>
            )}

            <AppBottomSheet visible={showFiltrosModal} onClose={() => setShowFiltrosModal(false)} title="Filtrar">
                <View style={{ paddingBottom: 24, gap: 12 }}>
                    {['todos', 'hoy', 'ayer'].map((f: any) => (
                        <TouchableOpacity key={f} onPress={() => setShowFiltrosModal(false)} style={{ padding: 16, backgroundColor: theme.colors.surfaceVariant, borderRadius: 12 }}>
                            <Text style={{ fontWeight: '700' }}>{f.toUpperCase()}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </AppBottomSheet>
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: { marginTop: 110, alignItems: 'center' },
    listContent: { paddingTop: 85, paddingBottom: 100 },
});
