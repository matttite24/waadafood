import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { FAB, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AppFABProps {
    icon: string;
    onPress: () => void;
    label?: string;
    visible?: boolean;
    style?: any;
}

/**
 * FAB Estandarizado para la aplicación.
 * Garantiza una posición consistente sobre el BottomNavBar.
 */
export default function AppFAB({ icon, onPress, label, visible = true, style }: AppFABProps) {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;

    // Estilos dinámicos calculados del UI Kit
    const dynamicStyles = useMemo(() => {
        if (isDesktop) {
            return {
                backgroundColor: theme.colors.primary,
                bottom: 32,
                right: 32,
            };
        }
        const navbarHeight = 64 + 15 + Math.max(insets.bottom, 16);
        return {
            backgroundColor: theme.colors.primary,
            bottom: navbarHeight + 16,
            right: 16,
        };
    }, [theme.colors.primary, insets.bottom, isDesktop]);

    return (
        <FAB
            icon={icon}
            label={label}
            onPress={onPress}
            visible={visible}
            color={theme.colors.onPrimary}
            style={[styles.fab, dynamicStyles, style]}
        />
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        right: 16,
        borderRadius: 28,
        zIndex: 2000,
    },
});
