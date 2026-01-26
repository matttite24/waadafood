import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
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

interface ProductCarouselProps {
    products: Product[];
    title: string;
    onProductPress?: (product: Product) => void;
}

export default function ProductCarousel({ products, title, onProductPress }: ProductCarouselProps) {
    const theme = useTheme();
    if (products.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text variant="labelMedium" style={[styles.title, { color: theme.colors.primary }]}>
                {title.toUpperCase()}
            </Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {products.map(item => (
                    <View key={item.id} style={{ width: 180 }}>
                        <ProductCard item={item} onPress={onProductPress ? () => onProductPress(item) : undefined} />
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 4,
        marginHorizontal: -24, // Compensa el padding del contenedor padre
    },
    title: {
        fontWeight: '800',
        marginBottom: 12,
        marginHorizontal: 24,
        letterSpacing: 1,
    },
    scrollContent: {
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 24, // Hace que el primer y último item respeten el margen pero permitan scroll infinito
    },
});
