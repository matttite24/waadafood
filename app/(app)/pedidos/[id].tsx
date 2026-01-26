import React from 'react';
import { View, StyleSheet } from 'react-native';
import DetallePedidoWeb from '@/components/pedidos/DetallePedidoWeb';

export default function PedidoDetalleScreen() {
    return (
        <View style={styles.container}>
            <DetallePedidoWeb />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
});
