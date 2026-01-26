import React, { useEffect } from 'react';
import { View, LayoutAnimation } from 'react-native';
import { ActivityIndicator, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import BusinessScheduleForm from '@/components/settings/BusinessScheduleForm';
import GlassmorphicHeader from '@/components/GlassmorphicHeader';
import { Clock } from 'phosphor-react-native';
import { useQuery } from 'convex/react';
import { useAuth } from '@clerk/clerk-expo';
import { api } from '@/convex/_generated/api';

export default function HorarioScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { userId } = useAuth();

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
                <GlassmorphicHeader title="Horario" icon={Clock} onBack={() => router.back()} />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            </View>
        );
    }

    return (
        <BusinessScheduleForm
            comercioId={comercio?._id || null}
            initialHorario={comercio?.horario_atencion || ''}
            initialTiempoLimite={comercio?.tiempo_limite_cierre ?? 15}
            onBack={() => router.back()}
        />
    );
}
