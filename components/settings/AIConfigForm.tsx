import React, { useState } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, View, Alert, DeviceEventEmitter, useWindowDimensions } from 'react-native';
import { Text, TextInput, Button, Switch, IconButton, useTheme, Surface } from 'react-native-paper';
import {
    Sparkle,
    Robot as Bot,
    ArrowLeft,
    Check as Save,
    Quotes as MessageSquareQuote,
    WarningCircle as AlertCircle,
} from 'phosphor-react-native';
import GlassmorphicHeader from '@/components/GlassmorphicHeader';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface AIConfigFormProps {
    comercioId: Id<"comercios"> | null;
    initialData: {
        nombreIA: string;
        personalidad: string;
        directrices: string;
        iaActiva: boolean;
        reglasEscalacion: string;
    };
    onBack: () => void;
    onSaveSuccess?: () => void;
}

export default function AIConfigForm({
    comercioId,
    initialData,
    onBack,
    onSaveSuccess,
}: AIConfigFormProps) {
    const theme = useTheme();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024 && Platform.OS === 'web';

    const [nombreIA, setNombreIA] = useState(initialData.nombreIA);
    const [personalidad, setPersonalidad] = useState(initialData.personalidad);
    const [directrices, setDirectrices] = useState(initialData.directrices);
    const [iaActiva, setIaActiva] = useState(initialData.iaActiva);
    const [reglasEscalacion, setReglasEscalacion] = useState(initialData.reglasEscalacion || '');
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const updateComercio = useMutation(api.comercios.update);

    // Sincronizar estado local si initialData cambia
    React.useEffect(() => {
        setNombreIA(initialData.nombreIA);
        setPersonalidad(initialData.personalidad);
        setDirectrices(initialData.directrices);
        setIaActiva(initialData.iaActiva);
        setReglasEscalacion(initialData.reglasEscalacion || '');
    }, [initialData]);

    // Detectar cambios sin guardar
    React.useEffect(() => {
        const changed =
            nombreIA !== initialData.nombreIA ||
            personalidad !== initialData.personalidad ||
            directrices !== initialData.directrices ||
            iaActiva !== initialData.iaActiva ||
            reglasEscalacion !== (initialData.reglasEscalacion || '');

        setHasChanges(changed);
    }, [nombreIA, personalidad, directrices, iaActiva, reglasEscalacion, initialData]);

    const handleSave = async () => {
        if (!comercioId) {
            Alert.alert('Error', 'ID de comercio no encontrado');
            return;
        }

        setSaving(true);
        try {
            await updateComercio({
                id: comercioId,
                updates: {
                    nombre_asistente: nombreIA,
                    prompt_personalidad: personalidad,
                    directrices_comunicacion: directrices,
                    ia_activa: iaActiva,
                    reglas_escalacion: reglasEscalacion,
                }
            });

            Alert.alert('Éxito', 'Configuración de IA guardada correctamente');
            setHasChanges(false);
            onSaveSuccess?.();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'No se pudo guardar');
        } finally {
            setSaving(false);
        }
    };

    React.useEffect(() => {
        const sub = DeviceEventEmitter.addListener('WEB_SAVE_SETTINGS', () => {
            handleSave();
        });
        return () => sub.remove();
    }, [nombreIA, personalidad, directrices, iaActiva, reglasEscalacion, comercioId]);

    return (
        <View style={{ flex: 1, backgroundColor: '#F2F0EB' }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingTop: 85, paddingHorizontal: 16, paddingBottom: 150 }}
                >
                    <View style={{ gap: 20 }}>
                        {/* Estado del Asistente */}
                        <Surface style={{
                            backgroundColor: theme.colors.surface,
                            padding: 20,
                            borderRadius: 24,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }} elevation={0}>
                            <View style={{ flex: 1 }}>
                                <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary, marginBottom: 4 }}>
                                    Asistente Activo
                                </Text>
                                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                    {iaActiva ? 'La IA está respondiendo mensajes' : 'La IA está desactivada'}
                                </Text>
                            </View>
                            <Switch value={iaActiva} onValueChange={setIaActiva} color="#00754A" />
                        </Surface>

                        {/* Identidad del Bot */}
                        <Surface style={{
                            backgroundColor: theme.colors.surface,
                            padding: 24,
                            borderRadius: 24,
                            gap: 16,
                        }} elevation={0}>
                            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary, marginBottom: 4 }}>
                                Identidad
                            </Text>

                            <TextInput
                                label="Nombre del Asistente"
                                value={nombreIA}
                                onChangeText={setNombreIA}
                                mode="outlined"
                                activeOutlineColor="#00754A"
                                selectionColor="rgba(0, 117, 74, 0.2)"
                                cursorColor="#00754A"
                                outlineStyle={{ borderRadius: 12 }}
                                style={{ backgroundColor: 'transparent' }}
                                left={<TextInput.Icon icon={() => <Bot size={20} color={theme.colors.primary} />} />}
                            />
                        </Surface>

                        {/* Comportamiento */}
                        <Surface style={{
                            backgroundColor: theme.colors.surface,
                            padding: 24,
                            borderRadius: 24,
                            gap: 16,
                        }} elevation={0}>
                            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary, marginBottom: 4 }}>
                                Comportamiento
                            </Text>

                            <TextInput
                                label="Personalidad"
                                value={personalidad}
                                onChangeText={setPersonalidad}
                                mode="outlined"
                                multiline
                                numberOfLines={4}
                                activeOutlineColor="#00754A"
                                selectionColor="rgba(0, 117, 74, 0.2)"
                                cursorColor="#00754A"
                                outlineStyle={{ borderRadius: 12 }}
                                style={{ backgroundColor: 'transparent' }}
                                placeholder="Ej: Amigable, profesional, servicial..."
                                left={<TextInput.Icon icon={() => <Sparkle size={20} color="#00754A" />} />}
                            />

                            <TextInput
                                label="Estilo de Comunicación"
                                value={directrices}
                                onChangeText={setDirectrices}
                                mode="outlined"
                                multiline
                                numberOfLines={4}
                                activeOutlineColor="#00754A"
                                selectionColor="rgba(0, 117, 74, 0.2)"
                                cursorColor="#00754A"
                                outlineStyle={{ borderRadius: 12 }}
                                style={{ backgroundColor: 'transparent' }}
                                placeholder="Ej: Siempre saludar, ofrecer promociones..."
                                left={<TextInput.Icon icon={() => <MessageSquareQuote size={20} color="#00754A" />} />}
                            />

                        </Surface>

                        {/* Reglas de Escalación */}
                        <Surface style={{
                            backgroundColor: theme.colors.surface,
                            padding: 24,
                            borderRadius: 24,
                            gap: 16,
                        }} elevation={0}>
                            <View>
                                <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary, marginBottom: 4 }}>
                                    Auto-pausa (Escalación)
                                </Text>
                                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
                                    Situaciones donde la IA debe detenerse y pasarte el chat.
                                </Text>
                            </View>

                            <TextInput
                                label="Reglas Personalizadas"
                                value={reglasEscalacion}
                                onChangeText={setReglasEscalacion}
                                mode="outlined"
                                multiline
                                numberOfLines={4}
                                activeOutlineColor="#00754A"
                                selectionColor="rgba(0, 117, 74, 0.2)"
                                cursorColor="#00754A"
                                outlineStyle={{ borderRadius: 12 }}
                                style={{ backgroundColor: 'transparent' }}
                                placeholder="Ej: Si el cliente usa groserías, si no entiende el menú..."
                                left={<TextInput.Icon icon={() => <AlertCircle size={20} color="#00754A" />} />}
                            />

                            <View style={{
                                backgroundColor: 'rgba(0, 117, 74, 0.05)',
                                padding: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: 'rgba(0, 117, 74, 0.1)',
                                flexDirection: 'row',
                                gap: 10,
                                alignItems: 'center'
                            }}>
                                <Bot size={18} color="#00754A" />
                                <Text variant="bodySmall" style={{ color: '#1E3932', flex: 1, fontWeight: '500' }}>
                                    Detección de emociones activa por defecto: La IA escalará automáticamente si detecta clientes molestos o agresivos.
                                </Text>
                            </View>
                        </Surface>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <GlassmorphicHeader
                title="Asistente IA"
                icon={Sparkle}
                onBack={onBack}
                actionButton={
                    <IconButton
                        icon={() => <Save size={20} color={saving ? theme.colors.onSurfaceVariant : (hasChanges ? '#FFFFFF' : theme.colors.onSurfaceVariant)} />}
                        onPress={handleSave}
                        disabled={saving || !hasChanges}
                        loading={saving}
                        style={{
                            backgroundColor: saving ? theme.colors.surfaceVariant : (hasChanges ? '#10B981' : theme.colors.surfaceVariant),
                            borderRadius: 99,
                            margin: 0,
                            width: 44,
                            height: 44,
                            shadowColor: hasChanges ? '#10B981' : 'transparent',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: hasChanges ? 0.5 : 0,
                            shadowRadius: hasChanges ? 12 : 0,
                            elevation: hasChanges ? 8 : 0,
                        }}
                    />
                }
            />
        </View>
    );
}
