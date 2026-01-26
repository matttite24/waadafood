import React from 'react';
import { View, StyleSheet } from 'react-native';
import NotificationToast from './NotificationToast';
import { useToastStore } from '@/hooks/useToast';

/**
 * Contenedor global de toasts
 * Debe ser montado una sola vez en el root de la aplicación
 */
export default function ToastContainer() {
    const { toasts, dismissToast } = useToastStore();

    return (
        <View style={styles.container} pointerEvents="box-none">
            {toasts.map((toast) => (
                <NotificationToast
                    key={toast.id}
                    visible={true}
                    type={toast.type}
                    title={toast.title}
                    message={toast.message}
                    onDismiss={() => dismissToast(toast.id)}
                    onPress={toast.onPress}
                    duration={toast.duration}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
    },
});
