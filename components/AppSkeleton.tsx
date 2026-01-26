import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, DimensionValue, Platform } from 'react-native';

interface AppSkeletonProps {
    width?: DimensionValue;
    height?: DimensionValue;
    borderRadius?: number;
    style?: any;
}

export default function AppSkeleton({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style
}: AppSkeletonProps) {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: Platform.OS !== 'web',
            })
        );

        animation.start();

        return () => animation.stop();
    }, [animatedValue]);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.3, 0.6, 0.3],
    });

    return (
        <View
            style={[
                styles.skeleton,
                { width, height, borderRadius },
                style
            ]}
        >
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                        opacity,
                    }
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#E1E9EE',
        overflow: 'hidden',
    },
});
