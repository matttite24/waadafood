import React, { useEffect } from 'react';
import { View, LayoutAnimation } from 'react-native';
import { ActivityIndicator, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import BusinessImagesForm from '@/components/settings/BusinessImagesForm';
import GlassmorphicHeader from '@/components/GlassmorphicHeader';
import { Image as ImageIcon } from 'phosphor-react-native';
import { useQuery } from 'convex/react';
import { useAuth } from '@clerk/clerk-expo';
import { api } from '@/convex/_generated/api';

export default function MenuImagenesScreen() {
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
                <GlassmorphicHeader title="Menú" icon={ImageIcon} onBack={() => router.back()} />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            </View>
        );
    }

    return (
        <BusinessImagesForm
            comercioId={comercio?._id || null}
            initialImagenes={comercio?.imagenes_menu || []}
            initialTiempos={comercio?.tiempos_preparacion || ""}
            onBack={() => router.back()}
        />
    );
}
