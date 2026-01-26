import React, { useState } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, View, Alert, Image } from 'react-native';
import { Text, IconButton, useTheme, Surface, Button, ActivityIndicator, TextInput, Divider } from 'react-native-paper';
import {
    Image as ImageIcon,
    X,
    Check as Save,
    Clock,
    Notepad
} from 'phosphor-react-native';
import * as ImagePicker from 'expo-image-picker';
import GlassmorphicHeader from '@/components/GlassmorphicHeader';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface BusinessImagesFormProps {
    comercioId: Id<"comercios"> | null;
    initialImagenes: string[];
    initialTiempos: string;
    onBack: () => void;
    onSaveSuccess?: () => void;
}

const ImagePreview = ({ storageId, onDelete }: { storageId: string, onDelete: () => void }) => {
    const isUrl = storageId.startsWith('http');
    const urlFromConvex = useQuery(api.files.getUrl, isUrl ? "skip" : { storageId });
    const displayUrl = isUrl ? storageId : urlFromConvex;

    if (!displayUrl) return (
        <View style={{ width: '48%', aspectRatio: 16 / 9, borderRadius: 12, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="small" />
        </View>
    );

    return (
        <View style={{ width: '48%', aspectRatio: 16 / 9, borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
            <Image source={{ uri: displayUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            <IconButton
                icon={() => <X size={16} color="white" />}
                style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', margin: 0, height: 24, width: 24 }}
                size={16}
                onPress={onDelete}
            />
        </View>
    );
};

export default function BusinessImagesForm({
    comercioId,
    initialImagenes,
    initialTiempos,
    onBack,
    onSaveSuccess,
}: BusinessImagesFormProps) {
    const theme = useTheme();

    const [imagenesMenu, setImagenesMenu] = useState<string[]>(initialImagenes || []);
    const [tiemposPreparacion, setTiemposPreparacion] = useState(initialTiempos || "");
    const [uploadingImage, setUploadingImage] = useState(false);
    const [saving, setSaving] = useState(false);

    const updateComercio = useMutation(api.comercios.update);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    const hasChanges =
        JSON.stringify(imagenesMenu) !== JSON.stringify(initialImagenes) ||
        tiemposPreparacion !== initialTiempos;

    const handleSave = async () => {
        if (!comercioId) return;
        setSaving(true);
        try {
            await updateComercio({
                id: comercioId,
                updates: {
                    imagenes_menu: imagenesMenu,
                    tiempos_preparacion: tiemposPreparacion,
                }
            });
            Alert.alert('Éxito', 'Información actualizada correctamente');
            onSaveSuccess?.();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'No se pudo guardar');
        } finally {
            setSaving(false);
        }
    };

    const handlePickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') return;

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.7,
                allowsEditing: true,
                aspect: [16, 9],
            });

            if (!result.canceled && result.assets[0]) {
                setUploadingImage(true);
                const asset = result.assets[0];
                const postUrl = await generateUploadUrl();
                const response = await fetch(asset.uri);
                const blob = await response.blob();

                const resultUpload = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": blob.type },
                    body: blob,
                });
                const { storageId } = await resultUpload.json();
                setImagenesMenu(prev => [...prev, storageId]);
                Alert.alert('✅ Éxito', 'Imagen subida correctamente');
            }
        } catch (error: any) {
            Alert.alert('❌ Error', 'No se pudo subir la imagen');
        } finally {
            setUploadingImage(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F2F0EB' }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ paddingTop: 85, paddingHorizontal: 16, paddingBottom: 150 }}>
                    <View style={{ gap: 20 }}>
                        {/* Sección Imágenes */}
                        <Surface style={{ backgroundColor: theme.colors.surface, padding: 24, borderRadius: 24, gap: 16 }} elevation={0}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                <ImageIcon size={22} color={theme.colors.primary} />
                                <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>Imágenes del Menú</Text>
                            </View>

                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                                {imagenesMenu.map((id, index) => (
                                    <ImagePreview key={`${id}-${index}`} storageId={id} onDelete={() => setImagenesMenu(prev => prev.filter((_, i) => i !== index))} />
                                ))}
                            </View>
                            <Button
                                mode="outlined"
                                onPress={handlePickImage}
                                loading={uploadingImage}
                                disabled={uploadingImage}
                                icon={() => <ImageIcon size={20} color={uploadingImage ? theme.colors.onSurfaceVariant : theme.colors.primary} />}
                                style={{ borderColor: theme.colors.primary, borderRadius: 12 }}
                                labelStyle={{ color: theme.colors.primary }}
                            >
                                Subir Imagen del Menú
                            </Button>
                        </Surface>

                        {/* Sección Tiempos y Contexto */}
                        <Surface style={{ backgroundColor: theme.colors.surface, padding: 24, borderRadius: 24, gap: 16 }} elevation={0}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                <Clock size={22} color={theme.colors.primary} />
                                <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>Contexto y Tiempos</Text>
                            </View>

                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                Explica cuánto suelen demorar los pedidos y qué debe saber el cliente sobre la preparación.
                            </Text>

                            <TextInput
                                mode="outlined"
                                label="Tiempos y Detalles de Preparación"
                                value={tiemposPreparacion}
                                onChangeText={setTiemposPreparacion}
                                multiline
                                numberOfLines={6}
                                placeholder="Ej: Las hamburguesas demoran 15-20 min. Los fines de semana puede haber demoras de hasta 40 min..."
                                activeOutlineColor="#00754A"
                                outlineStyle={{ borderRadius: 12 }}
                                style={{ backgroundColor: 'transparent' }}
                            />
                        </Surface>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <GlassmorphicHeader
                title="Carta y Tiempos"
                icon={Notepad}
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
