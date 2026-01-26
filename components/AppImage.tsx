import React, { useState, useRef } from 'react';
import { View, Image, ImageProps, StyleSheet, Animated, Platform } from 'react-native';
import AppSkeleton from './AppSkeleton';

interface AppImageProps extends ImageProps {
    borderRadius?: number;
    containerStyle?: any;
}

export default function AppImage({
    source,
    style,
    borderRadius = 0,
    containerStyle,
    ...props
}: AppImageProps) {
    const [visible, setVisible] = useState(true);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Solo mostramos el skeleton si hay una fuente de imagen
    const hasSource = source && (typeof source === 'number' || (source as any).uri);

    const handleLoadEnd = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: Platform.OS !== 'web',
        }).start(() => setVisible(false));
    };

    return (
        <View style={[styles.container, { borderRadius }, containerStyle]}>
            <Image
                {...props}
                source={source}
                style={[style, { borderRadius }]}
                onLoadEnd={handleLoadEnd}
            />
            {visible && hasSource && (
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        { zIndex: 1, opacity: fadeAnim }
                    ]}
                >
                    <AppSkeleton
                        width="100%"
                        height="100%"
                        borderRadius={borderRadius}
                    />
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        overflow: 'hidden',
    },
});
