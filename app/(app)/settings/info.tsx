import React, { useEffect } from 'react';
import { View, LayoutAnimation } from 'react-native';
import { ActivityIndicator, useTheme, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import BusinessInfoForm from '@/components/settings/BusinessInfoForm';
import GlassmorphicHeader from '@/components/GlassmorphicHeader';
import { Storefront as Building2 } from 'phosphor-react-native';
import { useQuery } from 'convex/react';
import { useAuth } from '@clerk/clerk-expo';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

export default function BusinessInfoScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { userId } = useAuth();

    // Fetch commerce by User ID
    const comercio = useQuery(api.comercios.getByUserId, userId ? { userId } : "skip");

    // Loading if auth is not ready or query is pending
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
                    title="Información"
                    icon={Building2}
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
                    title="Información"
                    icon={Building2}
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

    // Prepare data safely
    const initialData = {
        nombre: comercio.nombre_comercio || '',
        descripcion: comercio.descripcion_corta || '',
        direccion: comercio.direccion || '',
        ciudad: comercio.ciudad || '',
        horario: comercio.horario_atencion || '',
        googleMapsLink: comercio.google_maps_link || '',
        telefono: comercio.telefono_contacto || '',
        imagenesMenu: comercio.imagenes_menu || []
    };

    return (
        <BusinessInfoForm
            comercioId={comercio._id}
            initialData={initialData}
            onBack={() => router.back()}
        />
    );
}
