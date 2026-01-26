import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Pizza, ForkKnife as Utensils, BowlFood as Soup, Coffee, Hamburger as Beef, Cookie, IceCream, Cake } from 'phosphor-react-native';

const { width, height } = Dimensions.get('window');

const ChatBackground = () => {
    // Definimos una rejilla de iconos para cubrir la pantalla
    const icons = [Pizza, Utensils, Soup, Coffee, Beef, Cookie, IceCream, Cake];
    const rows = 12;
    const cols = 6;
    const spacing = width / cols;

    return (
        <View style={[styles.container, { pointerEvents: 'none' }]}>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.row}>
                    {Array.from({ length: cols }).map((_, colIndex) => {
                        const IconComponent = icons[(rowIndex + colIndex) % icons.length];
                        const rotation = (rowIndex * 45 + colIndex * 30) % 360;

                        return (
                            <View
                                key={`icon-${rowIndex}-${colIndex}`}
                                style={[
                                    styles.iconWrapper,
                                    {
                                        transform: [
                                            { rotate: `${rotation}deg` },
                                            { translateX: (Math.sin(rowIndex * 4 + colIndex * 10) * 20) },
                                            { translateY: (Math.cos(rowIndex * 7 + colIndex * 10) * 10) }
                                        ],
                                        opacity: rowIndex % 3 === 0 ? 0.08 : 0.05
                                    }
                                ]}
                            >
                                <IconComponent size={32} color="#293901ff" weight="regular" />
                            </View>
                        );
                    })}
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#F2F0EB', // Color base tipo WhatsApp
        overflow: 'hidden',
        paddingTop: 40,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 40,
    },
    iconWrapper: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default ChatBackground;
