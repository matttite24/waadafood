import React, { useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Text, Badge, List, useTheme, Avatar } from 'react-native-paper';
import {
    Sparkle,
    CaretRight,
    User,
    WarningCircle,
    Archive,
    ArrowCounterClockwise,
    Tag
} from 'phosphor-react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@clerk/clerk-expo';

interface Cliente {
    id: string;
    nombre: string;
    whatsapp: string;
    avatar?: string;
}

interface Mensaje {
    id: string;
    contenido: string;
    created_at: string;
    es_ia: boolean;
    leido: boolean;
    es_dueno?: boolean;
}

interface Conversacion {
    id: string;
    cliente: Cliente;
    ultimoMensaje: Mensaje;
    noLeidos: number;
    atendidoPorIA?: boolean;
    tienePedido?: boolean;
    requiereAtencionHumana?: boolean;
    archivado?: boolean;
    tieneNoLeidos?: boolean;
    etiquetas_ids?: string[];
}

interface ChatListItemProps {
    item: Conversacion;
    onPress: () => void;
    onArchive: (id: string, archivado: boolean) => void;
    onTagPress: (item: Conversacion) => void;
    formatTime: (date: string) => string;
}

const ChatListItem = ({ item, onPress, onArchive, onTagPress, formatTime }: ChatListItemProps) => {
    const theme = useTheme();
    const swipeableRef = useRef<Swipeable>(null);

    // Obtener iniciales para el avatar
    const getInitials = (name: string) => {
        return (name || '??')
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    const getMessagePreview = () => {
        const { contenido, es_dueno } = item.ultimoMensaje;
        if (es_dueno) {
            return `Tú: ${contenido}`;
        }
        return contenido;
    };

    const renderLeftActions = (
        progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const trans = dragX.interpolate({
            inputRange: [0, 70],
            outputRange: [0.3, 1],
            extrapolate: 'clamp',
        });

        return (
            <RectButton
                style={[
                    styles.archiveAction,
                    { backgroundColor: item.archivado ? '#64748B' : '#00754A' }
                ]}
                onPress={() => {
                    onArchive(item.id, !item.archivado);
                    swipeableRef.current?.close();
                }}
            >
                <Animated.View style={[styles.actionIconContainer, {
                    transform: [{ scale: trans }],
                    opacity: progress
                }]}>
                    {item.archivado ? (
                        <ArrowCounterClockwise size={22} color="#FFFFFF" weight="bold" />
                    ) : (
                        <Archive size={22} color="#FFFFFF" weight="bold" />
                    )}
                </Animated.View>
            </RectButton>
        );
    };

    const renderRightActions = (
        progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const trans = dragX.interpolate({
            inputRange: [-70, 0],
            outputRange: [1, 0.3],
            extrapolate: 'clamp',
        });

        return (
            <RectButton
                style={styles.tagAction}
                onPress={() => {
                    onTagPress(item);
                    swipeableRef.current?.close();
                }}
            >
                <Animated.View style={[styles.actionIconContainer, {
                    transform: [{ scale: trans }],
                    opacity: progress
                }]}>
                    <Tag size={22} color="#FFFFFF" weight="bold" />
                </Animated.View>
            </RectButton>
        );
    };

    // Obtener información de las etiquetas
    const { userId } = useAuth();
    const commerce = useQuery(api.comercios.getByUserId, userId ? { userId } : "skip");
    const allTags = useQuery(api.etiquetas.listByComercio, commerce ? { comercio_id: commerce._id } : "skip");

    const activeTags = allTags?.filter(t => item.etiquetas_ids?.includes(t._id)) || [];

    return (
        <Swipeable
            ref={swipeableRef}
            renderLeftActions={renderLeftActions}
            renderRightActions={renderRightActions}
            friction={1.5}
            leftThreshold={30}
            rightThreshold={30}
            overshootLeft={false}
            overshootRight={false}
        >
            <View style={{ backgroundColor: '#F2F0EB' }}>
                <List.Item
                    style={[styles.item, { backgroundColor: theme.colors.surface }]}
                    title={() => (
                        <View style={styles.titleContainer}>
                            <Text
                                variant="titleMedium"
                                style={[styles.name, { color: '#1E3932', flex: 1 }]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {item.cliente.nombre === 'Cliente Sin Nombre' || !item.cliente.nombre
                                    ? item.cliente.whatsapp
                                    : item.cliente.nombre}
                            </Text>
                        </View>
                    )}
                    onPress={onPress}
                    description={() => (
                        <View>
                            <Text
                                style={[
                                    styles.msgText,
                                    item.tieneNoLeidos && styles.unreadMsgText
                                ]}
                                numberOfLines={1}
                            >
                                {getMessagePreview()}
                            </Text>
                            {activeTags.length > 0 && (
                                <View style={styles.tagsContainer}>
                                    {activeTags.map(tag => (
                                        <View
                                            key={tag._id}
                                            style={[styles.tagBadge, { backgroundColor: `${tag.color}20`, borderColor: tag.color }]}
                                        >
                                            <Text style={[styles.tagBadgeText, { color: tag.color }]}>
                                                {tag.nombre}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                    left={() => (
                        <View style={styles.avatarContainer}>
                            {item.cliente.avatar ? (
                                <Avatar.Image size={52} source={{ uri: item.cliente.avatar }} />
                            ) : (
                                <Avatar.Text
                                    size={52}
                                    label={getInitials(item.cliente.nombre)}
                                    style={{ backgroundColor: item.atendidoPorIA ? '#D4E9E2' : '#E2E8F0' }}
                                    labelStyle={{
                                        color: item.atendidoPorIA ? '#00754A' : '#64748B',
                                        fontWeight: '900',
                                        fontSize: 18,
                                        letterSpacing: -0.5
                                    }}
                                />
                            )}
                            {item.tienePedido && (
                                <View style={styles.orderIndicator} />
                            )}
                        </View>
                    )}
                    right={() => (
                        <View style={styles.rightContainer}>
                            <Text style={[styles.time, item.noLeidos > 0 && styles.unreadTime]}>
                                {formatTime(item.ultimoMensaje.created_at)}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                {item.noLeidos > 0 && (
                                    <Badge size={22} style={styles.badge}>{item.noLeidos}</Badge>
                                )}
                                {item.requiereAtencionHumana ? (
                                    <View style={[styles.manualBadge, styles.urgentBadge]}>
                                        <WarningCircle size={10} color="#FFFFFF" weight="fill" />
                                        <Text style={[styles.manualBadgeText, styles.urgentBadgeText]}>Urgente</Text>
                                    </View>
                                ) : item.atendidoPorIA ? (
                                    <View style={styles.aiBadge}>
                                        <Sparkle size={10} color="#00754A" weight="fill" />
                                        <Text style={styles.aiBadgeText}>iA</Text>
                                    </View>
                                ) : (
                                    <View style={[
                                        styles.manualBadge,
                                        item.noLeidos > 0 && styles.manualBadgeUrgent
                                    ]}>
                                        <User size={10} color={item.noLeidos > 0 ? "#F59E0B" : "#EF4444"} weight="fill" />
                                        <Text style={[
                                            styles.manualBadgeText,
                                            item.noLeidos > 0 && styles.manualBadgeTextUrgent
                                        ]}>
                                            {item.noLeidos > 0 ? 'Sin atender' : 'Manual'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                />
            </View>
        </Swipeable>
    );
};

const styles = StyleSheet.create({
    item: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    name: {
        fontWeight: '700',
        fontSize: 16,
        letterSpacing: -0.2,
    },
    aiBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D4E9E2',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        gap: 4,
    },
    aiBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#00754A',
    },
    manualBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        gap: 4,
    },
    manualBadgeUrgent: {
        backgroundColor: '#FEF3C7',
        borderWidth: 1,
        borderColor: '#F59E0B',
    },
    manualBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#EF4444',
    },
    manualBadgeTextUrgent: {
        color: '#F59E0B',
    },
    urgentBadge: {
        backgroundColor: '#EF4444',
    },
    urgentBadgeText: {
        color: '#FFFFFF',
    },
    msgText: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
    unreadMsgText: {
        color: '#1E3932',
        fontWeight: '600',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 4,
    },
    orderIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#F59E0B',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    rightContainer: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 6,
    },
    time: {
        fontSize: 12,
        color: '#94A3B8',
    },
    unreadTime: {
        color: '#00754A',
        fontWeight: '700',
    },
    badge: {
        backgroundColor: '#00754A',
        fontWeight: '700',
    },
    archiveAction: {
        width: 70,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tagAction: {
        width: 70,
        flex: 1,
        backgroundColor: '#8B5CF6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 6,
    },
    tagBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
    },
    tagBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
});

export default ChatListItem;
