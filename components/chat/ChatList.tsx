import { View, FlatList, StyleSheet, useWindowDimensions, ScrollView, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme } from 'react-native-paper';
import { ChatCircleDots } from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import React, { useState, useMemo, useEffect } from 'react';
import ChatListItem from './ChatListItem';
import GlassmorphicHeader from '../GlassmorphicHeader';
import AppChip from '../AppChip';
import { useQuery, useMutation, usePaginatedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@clerk/clerk-expo';
import { useNotifications } from '@/hooks/useNotifications';
import TagSelectionSheet from './TagSelectionSheet';
import { Id } from '@/convex/_generated/dataModel';

const CHIPS_FILTRO = ['Todos', 'Agente iA', 'Urgente', 'Humano', 'No leídos', 'Archivados'];

export default function ChatList({ searchQuery: globalSearchQuery }: { searchQuery?: string }) {
    const theme = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const [activeFiltro, setActiveFiltro] = useState('Todos');

    const { userId } = useAuth();
    const updateCliente = useMutation(api.clientes.update);

    // Tags management state
    const [tagSheetVisible, setTagSheetVisible] = useState(false);
    const [selectedConv, setSelectedConv] = useState<any>(null);

    // 1. Get Commerce
    const comercio = useQuery(api.comercios.getByUserId, userId ? { userId } : "skip");

    // 2. Get notifications summary
    const { chatsUrgentes } = useNotifications({
        comercioId: comercio?._id,
        enableVibration: true
    });

    // 3. Get Clients with last messages (paginated)
    const {
        results: clientesConMensajes,
        status: contactsStatus,
        loadMore
    } = usePaginatedQuery(
        api.clientesPaginated.listPaginated,
        comercio ? { comercio_id: comercio._id } : "skip",
        { initialNumItems: 25 } // Optimized for mobile: faster initial load
    );

    // 4. Transform to conversations format
    const conversations = useMemo(() => {
        if (!clientesConMensajes) return [];

        return clientesConMensajes.map(cliente => ({
            id: cliente._id,
            cliente: {
                id: cliente._id,
                nombre: cliente.nombre_usuario || 'Cliente Sin Nombre',
                whatsapp: cliente.telefono || '',
            },
            ultimoMensaje: cliente.ultimoMensaje ? {
                id: cliente.ultimoMensaje._id,
                contenido: cliente.ultimoMensaje.contenido || '...',
                created_at: new Date(cliente.ultimoMensaje._creationTime).toISOString(),
                es_ia: cliente.ultimoMensaje.es_ia,
                es_dueno: cliente.ultimoMensaje.es_dueno,
                leido: true,
            } : {
                id: Math.random().toString(),
                contenido: 'Sin mensajes',
                created_at: new Date(cliente._creationTime).toISOString(),
                es_ia: false,
                leido: true,
            },
            noLeidos: 0,
            atendidoPorIA: cliente.asistente_activo,
            tienePedido: !!cliente.pedido_actual,
            hasOwnerMessages: false,
            requiereAtencionHumana: cliente.requiere_atencion_humana,
            archivado: cliente.archivado,
            tieneNoLeidos: !cliente.asistente_activo && cliente.ultimo_mensaje_es_dueno === false,
            etiquetas_ids: cliente.etiquetas_ids || [],
        }));
    }, [clientesConMensajes]);

    const loading = contactsStatus === "LoadingFirstPage";
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingForSearch, setIsLoadingForSearch] = useState(false);

    const searchQuery = globalSearchQuery ?? localSearchQuery;

    // Intelligent search: auto-load all chats when user searches
    useEffect(() => {
        const loadAllForSearch = async () => {
            // Only load if there's a search query and more chats available
            if (searchQuery.trim() !== '' && contactsStatus === "CanLoadMore" && !isLoadingForSearch) {
                setIsLoadingForSearch(true);

                // Load all remaining chats in batches
                let currentStatus = contactsStatus;
                while (currentStatus === "CanLoadMore") {
                    await loadMore(100); // Large batches for speed
                    // Wait a bit for status to update
                    await new Promise(resolve => setTimeout(resolve, 100));
                    currentStatus = contactsStatus;
                }

                setIsLoadingForSearch(false);
            }
        };

        // Debounce: wait 500ms after user stops typing
        const timer = setTimeout(loadAllForSearch, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, contactsStatus, loadMore]);

    const filteredConversations = useMemo(() => {
        let filtrados = conversations.filter(conv =>
            conv.cliente.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            conv.cliente.whatsapp.includes(searchQuery)
        );

        if (activeFiltro === 'Archivados') {
            return filtrados.filter(conv => conv.archivado);
        }

        filtrados = filtrados.filter(conv => !conv.archivado);

        if (activeFiltro === 'Agente iA') {
            filtrados = filtrados.filter(conv => conv.atendidoPorIA);
        } else if (activeFiltro === 'Humano') {
            filtrados = filtrados.filter(conv => !conv.atendidoPorIA);
        } else if (activeFiltro === 'Urgente') {
            filtrados = filtrados.filter(conv => conv.requiereAtencionHumana);
        } else if (activeFiltro === 'No leídos') {
            filtrados = filtrados.filter(conv => !conv.atendidoPorIA && !conv.ultimoMensaje.es_dueno);
        }

        return filtrados;
    }, [searchQuery, conversations, activeFiltro]);

    const handleArchive = async (id: string, archivado: boolean) => {
        try {
            await updateCliente({
                id: id as any,
                updates: { archivado }
            });
        } catch (error) {
            console.error('[ChatList] Error al archivar/desarchivar:', error);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsRefreshing(false);
    };

    const handleEndReached = () => {
        if (contactsStatus === "CanLoadMore") {
            loadMore(50); // Larger batches for smoother scrolling
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '...';
        const now = new Date();

        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return `${date.getDate()}/${date.getMonth() + 1}`;
    };

    return (
        <View style={styles.container}>
            <GlassmorphicHeader
                title="Chats"
                icon={ChatCircleDots}
                onRightPress={() => router.push('/sandbox')}
                searchable={true}
                searchQuery={localSearchQuery}
                onSearchChange={setLocalSearchQuery}
                searchPlaceholder="Buscar chats..."
                badgeCount={chatsUrgentes}
            />

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
            ) : isLoadingForSearch ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={{ marginTop: 8, color: theme.colors.primary, fontSize: 12 }}>
                        Buscando en todos los chats...
                    </Text>
                </View>
            ) : (
                <>
                    <FlatList
                        data={filteredConversations}
                        onEndReached={handleEndReached}
                        onEndReachedThreshold={0.8}
                        ListHeaderComponent={
                            <View style={styles.listHeader}>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.chipsScrollContent}
                                >
                                    {CHIPS_FILTRO.map(chip => {
                                        let badgeCount: number | undefined;
                                        const conversacionesNoArchivadas = conversations.filter(c => !c.archivado);

                                        if (chip === 'Todos') {
                                            badgeCount = conversacionesNoArchivadas.length;
                                        } else if (chip === 'Urgente') {
                                            badgeCount = conversacionesNoArchivadas.filter(c => c.requiereAtencionHumana).length;
                                        } else if (chip === 'Agente iA') {
                                            badgeCount = conversacionesNoArchivadas.filter(c => c.atendidoPorIA).length;
                                        } else if (chip === 'Humano') {
                                            badgeCount = conversacionesNoArchivadas.filter(c => !c.atendidoPorIA).length;
                                        } else if (chip === 'No leídos') {
                                            badgeCount = conversacionesNoArchivadas.filter(c => c.tieneNoLeidos).length;
                                        } else if (chip === 'Archivados') {
                                            badgeCount = conversations.filter(c => c.archivado).length;
                                        }

                                        return (
                                            <AppChip
                                                key={chip}
                                                selected={activeFiltro === chip}
                                                onPress={() => setActiveFiltro(chip)}
                                            >
                                                {chip}
                                                {badgeCount !== undefined && (
                                                    <Text style={styles.chipBadge}> {badgeCount}</Text>
                                                )}
                                            </AppChip>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <ChatListItem
                                item={item}
                                onPress={() => {
                                    router.push({
                                        pathname: '/mensajes',
                                        params: { clienteId: item.id }
                                    });
                                }}
                                onArchive={handleArchive}
                                formatTime={formatTime}
                                onTagPress={(conv) => {
                                    setSelectedConv(conv);
                                    setTagSheetVisible(true);
                                }}
                            />
                        )}
                        keyExtractor={item => item.id}
                        contentContainerStyle={[
                            styles.listContent,
                            { paddingBottom: Math.max(insets.bottom + 100, 160) }
                        ]}
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
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <ChatCircleDots size={48} color={theme.colors.outline} weight="regular" style={{ opacity: 0.5 }} />
                                <Text variant="bodyMedium" style={{ color: theme.colors.outline, fontWeight: '500' }}>
                                    No se encontraron conversaciones
                                </Text>
                            </View>
                        }
                    />
                    {comercio && (
                        <TagSelectionSheet
                            visible={tagSheetVisible}
                            onClose={() => {
                                setTagSheetVisible(false);
                                setSelectedConv(null);
                            }}
                            clienteId={selectedConv?.id}
                            comercioId={comercio._id}
                            initialTagIds={selectedConv?.etiquetas_ids}
                        />
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        marginTop: 110,
        alignItems: 'center',
    },
    chipsScrollContent: {
        paddingHorizontal: 24,
        gap: 8,
        paddingBottom: 4,
    },
    listContent: {
        paddingTop: 85,
        paddingHorizontal: 0,
    },
    listHeader: {
        paddingBottom: 6,
    },
    emptyContainer: {
        marginTop: 60,
        alignItems: 'center',
        gap: 16,
    },
    chipBadge: {
        fontSize: 13,
        fontWeight: '900',
        opacity: 0.8,
    },
});
