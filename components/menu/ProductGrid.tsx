import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import ProductCard from './ProductCard';

interface Product {
    id: string;
    nombre: string;
    precio: number;
    categoria?: string;
    imagen_url?: string;
    disponible?: boolean;
}

interface ProductGridProps {
    products: Product[];
    title: string;
    onProductPress?: (product: Product) => void;
    isDesktop?: boolean;
}

export default function ProductGrid({ products, title, onProductPress, isDesktop = false }: ProductGridProps) {
    const theme = useTheme();
    const { width } = useWindowDimensions();

    // El padding horizontal en MenuList depende de isDesktop
    const horizontalPadding = isDesktop ? 12 : 24;

    // Calculamos el ancho de cada item restando el padding del contenedor y el gap
    const itemWidth = (width - (horizontalPadding * 2) - 12) / 2;

    if (products.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text variant="labelMedium" style={[styles.title, { color: theme.colors.primary }]}>
                {title.toUpperCase()}
            </Text>
            <View style={styles.grid}>
                {products.map(item => (
                    <View key={item.id} style={{ width: itemWidth }}>
                        <ProductCard
                            item={item}
                            onPress={onProductPress ? () => onProductPress(item) : undefined}
                        />
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    title: {
        fontWeight: '800',
        marginBottom: 16,
        letterSpacing: 1,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
});
