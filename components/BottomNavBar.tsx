import { View, Animated, StyleSheet, Platform, Dimensions, LayoutAnimation, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Text, useTheme } from 'react-native-paper';
import React, { useRef, useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ForkKnife,
    ChartDonut,
    Receipt,
    ChatCircleText,
    Gear,
} from 'phosphor-react-native';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@clerk/clerk-expo';

const { width } = Dimensions.get('window');

const NavItem = ({ item, active, onPress }: { item: any; active: boolean; onPress: () => void }) => {
    const badge = item.badge;
    const Icon = item.icon;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(active ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(opacityAnim, {
            toValue: active ? 1 : 0,
            duration: 100,
            useNativeDriver: true,
        }).start();
    }, [active]);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.92,
            useNativeDriver: true,
            tension: 60,
            friction: 10,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 60,
            friction: 10,
        }).start();
    };

    return (
        <View style={[
            styles.navItemContainer,
            { flex: active ? 2 : 1 }
        ]}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                <Pressable
                    onPress={onPress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    style={[
                        styles.ripple,
                        {
                            backgroundColor: active ? 'rgba(243, 240, 240, 0.1)' : 'transparent',
                            paddingHorizontal: active ? 12 : 0,
                        }
                    ]}
                >
                    <View style={styles.itemContent}>
                        <View>
                            <Icon
                                size={28}
                                color={active ? '#00754A' : 'rgba(0, 0, 0, 0.6)'}
                                weight={active ? 'fill' : 'regular'}
                            />
                            {badge > 0 && (
                                <View style={[
                                    styles.badgeContainer,
                                    { backgroundColor: item.badgeColor || '#EF4444' }
                                ]}>
                                    <Text style={styles.badgeText}>
                                        {badge > 9 ? '+9' : badge}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {active && (
                            <Animated.View style={{ opacity: opacityAnim }}>
                                <Text
                                    variant="labelLarge"

                                    style={[styles.label, { color: '#00754A' }]}
                                    numberOfLines={1}
                                >
                                    {item.label}
                                </Text>
                            </Animated.View>
                        )}
                    </View>
                </Pressable>
            </Animated.View>
        </View>
    );
};

export default function BottomNavBar() {
    const router = useRouter();
    const realPathname = usePathname();
    const insets = useSafeAreaInsets();
    const { userId } = useAuth();

    // 1. Obtener Comercio
    const comercio = useQuery(api.comercios.getByUserId, userId ? { userId } : "skip");

    // 2. Obtener conteos para los badges
    const badgeCounts = useQuery(
        api.stats.getNavbarBadgeCounts,
        comercio ? { comercio_id: comercio._id } : "skip"
    );

    // Estado optimista para que el UI reaccione al toque sin esperar al router
    const [optimisticPathname, setOptimisticPathname] = useState(realPathname);

    // Sincronizar el estado optimista con el real cuando este cambia
    useEffect(() => {
        if (realPathname !== optimisticPathname) {
            setOptimisticPathname(realPathname);
        }
    }, [realPathname]);

    const navItems = [
        { name: 'menu', label: 'Menú', icon: ForkKnife, href: '/menu' },
        { name: 'metrics', label: 'Métricas', icon: ChartDonut, href: '/metricas' },
        {
            name: 'pedidos',
            label: 'Pedidos',
            icon: Receipt,
            href: '/pedidos',
            badge: badgeCounts?.pendingOrders || 0,
            badgeColor: '#F59E0B'
        },
        {
            name: 'chat',
            label: 'Chat',
            icon: ChatCircleText,
            href: '/mensajes',
            badge: badgeCounts?.urgentChats || 0,
            badgeColor: '#EF4444'
        },
        { name: 'settings', label: 'Ajustes', icon: Gear, href: '/settings' },
    ];

    // Eliminamos LayoutAnimation para evitar conflictos con la animación del contenedor padre
    const isActive = (href: string) => optimisticPathname === href;

    const renderContainer = (children: React.ReactNode) => {
        if (Platform.OS === 'ios') {
            return (
                <GlassView
                    glassEffectStyle="regular"
                    tintColor="rgba(255, 255, 255, 0.1)"
                    style={styles.container}
                >
                    {children}
                </GlassView>
            );
        }

        return (
            <BlurView
                intensity={95}
                tint="light"
                style={[
                    styles.container,
                    { backgroundColor: 'rgba(255, 255, 255, 0.6)' }
                ]}
            >
                {children}
            </BlurView>
        );
    };

    return (
        <View style={styles.absoluteContainer} pointerEvents="box-none">
            <View
                style={[
                    styles.wrapper,
                    { bottom: Math.max(insets.bottom, 24) }
                ]}
                pointerEvents="box-none"
            >
                <View style={styles.shadowContainer}>
                    {renderContainer(
                        <View style={styles.navContent}>
                            {navItems.map((item) => {
                                const active = isActive(item.href);
                                return (
                                    <NavItem
                                        key={item.name}
                                        item={item}
                                        active={active}
                                        onPress={() => {
                                            if (realPathname !== item.href) {
                                                // Reaccionar instantáneamente en el UI
                                                setOptimisticPathname(item.href);
                                                // Y disparar la navegación real
                                                router.push(item.href as any);
                                            }
                                        }}
                                    />
                                );
                            })}
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
}


const styles = StyleSheet.create({
    absoluteContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 160,
        justifyContent: 'flex-end',
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '100%',
    },
    wrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        zIndex: 1000,
    },
    shadowContainer: {
        width: '100%',
        maxWidth: 500,
        height: 64,
        borderRadius: 32,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 15 },
                shadowOpacity: 0.3,
                shadowRadius: 24,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    container: {
        flex: 1,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        overflow: 'hidden',
    },
    navContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        height: '100%',
        paddingHorizontal: 8,
    },
    navItemContainer: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ripple: {
        borderRadius: 22,
        height: 44,
        width: '94%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    label: {
        fontWeight: '700',
        letterSpacing: -0.25,
        fontSize: 15,
        color: '#00754A',
    },
    badgeContainer: {
        position: 'absolute',
        top: -3,
        right: -6,
        backgroundColor: '#EF4444',
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 3,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '600',
        lineHeight: 11,
        textAlign: 'center',
    },
});

