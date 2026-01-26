import React, { useEffect } from 'react';
import { View, LayoutAnimation } from 'react-native';
import { ActivityIndicator, useTheme, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { CreditCard } from 'phosphor-react-native';
import PaymentsForm from '@/components/settings/PaymentsForm';
import GlassmorphicHeader from '@/components/GlassmorphicHeader';
import { useQuery } from 'convex/react';
import { useAuth } from '@clerk/clerk-expo';
import { api } from '@/convex/_generated/api';

export default function PaymentsScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { userId } = useAuth();

    // Fetch commerce by User ID
    const comercio = useQuery(api.comercios.getByUserId, userId ? { userId } : "skip");
    const loading = comercio === undefined;

    useEffect(() => {
        if (!loading) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
    }, [loading]);

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#F2F0EB' }}>
                <GlassmorphicHeader
                    title="Pagos"
                    icon={CreditCard}
                    onBack={() => router.back()}
                />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            </View>
        );
    }

    if (comercio === null) {
        return (
            <View style={{ flex: 1, backgroundColor: '#F2F0EB' }}>
                <GlassmorphicHeader
                    title="Pagos"
                    icon={CreditCard}
                    onBack={() => router.back()}
                />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <Text variant="bodyLarge" style={{ textAlign: 'center', color: theme.colors.error }}>
                        No se encontró información del comercio.
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <PaymentsForm
            comercioId={comercio._id}
            initialData={{
                instruccionesPago: comercio.instrucciones_pago || '',
                pagoEfectivo: comercio.pago_efectivo || false,
                pagoTransferencia: comercio.pago_transferencia || false,
            }}
            onBack={() => router.back()}
        />
    );
}
