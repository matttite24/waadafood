import React, { useState } from 'react';
import { View, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Button, useTheme, Surface, Avatar, Divider, Switch, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import GlassmorphicHeader from '@/components/GlassmorphicHeader';
import { User, SignOut as LogOut, Shield, Key, Trash } from 'phosphor-react-native';

export default function AccountScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { signOut } = useAuth();
    const { user } = useUser();
    const [loadingSignOut, setLoadingSignOut] = useState(false);

    const handleSignOut = async () => {
        setLoadingSignOut(true);
        try {
            await signOut();
            // Router redirect handled by layout
        } catch (error) {
            console.error(error);
            setLoadingSignOut(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Eliminar Cuenta",
            "¿Estás seguro de que deseas eliminar permanentemente tu cuenta? Esta acción no se puede deshacer.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: () => Alert.alert("Información", "Por favor contacta a soporte para proceder con la eliminación completa.")
                }
            ]
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F2F0EB' }}>
            <GlassmorphicHeader title="Cuenta y Equipo" icon={User} onBack={() => router.back()} />

            <ScrollView contentContainerStyle={{ paddingTop: 100, paddingHorizontal: 16, paddingBottom: 40, gap: 20 }}>

                {/* Perfil del Usuario */}
                <Surface style={{ padding: 24, borderRadius: 24, backgroundColor: theme.colors.surface, alignItems: 'center', gap: 12 }} elevation={0}>
                    <Avatar.Image
                        size={80}
                        source={{ uri: user?.imageUrl }}
                        style={{ backgroundColor: theme.colors.primaryContainer }}
                    />
                    <View style={{ alignItems: 'center' }}>
                        <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                            {user?.fullName || 'Usuario'}
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            {user?.primaryEmailAddress?.emailAddress}
                        </Text>
                    </View>
                    <Button
                        mode="outlined"
                        onPress={handleSignOut}
                        loading={loadingSignOut}
                        icon={() => <LogOut size={18} color={theme.colors.error} />}
                        textColor={theme.colors.error}
                        style={{ borderColor: theme.colors.errorContainer, borderRadius: 12, marginTop: 8 }}
                    >
                        Cerrar Sesión
                    </Button>
                </Surface>

                {/* Seguridad y Acceso */}
                <Text variant="labelLarge" style={{ marginLeft: 8, color: theme.colors.primary, fontWeight: '700' }}>SEGURIDAD</Text>

                <Surface style={{ borderRadius: 24, backgroundColor: theme.colors.surface, overflow: 'hidden' }} elevation={0}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
                        <View style={{ backgroundColor: '#FFF3E0', padding: 10, borderRadius: 12, marginRight: 16 }}>
                            <Key size={22} color="#F57C00" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text variant="titleMedium" style={{ fontWeight: '600' }}>Contraseña</Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Gestionar vía proveedor de identidad</Text>
                        </View>
                        <Button mode="text" labelStyle={{ fontWeight: '700' }} textColor={theme.colors.primary}>Cambiar</Button>
                    </View>

                    <TouchableOpacity onPress={handleDeleteAccount} activeOpacity={0.7}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                            <View style={{ backgroundColor: '#FFEBEE', padding: 10, borderRadius: 12, marginRight: 16 }}>
                                <Trash size={22} color={theme.colors.error} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text variant="titleMedium" style={{ fontWeight: '600', color: theme.colors.error }}>Eliminar Cuenta</Text>
                                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Acción irreversible</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </Surface>

                {/* Conexiones Sociales (Mockup) */}
                <Text variant="labelLarge" style={{ marginLeft: 8, color: theme.colors.primary, fontWeight: '700' }}>CONEXIONES</Text>

                <Surface style={{ borderRadius: 24, backgroundColor: theme.colors.surface, overflow: 'hidden' }} elevation={0}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
                        <View style={{ width: 40, height: 40, backgroundColor: '#4285F4', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20 }}>G</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text variant="titleMedium" style={{ fontWeight: '600' }}>Google</Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Conectado como {user?.primaryEmailAddress?.emailAddress}</Text>
                        </View>
                        <Switch value={true} color={theme.colors.primary} />
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                        <View style={{ width: 40, height: 40, backgroundColor: '#1877F2', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20 }}>f</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text variant="titleMedium" style={{ fontWeight: '600' }}>Facebook</Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>No conectado</Text>
                        </View>
                        <Switch value={false} color={theme.colors.primary} />
                    </View>
                </Surface>

            </ScrollView>
        </View>
    );
}
