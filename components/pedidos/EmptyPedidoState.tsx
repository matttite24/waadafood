import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Package } from 'phosphor-react-native';

export default function EmptyPedidoState() {
    const theme = useTheme();

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Package size={64} color={theme.colors.primary} weight="regular" />
            </View>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                Selecciona un pedido
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.outline }]}>
                Haz clic en cualquier pedido de la lista para ver sus detalles
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        opacity: 0.7,
    },
});
