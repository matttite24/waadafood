import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, DeviceEventEmitter } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { Check as Save, Package } from 'phosphor-react-native';
import GlassmorphicHeader from '@/components/GlassmorphicHeader';
import FormularioProducto from './FormularioProducto';

export default function EditarProductoMobile() {
    const theme = useTheme();
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const productId = id as string;

    return (
        <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <GlassmorphicHeader
                    title="Editar Producto"
                    onBack={() => router.back()}
                    icon={Save}
                    onRightPress={() => DeviceEventEmitter.emit('MANUAL_SAVE_TRIGGER')}
                />

                <FormularioProducto
                    productId={productId}
                    onComplete={() => router.back()}
                />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
});
