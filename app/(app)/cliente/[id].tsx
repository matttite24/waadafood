import React from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, useTheme, Avatar, List } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import GlassmorphicHeader from '@/components/GlassmorphicHeader';
import MetricCard from '@/components/metrics/MetricCard';
import { User, Receipt, CurrencyDollar as DollarSign, Calendar, CaretRight as ChevronRight, Phone, Tag } from 'phosphor-react-native';
import TagSelectionSheet from '@/components/chat/TagSelectionSheet';

export default function ClienteDetailScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [tagSheetVisible, setTagSheetVisible] = React.useState(false);

    const clienteData = useQuery(
        api.clientes.getClienteDetail,
        id ? { cliente_id: id as Id<"clientes"> } : "skip"
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(amount);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (!clienteData) {
        return (
            <View style={styles.container}>
                <GlassmorphicHeader
                    title="Detalle del Cliente"
                    icon={User}
                    onBack={() => router.back()}
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Cargando información...</Text>
                </View>
            </View>
        );
    }

    const { cliente, metrics, orders, etiquetas } = clienteData;

    return (
        <View style={styles.container}>
            <GlassmorphicHeader
                title="Detalle del Cliente"
                icon={User}
                onBack={() => router.back()}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Client Header */}
                <View style={styles.clientHeader}>
                    <Avatar.Text
                        size={90}
                        label={(cliente.nombre_usuario || "?").substring(0, 1).toUpperCase()}
                        style={{ backgroundColor: '#D4E9E2', marginBottom: 16 }}
                        color="#00754A"
                        labelStyle={{ fontSize: 36, fontWeight: '800' }}
                    />
                    <View style={styles.clientInfo}>
                        <Text variant="headlineSmall" style={styles.clientName}>
                            {cliente.nombre_usuario || "Cliente Anónimo"}
                        </Text>
                        <View style={styles.clientDetailsRow}>
                            <View style={styles.clientDetail}>
                                <Phone size={14} color="#64748B" />
                                <Text variant="bodyMedium" style={styles.clientPhone}>
                                    {cliente.telefono}
                                </Text>
                            </View>
                            <View style={styles.clientDetail}>
                                <Calendar size={14} color="#64748B" />
                                <Text variant="bodySmall" style={styles.clientDate}>
                                    Cliente desde {formatDate(cliente._creationTime)}
                                </Text>
                            </View>
                        </View>

                        {/* Tags Display */}
                        <View style={styles.tagsDisplay}>
                            <View style={styles.tagsList}>
                                {etiquetas.length > 0 ? (
                                    etiquetas.map(tag => (
                                        <View
                                            key={tag._id}
                                            style={[styles.tagBadge, { backgroundColor: `${tag.color}15`, borderColor: tag.color }]}
                                        >
                                            <Text style={[styles.tagBadgeText, { color: tag.color }]}>
                                                {tag.nombre}
                                            </Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.noTagsText}>Sin etiquetas</Text>
                                )}
                            </View>
                            <TouchableOpacity
                                style={styles.manageTagsBtn}
                                onPress={() => setTagSheetVisible(true)}
                            >
                                <Tag size={16} color="#8B5CF6" />
                                <Text style={styles.manageTagsText}>Etiquetar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Metrics */}
                <View style={styles.metricsSection}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Resumen de Compras</Text>
                    <View style={styles.metricsGrid}>
                        <MetricCard
                            title="Total de Pedidos"
                            value={metrics.totalOrders.toString()}
                            icon={Receipt}
                            color="#F59E0B"
                            onPress={() => { }}
                        />
                        <MetricCard
                            title="Valor Total"
                            value={formatCurrency(metrics.totalValue)}
                            icon={DollarSign}
                            color="#00754A"
                            onPress={() => { }}
                        />
                    </View>
                </View>

                {/* Order History */}
                <View style={styles.ordersSection}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Historial de Pedidos ({orders.length})
                    </Text>
                    {orders.length > 0 ? (
                        orders.map((order) => (
                            <List.Item
                                key={order._id}
                                title={`Pedido #${order._id.substring(0, 8)}`}
                                description={`${formatDate(order._creationTime)} - ${order.estado}`}
                                left={props => (
                                    <View style={styles.orderIcon}>
                                        <Receipt size={20} color="#00754A" />
                                    </View>
                                )}
                                right={props => (
                                    <View style={styles.orderRight}>
                                        <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
                                        <ChevronRight size={20} color="#64748B" />
                                    </View>
                                )}
                                onPress={() => router.push(`/pedidos?pedidoId=${order._id}`)}
                                style={styles.orderItem}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Receipt size={40} color={theme.colors.outline} style={{ opacity: 0.2 }} />
                            <Text style={styles.emptyText}>
                                Este cliente aún no ha realizado pedidos
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <TagSelectionSheet
                visible={tagSheetVisible}
                onClose={() => setTagSheetVisible(false)}
                clienteId={cliente._id}
                comercioId={cliente.comercio_id}
                initialTagIds={cliente.etiquetas_ids}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F0EB',
    },
    scrollContent: {
        paddingTop: 85,
        paddingBottom: 110,
        paddingHorizontal: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        color: '#64748B',
        fontWeight: '600',
    },
    clientHeader: {
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 28,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    clientInfo: {
        alignItems: 'center',
        width: '100%',
        gap: 12,
    },
    clientName: {
        color: '#1E3932',
        fontWeight: '900',
        fontSize: 24,
        textAlign: 'center',
    },
    clientDetailsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 4,
    },
    clientDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    clientPhone: {
        color: '#475569',
        fontWeight: '700',
        fontSize: 14,
    },
    clientDate: {
        color: '#64748B',
        fontSize: 12,
    },
    tagsDisplay: {
        width: '100%',
        alignItems: 'center',
        gap: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    tagsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
    },
    tagBadge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1.5,
    },
    tagBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    noTagsText: {
        fontSize: 13,
        color: '#94A3B8',
        fontStyle: 'italic',
    },
    manageTagsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#8B5CF610',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },
    manageTagsText: {
        color: '#8B5CF6',
        fontSize: 13,
        fontWeight: '800',
    },
    metricsSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#1E3932',
        fontWeight: '800',
        fontSize: 18,
        marginBottom: 12,
    },
    metricsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    ordersSection: {
        gap: 12,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
    },
    emptyText: {
        color: '#94A3B8',
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
    },
    orderItem: {
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
    },
    orderIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#D4E9E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        alignSelf: 'center',
    },
    orderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginRight: 8,
    },
    orderTotal: {
        color: '#00754A',
        fontWeight: '700',
        fontSize: 16,
    },
});
