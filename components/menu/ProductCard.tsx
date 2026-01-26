import React, { memo } from 'react';
import { View, Image, StyleSheet, Pressable } from 'react-native';
import { Card, Text, useTheme, IconButton, Surface } from 'react-native-paper';
import { ForkKnife, CaretRight } from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import AppImage from '../AppImage';

interface Product {
    id: string;
    nombre: string;
    precio: number;
    categoria?: string;
    descripcion?: string;
    imagen_url?: string;
    disponible?: boolean;
}

interface ProductCardProps {
    item: Product;
    onPress?: () => void;
}

const ProductCard = memo(({ item, onPress }: ProductCardProps) => {
    const theme = useTheme();
    const router = useRouter();
    const isVisible = item.disponible !== false;

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            router.push(`/producto/${item.id}`);
        }
    };

    // Calculamos el estilo dinámico del fondo una sola vez por render
    // Estilo de tarjeta sin fondo
    const cardBgStyle = { backgroundColor: 'transparent' };

    return (
        <Card
            mode="contained"
            style={[styles.minimalLargeCard, !isVisible && styles.disabledOpacity, cardBgStyle]}
        >
            <Pressable
                onPress={handlePress}
                style={({ pressed }) => [{ flex: 1 }, pressed && { opacity: 0.95 }]}
            >
                <View style={[styles.cleanImageContainer, { borderRadius: 24, overflow: 'hidden' }]}>
                    {item.imagen_url ? (
                        <AppImage
                            source={{ uri: item.imagen_url }}
                            style={styles.fullImage}
                            borderRadius={24}
                            containerStyle={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.placeholderCenter}>
                            <ForkKnife size={48} color={theme.colors.primary} />
                        </View>
                    )}

                    <Surface style={styles.minimalPriceBadge} elevation={0}>
                        <Text style={styles.minimalPriceText}>
                            ${Number(item.precio || 0).toFixed(2)}
                        </Text>
                    </Surface>

                    {!isVisible && (
                        <View style={styles.hiddenOverlay}>
                            <Text style={styles.hiddenText}>OCULTO</Text>
                        </View>
                    )}
                </View>

                <View style={styles.minimalContentRow}>
                    <View style={styles.minimalContent}>
                        <Text variant="titleMedium" style={styles.minimalTitle} numberOfLines={1}>
                            {item.nombre}
                        </Text>
                        <Text variant="labelSmall" style={styles.minimalDesc} numberOfLines={1}>
                            {item.descripcion || item.categoria || 'Opción disponible'}
                        </Text>
                    </View>
                    <CaretRight size={18} color={theme.colors.outline} style={{ opacity: 0.5 }} />
                </View>
            </Pressable>
        </Card>
    );
});

const styles = StyleSheet.create({
    minimalLargeCard: {
        flex: 1,
        borderRadius: 24,
        margin: 2,
    },
    cleanImageContainer: {
        width: '100%',
        height: 126,
        backgroundColor: '#F8F9FA',
        position: 'relative',
    },
    minimalPriceBadge: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
    },
    minimalPriceText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#00754A',
    },
    minimalContentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 4,
    },
    minimalContent: {
        flex: 1,
    },
    minimalTitle: {
        fontWeight: '800',
        color: '#1C1C1E',
        fontSize: 17,
        marginBottom: 2,
    },
    minimalDesc: {
        color: '#8E8E93',
        fontWeight: '500',
    },


    fullImage: {
        width: '100%',
        height: '100%',
    },
    placeholderCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    hiddenOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    hiddenText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    disabledOpacity: {
        opacity: 0.6,
    },
    fadedText: {
        color: '#8E8E93',
    },
});

export default ProductCard;
