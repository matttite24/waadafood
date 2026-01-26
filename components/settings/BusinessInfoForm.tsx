import React, { useState, useEffect } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, View, Alert, TouchableOpacity, DeviceEventEmitter, useWindowDimensions } from 'react-native';
import { Text, TextInput, IconButton, useTheme, Surface } from 'react-native-paper';
import {
    Storefront as Building2,
    Check as Save,
    MapPin,
    Quotes as MessageSquareQuote,
    MapTrifold as MapIcon,
    Phone,
} from 'phosphor-react-native';
import GlassmorphicHeader from '@/components/GlassmorphicHeader';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface BusinessInfoFormProps {
    comercioId: Id<"comercios"> | null;
    initialData: {
        nombre: string;
        descripcion: string;
        direccion: string;
        ciudad?: string;
        googleMapsLink?: string;
        telefono?: string;
    };
    onBack: () => void;
    onSaveSuccess?: () => void;
}

export default function BusinessInfoForm({
    comercioId,
    initialData,
    onBack,
    onSaveSuccess,
}: BusinessInfoFormProps) {
    const theme = useTheme();
    const { width } = useWindowDimensions();

    const [nombre, setNombre] = useState(initialData.nombre);
    const [descripcion, setDescripcion] = useState(initialData.descripcion);
    const [direccion, setDireccion] = useState(initialData.direccion);
    const [ciudad, setCiudad] = useState(initialData.ciudad || '');
    const [telefono, setTelefono] = useState(initialData.telefono || '');
    const [googleMapsLink, setGoogleMapsLink] = useState(initialData.googleMapsLink || '');
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const updateComercio = useMutation(api.comercios.update);

    // Detect changes
    useEffect(() => {
        const changed =
            nombre !== initialData.nombre ||
            descripcion !== initialData.descripcion ||
            direccion !== initialData.direccion ||
            ciudad !== (initialData.ciudad || '') ||
            telefono !== (initialData.telefono || '') ||
            googleMapsLink !== (initialData.googleMapsLink || '');

        setHasChanges(changed);
    }, [nombre, descripcion, direccion, ciudad, telefono, googleMapsLink, initialData]);

    const handleSave = async () => {
        if (!comercioId) return;
        setSaving(true);
        try {
            await updateComercio({
                id: comercioId,
                updates: {
                    nombre_comercio: nombre,
                    descripcion_corta: descripcion,
                    direccion: direccion,
                    ciudad: ciudad,
                    telefono_contacto: telefono,
                    google_maps_link: googleMapsLink,
                }
            });
            setHasChanges(false);
            Alert.alert('Éxito', 'Información guardada correctamente');
            onSaveSuccess?.();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'No se pudo guardar');
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        const sub = DeviceEventEmitter.addListener('WEB_SAVE_SETTINGS', () => {
            handleSave();
        });
        return () => sub.remove();
    }, [handleSave]);

    return (
        <View style={{ flex: 1, backgroundColor: '#F2F0EB' }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ paddingTop: 85, paddingHorizontal: 16, paddingBottom: 150 }}>
                    <View style={{ gap: 20 }}>
                        {/* Datos Básicos */}
                        <Surface style={{ backgroundColor: theme.colors.surface, padding: 24, borderRadius: 24, gap: 16 }} elevation={0}>
                            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary, marginBottom: 4 }}>
                                Datos Básicos
                            </Text>
                            <TextInput
                                label="Nombre del Negocio"
                                value={nombre}
                                onChangeText={setNombre}
                                mode="outlined"
                                activeOutlineColor="#00754A"
                                outlineStyle={{ borderRadius: 12 }}
                                style={{ backgroundColor: 'transparent' }}
                                left={<TextInput.Icon icon={() => <Building2 size={20} color={theme.colors.primary} />} />}
                            />
                            <TextInput
                                label="Teléfono de Contacto"
                                value={telefono}
                                onChangeText={setTelefono}
                                mode="outlined"
                                keyboardType="phone-pad"
                                activeOutlineColor="#00754A"
                                outlineStyle={{ borderRadius: 12 }}
                                style={{ backgroundColor: 'transparent' }}
                                left={<TextInput.Icon icon={() => <Phone size={20} color="#00754A" />} />}
                            />
                            <TextInput
                                label="Descripción del Negocio"
                                value={descripcion}
                                onChangeText={setDescripcion}
                                mode="outlined"
                                multiline
                                numberOfLines={3}
                                activeOutlineColor="#00754A"
                                outlineStyle={{ borderRadius: 12 }}
                                style={{ backgroundColor: 'transparent' }}
                                left={<TextInput.Icon icon={() => <MessageSquareQuote size={20} color="#00754A" />} />}
                            />
                        </Surface>

                        {/* Ubicación */}
                        <Surface style={{ backgroundColor: theme.colors.surface, padding: 24, borderRadius: 24, gap: 16 }} elevation={0}>
                            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary, marginBottom: 4 }}>
                                Ubicación
                            </Text>
                            <TextInput label="Ciudad" value={ciudad} onChangeText={setCiudad} mode="outlined" activeOutlineColor="#00754A" outlineStyle={{ borderRadius: 12 }} style={{ backgroundColor: 'transparent' }} left={<TextInput.Icon icon={() => <MapPin size={20} color="#00754A" />} />} />
                            <TextInput label="Dirección Completa" value={direccion} onChangeText={setDireccion} mode="outlined" activeOutlineColor="#00754A" outlineStyle={{ borderRadius: 12 }} style={{ backgroundColor: 'transparent' }} left={<TextInput.Icon icon={() => <MapPin size={20} color="#00754A" />} />} />
                            <TextInput label="Link de Google Maps" value={googleMapsLink} onChangeText={setGoogleMapsLink} mode="outlined" activeOutlineColor="#00754A" outlineStyle={{ borderRadius: 12 }} style={{ backgroundColor: 'transparent' }} left={<TextInput.Icon icon={() => <MapIcon size={20} color="#00754A" />} />} />
                        </Surface>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <GlassmorphicHeader
                title="Información"
                icon={Building2}
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
