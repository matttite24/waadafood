import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { ShoppingBag, WarningCircle as AlertCircle, ChatCircleDots as MessageCircle, CheckCircle, X } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'pedido' | 'escalacion' | 'mensaje' | 'success' | 'error';

interface NotificationToastProps {
    visible: boolean;
    type: ToastType;
    title: string;
    message: string;
    onDismiss: () => void;
    onPress?: () => void;
    duration?: number; // ms, default 4000
}

const TOAST_CONFIG = {
    pedido: {
        icon: ShoppingBag,
        color: '#00754A',
        bgColor: 'rgba(0, 117, 74, 0.95)',
    },
    escalacion: {
        icon: AlertCircle,
        color: '#DC2626',
        bgColor: 'rgba(220, 38, 38, 0.95)',
    },
    mensaje: {
        icon: MessageCircle,
        color: '#2563EB',
        bgColor: 'rgba(37, 99, 235, 0.95)',
    },
    success: {
        icon: CheckCircle,
        color: '#059669',
        bgColor: 'rgba(5, 150, 105, 0.95)',
    },
    error: {
        icon: AlertCircle,
        color: '#DC2626',
        bgColor: 'rgba(220, 38, 38, 0.95)',
    },
};

export default function NotificationToast({
    visible,
    type,
    title,
    message,
    onDismiss,
    onPress,
    duration = 4000,
}: NotificationToastProps) {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(-200)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const config = TOAST_CONFIG[type];
    const Icon = config.icon;

    useEffect(() => {
        if (visible) {
            // Mostrar toast
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 8,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto-dismiss después de duration
            timerRef.current = setTimeout(() => {
                handleDismiss();
            }, duration);
        } else {
            // Ocultar toast
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: -200,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [visible]);

    const handleDismiss = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        onDismiss();
    };

    const handlePress = () => {
        if (onPress) {
            onPress();
            handleDismiss();
        }
    };

    if (!visible) return null;

    const Container = Platform.OS === 'web' ? View : BlurView;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    top: insets.top + 16,
                    transform: [{ translateY }],
                    opacity,
                },
            ]}
        >
            <Container
                {...(Platform.OS !== 'web' ? { intensity: 80, tint: 'dark' } : {})}
                style={[
                    styles.toast,
                    { backgroundColor: Platform.OS === 'web' ? config.bgColor : 'rgba(30, 30, 30, 0.95)' }
                ]}
            >
                {/* Área clickeable para navegar */}
                <TouchableOpacity
                    activeOpacity={onPress ? 0.8 : 1}
                    onPress={handlePress}
                    disabled={!onPress}
                    style={styles.clickableArea}
                >
                    {/* Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
                        <Icon size={18} color="#FFFFFF" />
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        <Text style={styles.title} numberOfLines={1}>
                            {title}
                        </Text>
                        <Text style={styles.message} numberOfLines={2}>
                            {message}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Dismiss button - fuera del TouchableOpacity principal */}
                <TouchableOpacity
                    onPress={handleDismiss}
                    style={styles.dismissButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <X size={16} color="rgba(255, 255, 255, 0.6)" />
                </TouchableOpacity>
            </Container>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 9999,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 10,
        overflow: 'hidden',
        marginBottom: 8,
    },
    clickableArea: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    content: {
        flex: 1,
        marginRight: 6,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 1,
    },
    message: {
        fontSize: 12,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.8)',
        lineHeight: 16,
    },
    dismissButton: {
        padding: 2,
    },
});
