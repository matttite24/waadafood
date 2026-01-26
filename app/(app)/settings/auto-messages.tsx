import React from 'react';
import { View } from 'react-native';
import { ActivityIndicator, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import QuickRepliesForm from '@/components/settings/QuickRepliesForm';
import GlassmorphicHeader from '@/components/GlassmorphicHeader';
import { ChatCircleDots as MessageCircle } from 'phosphor-react-native';
import { useQuery } from 'convex/react';
import { useAuth } from '@clerk/clerk-expo';
import { api } from '@/convex/_generated/api';

export default function AutoMessagesScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { userId } = useAuth();

    // Solo necesitamos el ID del comercio para pasarle al formulario
    const comercio = useQuery(api.comercios.getByUserId, userId ? { userId } : "skip");
    const loading = comercio === undefined;

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#F2F0EB' }}>
                <GlassmorphicHeader title="Respuestas Rápidas" icon={MessageCircle} onBack={() => router.back()} />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#F2F0EB' }}>
            <GlassmorphicHeader title="Respuestas Rápidas" icon={MessageCircle} onBack={() => router.back()} />
            {/* Ajustamos el padding superior para compensar el header flotante */}
            <View style={{ flex: 1, paddingTop: 100 }}>
                <QuickRepliesForm
                    comercioId={comercio?._id || null}
                    onBack={() => router.back()}
                />
            </View>
        </View>
    );
}
