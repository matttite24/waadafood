import React, { useEffect } from 'react';
import { View, useWindowDimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import SettingsList from '@/components/settings/SettingsList';

export default function SettingsMenuScreen() {
    const { width } = useWindowDimensions();
    const router = useRouter();
    const isDesktop = width >= 1024 && Platform.OS === 'web';

    useEffect(() => {
        // En escritorio, si llegamos aquí (la raíz de ajustes),
        // redirigimos automáticamente a la primera sección "Información"
        // ya que la lista ya se ve en el panel maestro (panel izquierdo).
        if (isDesktop) {
            router.replace('/(app)/settings/info');
        }
    }, [isDesktop]);

    // En móvil, mostramos la lista normal
    return (
        <View style={{ flex: 1 }}>
            <SettingsList />
        </View>
    );
}

