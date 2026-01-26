import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { ForkKnife as Utensils } from 'phosphor-react-native';

export default function EmptyProductState() {
    const theme = useTheme();

    return (
        <View style={styles.container}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
                <Utensils size={64} color={theme.colors.primary} weight="regular" />
            </View>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                Selecciona un producto
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                Haz clic en cualquier producto de la lista para ver y editar sus detalles
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
        backgroundColor: '#FFFFFF',
    },
    iconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        opacity: 0.9,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 12,
        textAlign: 'center',
        fontFamily: 'BricolageGrotesque_800ExtraBold',
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 320,
        fontFamily: 'BricolageGrotesque_400Regular',
    },
});
