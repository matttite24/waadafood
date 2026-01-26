import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Text, useTheme, List, Avatar } from 'react-native-paper';
import { ChartDonut, TrendUp, Users, ShoppingBag, Percent, Sparkle, Money, Calendar, ArrowsClockwise } from 'phosphor-react-native';
import GlassmorphicHeader from '@/components/GlassmorphicHeader';
import AppChip from '@/components/AppChip';
import MetricCard from '@/components/metrics/MetricCard';
import MetricsList from '@/components/metrics/MetricsList';
import MetricDetailSheet from '@/components/metrics/MetricDetailSheet';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import IncompleteSaleDetail from '@/components/metrics/IncompleteSaleDetail';

import { METRIC_DETAILS as SHARED_METRIC_DETAILS } from '@/shared/metricDefinitions';
import { formatCurrency } from '@/shared/utils/formatters';
import * as PhosphorIcons from 'phosphor-react-native';

export default function MetricasScreen() {
    const theme = useTheme();
    const { userId } = useAuth();
    const router = useRouter();
    const [filtroFecha, setFiltroFecha] = useState<'hoy' | 'ayer' | '7dias' | '30dias'>('hoy');
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
    const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
    const [selectedIncompleteSale, setSelectedIncompleteSale] = useState<any>(null);
    const [isIncompleteSaleVisible, setIsIncompleteSaleVisible] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const comercio = useQuery(api.comercios.getByUserId, userId ? { userId } : "skip");
    const metrics = useQuery(api.metrics.getSummary,
        comercio ? { comercio_id: comercio._id, filtro: filtroFecha } : "skip"
    );

    const getHeaderTitle = () => {
        if (filtroFecha === 'hoy') return 'Métricas de Hoy';
        if (filtroFecha === 'ayer') return 'Métricas de Ayer';
        if (filtroFecha === '7dias') return 'Últimos 7 días';
        if (filtroFecha === '30dias') return 'Últimos 30 días';
        return 'Métricas';
    };

    const handleOpenDetail = (title: string) => {
        if (SHARED_METRIC_DETAILS[title]) {
            setSelectedMetric(title);
            setIsBottomSheetVisible(true);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsRefreshing(false);
    };

    const loading = metrics === undefined || comercio === undefined;

    return (
        <View style={styles.container}>
            <GlassmorphicHeader
                title={getHeaderTitle()}
                icon={ChartDonut}
                rightIconActive={filtroFecha !== 'hoy'}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
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
                <View style={{ paddingBottom: 16, marginHorizontal: -16 }}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                    >
                        {(['hoy', 'ayer', '7dias', '30dias'] as const).map((filtro) => {
                            const label = filtro === '7dias' ? '7 Días' : filtro === '30dias' ? '30 Días' : filtro.charAt(0).toUpperCase() + filtro.slice(1);
                            return (
                                <AppChip
                                    key={filtro}
                                    selected={filtroFecha === filtro}
                                    onPress={() => setFiltroFecha(filtro)}
                                >
                                    {label}
                                </AppChip>
                            );
                        })}
                    </ScrollView>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color={theme.colors.primary} />
                        <Text style={styles.loadingText}>Calculando métricas...</Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.grid}>
                            {(Object.entries(SHARED_METRIC_DETAILS) as [string, any][]).map(([title, detail]) => {
                                const Icon = (PhosphorIcons as any)[detail.iconName] || PhosphorIcons.TrendUp;
                                let value = "---";

                                if (metrics) {
                                    if (title === "Total de Ventas") value = formatCurrency(metrics.revenue || 0);
                                    else if (title === "Ticket Promedio") value = formatCurrency(metrics.averageTicket || 0);
                                    else if (title === "Pedidos Creados") value = (metrics.orderCount || 0).toString();
                                    else if (title === "Nuevos Clientes") value = (metrics.newClients || 0).toString();
                                    else if (title === "Conversión") value = `${(metrics.conversionRate || 0).toFixed(1)}%`;
                                    else if (title === "Eficiencia iA") value = `${(metrics.iaEfficiency || 0).toFixed(1)}%`;
                                }

                                return (
                                    <MetricCard
                                        key={title}
                                        title={title}
                                        value={value}
                                        icon={Icon}
                                        color={detail.color}
                                        onPress={() => handleOpenDetail(title)}
                                    />
                                );
                            })}
                        </View>

                        <MetricsList
                            title="Mejores Ventas"
                            data={metrics?.topProducts || []}
                            renderItem={(prod: any, idx: number) => (
                                <List.Item
                                    title={prod.nombre}
                                    titleStyle={styles.productName}
                                    description={`${prod.cantidad} unidades vendidas`}
                                    left={() => (
                                        <View style={styles.rankContainer}>
                                            <Text style={styles.rankText}>{idx + 1}</Text>
                                        </View>
                                    )}
                                    right={() => (
                                        <View style={styles.productValueContainer}>
                                            <TrendUp size={16} color="#00754A" />
                                        </View>
                                    )}
                                    style={idx < (metrics.topProducts.length - 1) ? styles.listItemBorder : {}}
                                />
                            )}
                            emptyMessage="Sin datos de ventas en este periodo"
                            emptyIcon={<ShoppingBag size={40} color={theme.colors.outline} style={{ opacity: 0.2 }} />}
                        />

                        <MetricsList
                            title="Ganancia por categoria"
                            data={metrics?.topCategories || []}
                            renderItem={(cat: any, idx: number) => (
                                <List.Item
                                    title={cat.nombre}
                                    titleStyle={styles.productName}
                                    description={`${formatCurrency(cat.total)} en ventas`}
                                    left={() => (
                                        <Avatar.Icon
                                            size={32}
                                            icon="tag"
                                            style={{ backgroundColor: '#F1F5F9', alignSelf: 'center', marginLeft: 8 }}
                                            color="#64748B"
                                        />
                                    )}
                                    style={idx < (metrics.topCategories.length - 1) ? styles.listItemBorder : {}}
                                />
                            )}
                            emptyMessage="Sin categorías registradas"
                        />

                        <MetricsList
                            title="Mejores clientes"
                            data={metrics?.topClients || []}
                            renderItem={(client: any, idx: number) => (
                                <List.Item
                                    title={client.nombre}
                                    titleStyle={styles.productName}
                                    description={`${formatCurrency(client.total)} gastados`}
                                    left={() => (
                                        <Avatar.Text
                                            size={32}
                                            label={client.nombre.substring(0, 1).toUpperCase()}
                                            style={{ backgroundColor: '#D4E9E2', alignSelf: 'center', marginLeft: 8 }}
                                            color="#00754A"
                                        />
                                    )}
                                    style={idx < (metrics.topClients.length - 1) ? styles.listItemBorder : {}}
                                    onPress={() => {
                                        if (client.id) {
                                            router.push(`/mensajes?clienteId=${client.id}`);
                                        }
                                    }}
                                />
                            )}
                            emptyMessage="Sin clientes en este periodo"
                        />

                        <MetricsList
                            title="Demanda por horas"
                            data={metrics?.peakHours || []}
                            renderItem={(h: any, idx: number) => (
                                <List.Item
                                    title={`${h.hora}:00 - ${h.hora + 1}:00`}
                                    titleStyle={styles.productName}
                                    description={`${h.cantidad} pedidos recibidos`}
                                    left={() => (
                                        <View style={styles.rankContainer}>
                                            <Calendar size={16} color="#00754A" />
                                        </View>
                                    )}
                                    style={idx < (metrics.peakHours.length - 1) ? styles.listItemBorder : {}}
                                />
                            )}
                            emptyMessage="Sin datos de horarios"
                        />

                        <MetricsList
                            title="Ventas incompletas"
                            data={metrics?.incompleteSales || []}
                            renderItem={(draft: any, idx: number) => (
                                <List.Item
                                    title={draft.cliente_nombre || "Cliente Anónimo"}
                                    titleStyle={styles.productName}
                                    description={`Por ${formatCurrency(draft.total)} - ${draft.resumen_pedido || "Sin resumen"}`}
                                    left={() => (
                                        <Avatar.Icon
                                            size={32}
                                            icon="cart-outline"
                                            style={{ backgroundColor: '#FEF3F2', alignSelf: 'center', marginLeft: 8 }}
                                            color="#EF4444"
                                        />
                                    )}
                                    style={idx < (metrics.incompleteSales.length - 1) ? styles.listItemBorder : {}}
                                    onPress={() => {
                                        setSelectedIncompleteSale(draft);
                                        setIsIncompleteSaleVisible(true);
                                    }}
                                />
                            )}
                            emptyMessage="¡No hay ventas incompletas!"
                        />
                    </>
                )}
            </ScrollView>

            <MetricDetailSheet
                visible={isBottomSheetVisible}
                onClose={() => setIsBottomSheetVisible(false)}
                metricName={selectedMetric}
                metricDetails={SHARED_METRIC_DETAILS}
            />

            <IncompleteSaleDetail
                visible={isIncompleteSaleVisible}
                onClose={() => setIsIncompleteSaleVisible(false)}
                sale={selectedIncompleteSale}
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
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    listItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    productName: {
        fontWeight: '700',
        color: '#1E3932',
    },
    rankContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#D4E9E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        alignSelf: 'center',
    },
    rankText: {
        color: '#00754A',
        fontWeight: '900',
        fontSize: 14,
    },
    productValueContainer: {
        justifyContent: 'center',
        marginRight: 8,
    },
    loadingContainer: {
        paddingTop: 100,
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        color: '#64748B',
        fontWeight: '600',
    },
});
