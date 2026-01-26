import React, { useState, useMemo } from 'react';
import { ScrollView, View, useWindowDimensions, Platform, StyleSheet, RefreshControl } from 'react-native';
import { Text, ActivityIndicator, useTheme } from 'react-native-paper';
import { Package, Calendar } from 'phosphor-react-native';
import GlassmorphicHeader from '@/components/GlassmorphicHeader';
import PedidoCard from '@/components/PedidoCard';
import AppBottomSheet from '@/components/AppBottomSheet';
import AppChip from '@/components/AppChip';
import { useQuery, useMutation } from 'convex/react';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useNotifications } from '@/hooks/useNotifications';

export default function PedidosScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024 && Platform.OS === 'web';

    if (isDesktop) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
                <Package size={64} color={theme.colors.primary} weight="regular" style={{ opacity: 0.1 }} />
                <Text variant="titleLarge" style={{ marginTop: 16, color: theme.colors.outline, fontWeight: '700' }}>Monitor de Pedidos Activo</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.outline, opacity: 0.6 }}>Los nuevos pedidos aparecerán en el panel izquierdo automáticamente.</Text>
            </View>
        );
    }

    const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendiente' | 'preparado' | 'entregado' | 'cancelado'>('pendiente');
    const [filtroFecha, setFiltroFecha] = useState<'todos' | 'hoy' | 'ayer' | 'ultimos7dias'>('todos');
    const [showFiltrosModal, setShowFiltrosModal] = useState(false);
    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { userId } = useAuth();

    // 1. Get Commerce ID
    const comercio = useQuery(api.comercios.getByUserId, userId ? { userId } : "skip");

    // 2. Get Orders (dependent on commerce)
    const pedidos = useQuery(api.pedidos.list, comercio ? { comercio_id: comercio._id } : "skip");

    // 3. Get notifications summary
    const { pedidosPendientes } = useNotifications({
        comercioId: comercio?._id,
        enableVibration: true
    });

    const updateStatus = useMutation(api.pedidos.updateStatus);
    const removePedido = useMutation(api.pedidos.remove);

    const abrirConversacion = (clienteId?: string) => {
        if (!clienteId) return;
        router.push({
            pathname: '/mensajes',
            params: { clienteId }
        });
    };

    const loading = pedidos === undefined || comercio === undefined;

    const actualizarEstado = async (id: string, nuevoEstado: string) => {
        try {
            await updateStatus({ id: id as Id<"pedidos">, estado: nuevoEstado });
        } catch (err: any) {
            console.error(err);
        }
    };

    const eliminarPedido = async (id: string, estadoActual: string) => {
        try {
            // Si ya está cancelado, eliminar definitivamente
            if (estadoActual === 'cancelado') {
                await removePedido({ id: id as Id<"pedidos"> });
            } else {
                // Si no está cancelado, cambiar estado a cancelado
                await updateStatus({ id: id as Id<"pedidos">, estado: 'cancelado' });
            }
        } catch (err: any) {
            console.error(err);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsRefreshing(false);
    };

    const pedidosFiltrados = useMemo(() => {
        if (!pedidos) return [];
        let f = pedidos;

        // Filtrar por estado
        if (filtroEstado !== 'todos') f = f.filter((p: any) => p.estado === filtroEstado);

        // Filtrar por fecha
        if (filtroFecha !== 'todos') {
            const ahora = new Date();
            const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
            const inicioAyer = new Date(inicioHoy);
            inicioAyer.setDate(inicioAyer.getDate() - 1);
            const inicioUltimos7Dias = new Date(inicioHoy);
            inicioUltimos7Dias.setDate(inicioUltimos7Dias.getDate() - 7);

            f = f.filter((p: any) => {
                const fechaPedido = new Date(p._creationTime);

                if (filtroFecha === 'hoy') {
                    return fechaPedido >= inicioHoy;
                } else if (filtroFecha === 'ayer') {
                    return fechaPedido >= inicioAyer && fechaPedido < inicioHoy;
                } else if (filtroFecha === 'ultimos7dias') {
                    return fechaPedido >= inicioUltimos7Dias;
                }
                return true;
            });
        }

        // Filtrar por búsqueda
        if (localSearchQuery) {
            const q = localSearchQuery.toLowerCase();
            f = f.filter((p: any) => p.cliente_nombre?.toLowerCase().includes(q) || p._id.toLowerCase().includes(q));
        }

        return f;
    }, [pedidos, filtroEstado, filtroFecha, localSearchQuery]);

    const headerTitle = useMemo(() => {
        const timeLabels: Record<string, string> = {
            hoy: 'de hoy',
            ayer: 'de ayer',
            ultimos7dias: 'en últimos 7 días',
            todos: ''
        };

        const statusLabels: Record<string, string> = {
            pendiente: 'pendientes',
            preparado: 'preparados',
            entregado: 'entregados',
            cancelado: 'cancelados',
            todos: ''
        };

        let base = 'Pedidos';
        if (filtroEstado !== 'todos' && statusLabels[filtroEstado]) {
            base = `Pedidos ${statusLabels[filtroEstado]}`;
        }

        const timePart = timeLabels[filtroFecha];
        if (timePart) {
            return `${base} ${timePart}`;
        }

        return base;
    }, [filtroEstado, filtroFecha]);

    return (
        <View style={{ flex: 1, backgroundColor: '#F2F0EB' }}>
            <GlassmorphicHeader
                title={headerTitle}
                icon={Calendar}
                onRightPress={() => setShowFiltrosModal(true)}
                searchable={true}
                searchQuery={localSearchQuery}
                onSearchChange={setLocalSearchQuery}
                badgeCount={filtroEstado === 'todos' || filtroEstado === 'pendiente' ? pedidosPendientes : undefined}
            />

            {loading ? (
                <View style={styles.loadingContainer}><ActivityIndicator size="small" color={theme.colors.primary} /></View>
            ) : (
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor="#00754A"
                            colors={['#00754A']}
                            progressViewOffset={80}
                        />
                    }
                >
                    <View style={{ paddingBottom: 16, marginHorizontal: -24 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}>
                            {['pendiente', 'preparado', 'entregado', 'cancelado', 'todos'].map((estado: any) => (
                                <AppChip key={estado} onPress={() => setFiltroEstado(estado)} selected={filtroEstado === estado}>
                                    {estado.charAt(0).toUpperCase() + estado.slice(1)}
                                </AppChip>
                            ))}
                        </ScrollView>
                    </View>

                    {pedidosFiltrados.length === 0 ? (
                        <View style={{ marginTop: 80, alignItems: 'center', opacity: 0.4 }}>
                            <Package size={48} weight="regular" /><Text>No hay pedidos</Text>
                        </View>
                    ) : (
                        <View style={{ gap: 16 }}>
                            {pedidosFiltrados.map((p: any, index: number) => (
                                <PedidoCard
                                    key={p._id}
                                    isUpdating={false}
                                    pedido={{ ...p, id: p._id, created_at: new Date(p._creationTime).toISOString() }}
                                    datosCliente={{ nombre: p.cliente_nombre || 'Cliente', telefono: p.cliente_telefono || '', esSandbox: false }}
                                    onActualizarEstado={actualizarEstado}
                                    onEliminar={(id) => eliminarPedido(id, p.estado)}
                                    onPress={() => abrirConversacion(p.cliente_id)}
                                    formatearFecha={(f: string) => {
                                        const date = new Date(f);
                                        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                                        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

                                        const diaNombre = dias[date.getDay()];
                                        const diaNum = date.getDate().toString().padStart(2, '0');
                                        const mesNombre = meses[date.getMonth()];

                                        const hora = date.toLocaleTimeString('es-CO', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true
                                        }).toUpperCase();

                                        return `${diaNombre}, ${diaNum} - ${mesNombre} - ${hora}`;
                                    }}
                                    parseDetalles={(r: any, d: any) => {
                                        if (Array.isArray(d)) {
                                            return d.map((i: any) => {
                                                const cant = i.cantidad || 1;
                                                const precio = i.precio || 0;
                                                const total = cant * precio;
                                                const totalFormatted = new Intl.NumberFormat('es-CO', {
                                                    style: 'currency',
                                                    currency: 'COP',
                                                    maximumFractionDigits: 0
                                                }).format(total);
                                                return `${cant} ${i.nombre}: ${totalFormatted}`;
                                            }).join("\n");
                                        }
                                        if (typeof r === 'string' && r) return r;
                                        return 'Ver detalles';
                                    }}
                                />
                            ))}
                        </View>
                    )}
                </ScrollView>
            )}

            <AppBottomSheet
                visible={showFiltrosModal}
                onClose={() => setShowFiltrosModal(false)}
                title="Filtros"
                snapPoints={['45%']}
                index={0}
            >
                <View style={{ gap: 16, paddingBottom: 32 }}>
                    <Text variant="titleSmall" style={{ fontWeight: '600', marginBottom: 8 }}>Rango de tiempo</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        <AppChip
                            onPress={() => {
                                setFiltroFecha('todos');
                                setShowFiltrosModal(false);
                            }}
                            selected={filtroFecha === 'todos'}
                        >
                            Todos
                        </AppChip>
                        <AppChip
                            onPress={() => {
                                setFiltroFecha('hoy');
                                setShowFiltrosModal(false);
                            }}
                            selected={filtroFecha === 'hoy'}
                        >
                            Hoy
                        </AppChip>
                        <AppChip
                            onPress={() => {
                                setFiltroFecha('ayer');
                                setShowFiltrosModal(false);
                            }}
                            selected={filtroFecha === 'ayer'}
                        >
                            Ayer
                        </AppChip>
                        <AppChip
                            onPress={() => {
                                setFiltroFecha('ultimos7dias');
                                setShowFiltrosModal(false);
                            }}
                            selected={filtroFecha === 'ultimos7dias'}
                        >
                            Últimos 7 días
                        </AppChip>
                    </View>
                </View>
            </AppBottomSheet>
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: { marginTop: 110, alignItems: 'center' },
    listContent: { paddingTop: 85, paddingHorizontal: 24, paddingBottom: 128 },
});
