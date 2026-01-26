import { useState, useMemo, useEffect, useRef } from 'react';
import { Stack, useSegments, usePathname, useRouter, useGlobalSearchParams } from 'expo-router';
import { View, useWindowDimensions, Platform, StyleSheet, Text as RNText, DeviceEventEmitter, LayoutAnimation, UIManager, Animated } from 'react-native';
import { Plus, Calendar, Flask, FloppyDisk, Funnel, Lightning, DownloadSimple, ChatCircle } from 'phosphor-react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavBar from '@/components/BottomNavBar';
import ChatList from '@/components/chat/ChatList';
import MenuList from '@/components/menu/MenuList';
import SettingsList from '@/components/settings/SettingsList';
import PedidosList from '@/components/pedidos/PedidosList';
import WebHeader from '@/components/WebHeader';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export default function AppLayout() {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024 && Platform.OS === 'web';

    if (isDesktop) {
        return <DesktopLayout />;
    }

    return <MobileLayout />;
}

function DesktopLayout() {
    const [searchQuery, setSearchQuery] = useState('');
    const pathname = usePathname();
    const router = useRouter();

    // Lógica para determinar si mostrar el panel doble
    const showSplitView = pathname.includes('/producto/') ||
        pathname === '/menu' ||
        pathname === '/metricas' ||
        pathname.startsWith('/mensajes') ||
        pathname.includes('/pedidos');

    // Proporciones personalizadas por vista
    const getPanelProportions = () => {
        if (pathname === '/menu' || pathname.includes('/producto/')) {
            return {
                masterFlex: 0.4,  // 40% para la lista
                masterMaxWidth: 9999,
                detailFlex: 0.35,  // 35% para el detalle
                detailPaddingRight: 0,
                detailPaddingHorizontal: 0,
                showThirdPanel: true,  // Activar tercer panel
                thirdPanelFlex: 0.25  // 25% para panel reservado
            };
        }
        if (pathname.includes('/pedidos')) {
            return {
                masterFlex: 0.45,
                masterMaxWidth: 450,
                detailFlex: 1,
                detailPaddingRight: 60,
                detailPaddingHorizontal: 0,
                showThirdPanel: false,
                thirdPanelFlex: 0
            };
        }
        if (pathname.startsWith('/settings')) {
            return {
                masterFlex: 0.35,
                masterMaxWidth: 350,
                detailFlex: 1,
                detailPaddingRight: 100,
                detailPaddingHorizontal: 0,
                showThirdPanel: false,
                thirdPanelFlex: 0
            };
        }
        // Default
        return {
            masterFlex: 0.5,
            masterMaxWidth: 500,
            detailFlex: 1,
            detailPaddingRight: 80,
            detailPaddingHorizontal: 0,
            showThirdPanel: false,
            thirdPanelFlex: 0
        };
    };

    const { masterFlex, masterMaxWidth, detailFlex, detailPaddingRight, detailPaddingHorizontal, showThirdPanel, thirdPanelFlex } = getPanelProportions();

    // Determinar la acción primaria según la ruta
    const primaryAction = useMemo(() => {
        if (pathname === '/menu' || pathname.includes('/producto/')) {
            return {
                label: 'Añadir',
                icon: Plus,
                onPress: () => DeviceEventEmitter.emit('WEB_OPEN_PRODUCT_MODAL')
            };
        }

        if (pathname.includes('/pedidos')) {
            return {
                label: 'Filtrar',
                icon: Funnel,
                onPress: () => DeviceEventEmitter.emit('WEB_OPEN_PEDIDOS_FILTERS')
            };
        }

        if (pathname.startsWith('/settings')) {
            return {
                label: 'Guardar',
                icon: FloppyDisk,
                onPress: () => DeviceEventEmitter.emit('WEB_SAVE_SETTINGS')
            };
        }

        if (pathname === '/mensajes') {
            return {
                label: 'Gestión de Mensajes',
                icon: ChatCircle,
                onPress: () => { },
                color: '#6366f1'
            };
        }


        if (pathname === '/metricas') {
            return {
                label: 'Exportar',
                icon: DownloadSimple,
                onPress: () => DeviceEventEmitter.emit('WEB_EXPORT_METRICS'),
                color: '#00754A'
            };
        }

        return undefined;
    }, [pathname]);

    return (
        <View style={{ flex: 1 }}>
            <WebHeader
                value={searchQuery}
                onChange={setSearchQuery}
                primaryAction={primaryAction}
            />
            <View style={styles.panelsContainer}>
                {/* PANEL IZQUIERDO (Lista Dinámica en Split View) */}
                {showSplitView && (
                    <View style={[styles.masterPanel, { flex: masterFlex, maxWidth: masterMaxWidth }]}>
                        {pathname.startsWith('/mensajes') && <ChatList searchQuery={searchQuery} />}
                        {(pathname === '/menu' || pathname.includes('/producto/')) && <MenuList searchQuery={searchQuery} />}
                        {pathname.startsWith('/settings') && <SettingsList searchQuery={searchQuery} />}
                        {pathname.includes('/pedidos') && <PedidosList searchQuery={searchQuery} />}
                    </View>
                )}

                {/* PANEL CENTRAL / DETALLE (Stack de Navegación) */}
                <View style={[
                    showSplitView ? styles.detailPanel : styles.masterPanel,
                    {
                        flex: detailFlex,
                        paddingRight: showSplitView ? detailPaddingRight : 0,
                        paddingHorizontal: showSplitView ? detailPaddingHorizontal : 0,
                        backgroundColor: (pathname === '/menu' || pathname.includes('/producto/')) ? '#FAFAFA' : 'transparent'
                    }
                ]}>
                    <Stack screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: '#F2F0EB' },
                        animation: 'fade',
                    }}>
                        <Stack.Screen name="menu" />
                        <Stack.Screen name="pedidos" />
                        <Stack.Screen name="pedidos/[id]" />
                        <Stack.Screen name="mensajes" />
                        <Stack.Screen name="metricas" />
                        <Stack.Screen name="settings/index" />
                        <Stack.Screen name="settings/info" />
                        <Stack.Screen name="settings/ia" />
                        <Stack.Screen name="producto/[id]" />
                    </Stack>
                </View>

                {/* PANEL DERECHO (Reservado para futuras funcionalidades) */}
                {showSplitView && showThirdPanel && (
                    <View style={[
                        styles.thirdPanel,
                        {
                            flex: thirdPanelFlex,
                            backgroundColor: '#F8F9FA',
                            borderLeftWidth: 1,
                            borderLeftColor: 'rgba(0, 0, 0, 0.05)'
                        }
                    ]}>
                        <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                            <Text style={{ color: '#9CA3AF', fontSize: 14, fontFamily: 'BricolageGrotesque_400Regular' }}>
                                Panel reservado
                            </Text>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
}

function MobileLayout() {
    const segments = useSegments();
    const lastSegment = segments[segments.length - 1];
    const parentSegment = segments[segments.length - 2];
    const { clienteId } = useGlobalSearchParams<{ clienteId?: string }>();
    const hideNavbar =
        parentSegment === 'producto' ||
        parentSegment === 'settings' ||
        (lastSegment === 'mensajes' && !!clienteId);

    // Valor animado para la posición vertical
    const translateY = useRef(new Animated.Value(hideNavbar ? 150 : 0)).current;

    useEffect(() => {
        Animated.spring(translateY, {
            toValue: hideNavbar ? 150 : 0,
            useNativeDriver: true,
            tension: 40,
            friction: 9,
        }).start();
    }, [hideNavbar]);

    return (
        <View style={{ flex: 1, backgroundColor: '#1E3932' }}>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#1E3932' }} edges={['top']}>
                <View style={{ flex: 1, backgroundColor: '#F2F0EB' }}>
                    <Stack screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: '#F2F0EB' },
                        animation: 'default',
                        presentation: 'card',
                    }}>
                        <Stack.Screen name="menu" />
                        <Stack.Screen name="pedidos" />
                        <Stack.Screen name="mensajes" />
                        <Stack.Screen name="metricas" />
                        <Stack.Screen name="settings/index" />
                        <Stack.Screen name="settings/info" />
                        <Stack.Screen name="settings/ia" />
                        <Stack.Screen name="settings/horario" />
                        <Stack.Screen name="settings/menu-imagenes" />
                        <Stack.Screen name="producto/[id]" />
                    </Stack>
                </View>

                <Animated.View
                    pointerEvents={hideNavbar ? 'none' : 'auto'}
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        alignItems: 'center',
                        transform: [{ translateY }],
                        zIndex: 1000,
                    }}
                >
                    <View style={{ width: '100%', maxWidth: 800 }}>
                        <BottomNavBar />
                    </View>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    desktopWorkspace: {
        flex: 1,
        backgroundColor: '#1E3932',
        position: 'relative', // Para el header absoluto
    },
    panelsContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    masterPanel: {
        flex: 1,
        backgroundColor: '#F2F0EB',
        borderRadius: 0, // Eliminado bordes redondos
        overflow: 'hidden',
    },
    detailPanel: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 0, // Eliminado bordes redondos
        overflow: 'hidden',
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(0,0,0,0.05)',
    },
    thirdPanel: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        borderRadius: 0,
        overflow: 'hidden',
    }
});
