import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import { WifiSlash as WifiOff } from 'phosphor-react-native';

const NetworkStatusIndicator = () => {
    const [isConnected, setIsConnected] = useState(true);
    const slideAnim = useState(new Animated.Value(-100))[0]; // Empieza arriba (fuera de pantalla)

    useEffect(() => {
        // Obtener estado inicial explícitamente
        NetInfo.fetch().then(state => {
            const connected = state.isConnected ?? true;
            setIsConnected(connected);
            // Si está conectado, asegurar que esté escondido (-100)
            slideAnim.setValue(connected ? -100 : 0);
        });

        const unsubscribe = NetInfo.addEventListener(state => {
            const connected = state.isConnected ?? true;
            setIsConnected(connected);

            // Solo animar si el estado realmente cambia para evitar loops o flashes
            Animated.spring(slideAnim, {
                toValue: connected ? -100 : 0,
                useNativeDriver: true,
                tension: 40,
                friction: 7
            }).start();
        });

        return () => unsubscribe();
    }, []);

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY: slideAnim }],
                }
            ]}
        >
            <View style={styles.pill}>
                <WifiOff size={14} color="#FFFFFF" />
                <Text style={styles.text}>Sin conexión</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 170, // Justo debajo del GlassmorphicHeader (que suele terminar en ~100)
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EF4444',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    text: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
});

export default NetworkStatusIndicator;
