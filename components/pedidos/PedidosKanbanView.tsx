import React from 'react';
import { View, StyleSheet, Platform, Alert } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import KanbanColumn from './KanbanColumn';

const COLUMNAS = [
    { estado: 'pendiente' as const, titulo: 'Pendiente', color: '#F59E0B', bgLight: '#FFFBEB' },
    { estado: 'preparado' as const, titulo: 'Preparado', color: '#3B82F6', bgLight: '#EFF6FF' },
    { estado: 'entregado' as const, titulo: 'Entregado', color: '#10B981', bgLight: '#F0FDF4' },
    { estado: 'cancelado' as const, titulo: 'Cancelado', color: '#EF4444', bgLight: '#FEF2F2' },
];

import { useAuth } from '@clerk/clerk-expo'; // Add this

export default function PedidosKanbanView({ searchQuery = '' }: { searchQuery?: string }) {
    const { userId } = useAuth();

    // 1. Get Commerce ID
    const comercio = useQuery(api.comercios.getByUserId, userId ? { userId } : "skip");

    // 2. Get Orders
    const pedidos = useQuery(api.pedidos.list, comercio ? { comercio_id: comercio._id } : "skip");

    const updateStatus = useMutation(api.pedidos.updateStatus);
    const removePedido = useMutation(api.pedidos.remove);

    const actualizarEstado = async (id: string, nuevoEstado: string) => {
        try {
            await updateStatus({ id: id as Id<"pedidos">, estado: nuevoEstado });
        } catch (err: any) {
            Alert.alert('Error', err.message);
        }
    };

    const handleEliminar = async (id: string) => {
        Alert.alert('Eliminar Pedido', '¿Estás seguro?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: () => removePedido({ id: id as Id<"pedidos"> }) }
        ]);
    };

    const filtrados = (pedidos || []).filter(p =>
        searchQuery ? (p.cliente_nombre?.toLowerCase().includes(searchQuery.toLowerCase()) || p._id.toLowerCase().includes(searchQuery.toLowerCase())) : true
    );
    const formatearFecha = (fecha: string) => {
        const d = new Date(fecha);
        return `${d.getDate()}/${d.getMonth() + 1} - ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    const parseDetalles = (resumen: any, detalles: any) => typeof resumen === 'string' ? resumen : 'Ver detalles';

    const generarDatosCliente = (pedido: any, index: number) => ({
        nombre: pedido.cliente_nombre || `Cliente #${index + 1}`,
        telefono: pedido.cliente_telefono || '',
        esSandbox: true
    });

    return (
        <View style={styles.container}>
            <View style={styles.kanbanBoard}>
                {COLUMNAS.map(col => (
                    <KanbanColumn
                        key={col.estado}
                        titulo={col.titulo}
                        pedidos={filtrados.filter(p => p.estado === col.estado).map(p => ({
                            ...p,
                            id: p._id,
                            estado: p.estado as "pendiente" | "preparado" | "entregado" | "cancelado",
                            created_at: new Date(p._creationTime).toISOString(),
                            cliente_nombre: p.cliente_nombre || 'Cliente',
                            cliente_telefono: p.cliente_telefono || ''
                        }))}
                        color={col.color}
                        bgLight={col.bgLight}
                        updatingId={null}
                        onActualizarEstado={actualizarEstado}
                        onEliminar={handleEliminar}
                        onPedidoPress={(id) => console.log('Press', id)}
                        formatearFecha={formatearFecha}
                        parseDetalles={parseDetalles}
                        generarDatosCliente={generarDatosCliente}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F0EB' },
    kanbanBoard: { flex: 1, flexDirection: 'row', paddingTop: 94, paddingHorizontal: 12, paddingBottom: 20 },
});
