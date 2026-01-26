import React, { useState } from 'react';
import { ScrollView, RefreshControl, View, ActivityIndicator, StyleSheet, useWindowDimensions, Platform, DeviceEventEmitter } from 'react-native';
import { Text, Searchbar, useTheme } from 'react-native-paper';
import { Package, Plus } from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { useAuth } from '@clerk/clerk-expo';
import { api } from '@/convex/_generated/api';
import AppChip from '../AppChip';
import AppBottomSheet from '../AppBottomSheet';
import GlassmorphicHeader from '../GlassmorphicHeader';
import ProductCarousel from './ProductCarousel';
import ProductGrid from './ProductGrid';
import FormularioProducto from '../producto/FormularioProducto';
import FormularioNuevoProducto from '../producto/FormularioNuevoProducto';

const CATEGORIAS_LISTA = ['Combos', 'Entradas', 'Principales', 'Bebidas', 'Postres', 'Otros'];
const FILTROS_LISTA = ['Todas', ...CATEGORIAS_LISTA];

export default function MenuList({ searchQuery: globalSearchQuery }: { searchQuery?: string }) {
    const theme = useTheme();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024 && Platform.OS === 'web';

    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const [activeFiltro, setActiveFiltro] = useState('Todas');
    const [showModal, setShowModal] = useState(false);
    const [productoEdicionId, setProductoEdicionId] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const openEditSheet = (product: any) => {
        setProductoEdicionId(product.id);
    };

    // Listen for Web Header actions
    React.useEffect(() => {
        const sub = DeviceEventEmitter.addListener('WEB_OPEN_PRODUCT_MODAL', () => {
            setShowModal(true);
        });
        return () => sub.remove();
    }, []);

    const searchQuery = globalSearchQuery ?? localSearchQuery;

    // Auth & Commerce Data
    const { userId } = useAuth();

    // 1. Obtener comercio del usuario actual
    const comercio = useQuery(api.comercios.getByUserId, userId ? { userId } : "skip");

    // 2. Obtener productos solo si tenemos comercio
    const productos = useQuery(
        api.productos.list,
        comercio ? { comercio_id: comercio._id } : "skip"
    );

    console.log('[MenuList] Productos debug:', { comercioId: comercio?._id, count: productos?.length, data: productos });

    const loading = productos === undefined || comercio === undefined;

    const normalizedProducts = (productos || []).map((p: any) => ({
        ...p,
        id: p._id,
        // Normalizamos la categoría "Platos Fuertes" a "Principales"
        categoria: p.categoria === 'Platos Fuertes' ? 'Principales' : p.categoria,
    }));

    const filtrados = normalizedProducts.filter((p: any) => {
        const s = p.nombre.toLowerCase().includes(searchQuery.toLowerCase());
        const c = activeFiltro === 'Todas' || p.categoria === activeFiltro;
        return s && c;
    });

    // Obtener las categorías que realmente tienen productos
    const categoriasConProductos = CATEGORIAS_LISTA.filter(cat =>
        normalizedProducts.some((p: any) => p.categoria === cat)
    );
    const filtrosVisibles = ['Todas', ...categoriasConProductos];

    const getByCategory = (cat: string) => filtrados.filter((p: any) => p.categoria === cat);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsRefreshing(false);
    };

    return (
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <GlassmorphicHeader
                title="Menú"
                icon={Plus}
                onRightPress={() => setShowModal(true)}
                searchable={true}
                searchQuery={localSearchQuery}
                onSearchChange={setLocalSearchQuery}
            />

            {comercio === undefined || (comercio && productos === undefined) ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
            ) : comercio === null ? (
                <View style={[styles.loadingContainer, { padding: 24 }]}>
                    <Text variant="bodyLarge" style={{ textAlign: 'center', color: theme.colors.error }}>
                        No se encontró información del comercio.
                    </Text>
                    <Text variant="bodySmall" style={{ textAlign: 'center', marginTop: 8 }}>
                        UserId: {userId}
                    </Text>
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    <ScrollView
                        style={{ flex: 1 }}
                        showsVerticalScrollIndicator={false}
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
                        <View style={styles.chipsContent}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: isDesktop ? 12 : 24, gap: 8 }}>
                                {filtrosVisibles.map(cat => (
                                    <AppChip key={cat} selected={activeFiltro === cat} onPress={() => setActiveFiltro(cat)}>{cat}</AppChip>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={{ padding: isDesktop ? 12 : 24, paddingTop: 8 }}>
                            {filtrados.length === 0 ? (
                                <View style={{ marginTop: 40, alignItems: 'center', opacity: 0.4 }}>
                                    <Package size={48} color={theme.colors.outline} weight="regular" />
                                    <Text variant="bodyMedium" style={{ color: theme.colors.outline, marginTop: 16 }}>No se encontraron platos</Text>
                                    <Text variant="labelSmall">Total productos raw: {productos?.length}</Text>
                                    <Text variant="labelSmall">Comercio ID: {comercio._id}</Text>
                                </View>
                            ) : activeFiltro === 'Todas' ? (
                                <View style={{ gap: 12 }}>
                                    <ProductCarousel products={getByCategory('Combos')} title="Combos" onProductPress={openEditSheet} />
                                    <ProductCarousel products={getByCategory('Entradas')} title="Entradas" onProductPress={openEditSheet} />
                                    <ProductCarousel products={getByCategory('Principales')} title="Principales" onProductPress={openEditSheet} />
                                    <ProductCarousel products={getByCategory('Bebidas')} title="Bebidas" onProductPress={openEditSheet} />
                                    <ProductCarousel products={getByCategory('Postres')} title="Postres" onProductPress={openEditSheet} />

                                    {filtrados.filter((p: any) => !['Combos', 'Entradas', 'Principales', 'Bebidas', 'Postres'].includes(p.categoria)).length > 0 && (
                                        <ProductCarousel products={filtrados.filter((p: any) => !['Combos', 'Entradas', 'Principales', 'Bebidas', 'Postres'].includes(p.categoria))} title="Otros" onProductPress={openEditSheet} />
                                    )}
                                </View>
                            ) : (
                                <ProductGrid products={filtrados} title={activeFiltro} onProductPress={openEditSheet} isDesktop={isDesktop} />
                            )}
                        </View>
                    </ScrollView>

                    {/* Sheet para Edición de Producto existente */}
                    <AppBottomSheet
                        visible={!!productoEdicionId}
                        onClose={() => setProductoEdicionId(null)}
                        title="Editar Producto"
                        snapPoints={['60%', '93%']}
                    >
                        {productoEdicionId && (
                            <FormularioProducto
                                productId={productoEdicionId}
                                onComplete={() => setProductoEdicionId(null)}
                                disableScroll={true}
                            />
                        )}
                    </AppBottomSheet>
                </View>
            )}

            <AppBottomSheet visible={showModal} onClose={() => setShowModal(false)} title="Añadir al Menú" snapPoints={['60%', '93%']}>
                {comercio && (
                    <FormularioNuevoProducto
                        comercioId={comercio._id}
                        onComplete={() => setShowModal(false)}
                    />
                )}
            </AppBottomSheet>
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: { marginTop: 110, alignItems: 'center' },
    listContent: { paddingTop: Platform.OS === 'web' ? 94 : 85, paddingBottom: 100 },
    chipsContent: { paddingBottom: 8 },
});
