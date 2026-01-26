import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, List, useTheme } from 'react-native-paper';
import {
    Storefront,
    Sparkle,
    CaretRight,
    Gear as SettingsIcon,
    CurrencyCircleDollar,
    Clock,
    CheckCircle,
    ChatCircleText as MessageCircle,
    Link,
    Lock,
    Trash,
    Question,
    WarningCircle,
    Info,
    CaretDown,
    Notepad,
    Tag,
    Lightning as Zap,
    User
} from 'phosphor-react-native';
import { useRouter, usePathname } from 'expo-router';
import { useWindowDimensions, Platform } from 'react-native';
import GlassmorphicHeader from '@/components/GlassmorphicHeader';

interface SettingsListProps {
    searchQuery?: string;
}

export default function SettingsList({ searchQuery }: SettingsListProps) {
    const theme = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024 && Platform.OS === 'web';

    const isInternal = (path: string) => pathname === path;

    const renderItem = (title: string, description: string, icon: any, path: string, color?: string) => {
        const Icon = icon;

        return (
            <List.Item
                title={title}
                description={description}
                left={() => (
                    <View style={{ justifyContent: 'center', marginLeft: 8 }}>
                        <View style={{
                            backgroundColor: color ? `${color}15` : theme.colors.primaryContainer,
                            padding: 10,
                            borderRadius: 12
                        }}>
                            <Icon size={20} color={color || theme.colors.primary} />
                        </View>
                    </View>
                )}
                right={() => <List.Icon icon={() => <CaretRight size={18} color={theme.colors.onSurfaceVariant} />} />}
                onPress={() => router.push(path as any)}
                style={{
                    backgroundColor: 'transparent',
                    marginHorizontal: 8,
                    borderRadius: 16,
                    marginVertical: 2,
                }}
                titleStyle={{ fontWeight: '700', color: theme.colors.onSurface, fontSize: 14 }}
                descriptionStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 11 }}
            />
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <GlassmorphicHeader
                title="Ajustes"
                icon={SettingsIcon}
                rightIcon={User}
                onRightPress={() => router.push('/settings/account')}
            />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingTop: 110, paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Configuración General */}
                <View style={{ marginBottom: 20 }}>
                    <Text variant="labelMedium" style={{
                        color: theme.colors.primary,
                        fontWeight: '800',
                        paddingHorizontal: 24,
                        marginBottom: 12,
                        letterSpacing: 1
                    }}>
                        GENERAL
                    </Text>
                    {renderItem("Información", "Datos básicos y ubicación", Storefront, "/settings/info")}
                    {renderItem("Horario", "Atención al público", Clock, "/settings/horario")}
                    {renderItem("Pagos", "Métodos aceptados", CurrencyCircleDollar, "/settings/pagos", "#22c55e")}
                    {renderItem("Carta y Tiempos", "Imágenes y tiempos de espera", Notepad, "/settings/menu-imagenes")}
                </View>

                {/* Comunicación */}
                <View style={{ marginBottom: 20 }}>
                    <Text variant="labelMedium" style={{
                        color: theme.colors.primary,
                        fontWeight: '800',
                        paddingHorizontal: 24,
                        marginBottom: 12,
                        letterSpacing: 1
                    }}>
                        CHAT
                    </Text>
                    {renderItem("Asistente IA", "Bot y personalidad", Sparkle, "/settings/ia")}
                    {renderItem("Créditos IA", "Mensajes disponibles", Zap, "/settings/creditos", "#EAB308")}
                    {renderItem("Mensajes", "Respuestas rápidas", MessageCircle, "/settings/auto-messages", "#ec4899")}
                    {renderItem("Etiquetas", "Organiza tus chats", Tag, "/settings/etiquetas", "#8B5CF6")}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    // Estilos previos eliminados ya que no usaba mainContent
});
