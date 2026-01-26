import React, { useState } from 'react';
import { View, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, IconButton, useTheme, Surface, Divider, FAB } from 'react-native-paper';
import { ChatCircleDots as MessageCircle, Plus, Trash, PencilSimple as Edit2, Check as Save, X } from 'phosphor-react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import AppBottomSheet from '@/components/AppBottomSheet';

interface QuickRepliesFormProps {
    comercioId: Id<"comercios"> | null;
    onBack?: () => void;
}

export default function QuickRepliesForm({ comercioId, onBack }: QuickRepliesFormProps) {
    const theme = useTheme();
    const plantillas = useQuery(api.plantillas.list, comercioId ? { comercio_id: comercioId } : "skip");
    const createPlantilla = useMutation(api.plantillas.create);
    const updatePlantilla = useMutation(api.plantillas.update);
    const deletePlantilla = useMutation(api.plantillas.remove);

    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState<Id<"plantillas"> | null>(null);
    const [nombre, setNombre] = useState('');
    const [contenido, setContenido] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleOpenCreate = () => {
        setIsEditMode(false);
        setEditingId(null);
        setNombre('');
        setContenido('');
        setShowModal(true);
    };

    const handleOpenEdit = (p: any) => {
        setIsEditMode(true);
        setEditingId(p._id);
        setNombre(p.nombre);
        setContenido(p.contenido);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!comercioId || !nombre.trim() || !contenido.trim()) return;
        setSaving(true);
        try {
            if (isEditMode && editingId) {
                await updatePlantilla({ id: editingId, nombre, contenido });
            } else {
                await createPlantilla({ comercio_id: comercioId, nombre, contenido });
            }
            setShowModal(false);
            setNombre('');
            setContenido('');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo guardar la plantilla');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: Id<"plantillas">) => {
        Alert.alert(
            'Eliminar Plantilla',
            '¿Estás seguro de que deseas eliminar esta respuesta rápida?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deletePlantilla({ id });
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo eliminar');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F2F0EB' }}>
            {/* Lista de Plantillas */}
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                {plantillas === undefined ? (
                    <Text style={{ textAlign: 'center', marginTop: 20 }}>Cargando...</Text>
                ) : plantillas.length === 0 ? (
                    <View style={{ alignItems: 'center', marginTop: 60, opacity: 0.6 }}>
                        <MessageCircle size={48} color={theme.colors.onSurfaceVariant} />
                        <Text variant="bodyLarge" style={{ marginTop: 16, textAlign: 'center' }}>
                            No tienes respuestas rápidas aún. {'\n'}Crea una para usarla con "/" en el chat.
                        </Text>
                    </View>
                ) : (
                    <View style={{ gap: 12 }}>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
                            Escribe "/" seguido del nombre para usar estas plantillas en el chat.
                        </Text>
                        {plantillas.map((p) => (
                            <Surface key={p._id} style={{ borderRadius: 16, backgroundColor: theme.colors.surface }} elevation={0}>
                                <TouchableOpacity onPress={() => handleOpenEdit(p)} style={{ padding: 16 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <View style={{ flex: 1, marginRight: 12 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                                <Text style={{ fontWeight: 'bold', color: theme.colors.primary, fontSize: 16 }}>/{p.nombre}</Text>
                                            </View>
                                            <Text numberOfLines={2} variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                                {p.contenido}
                                            </Text>
                                        </View>
                                        <IconButton
                                            icon={() => <Trash size={20} color={theme.colors.error} />}
                                            onPress={() => handleDelete(p._id)}
                                            size={20}
                                        />
                                    </View>
                                </TouchableOpacity>
                            </Surface>
                        ))}
                    </View>
                )}
            </ScrollView>

            <FAB
                icon={() => <Plus size={24} color="white" />}
                style={{
                    position: 'absolute',
                    margin: 24,
                    right: 0,
                    bottom: 0,
                    backgroundColor: theme.colors.primary,
                    borderRadius: 16
                }}
                onPress={handleOpenCreate}
                label="Nueva Plantilla"
                color="white"
            />

            {/* Modal Crear/Editar */}
            <AppBottomSheet
                visible={showModal}
                onClose={() => setShowModal(false)}
                title={isEditMode ? "Editar Respuesta Rápida" : "Nueva Respuesta Rápida"}
                snapPoints={['60%', '80%']}
            >
                <View style={{ gap: 20, paddingBottom: 32 }}>
                    <View>
                        <TextInput
                            label="Nombre (Atajo)"
                            placeholder="Ej: saludo, precio, despedida"
                            value={nombre}
                            onChangeText={(t) => setNombre(t.replace(/\s+/g, '').toLowerCase())} // Forzar sin espacios y lowercase para usar como atajo
                            mode="outlined"
                            activeOutlineColor={theme.colors.primary}
                            left={<TextInput.Affix text="/" />}
                            style={{ backgroundColor: 'transparent' }}
                        />
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4, marginLeft: 4 }}>
                            Este es el comando que escribirás. Ej: /saludo
                        </Text>
                    </View>

                    <TextInput
                        label="Contenido del mensaje"
                        placeholder="Escribe el mensaje completo que se enviará..."
                        value={contenido}
                        onChangeText={setContenido}
                        mode="outlined"
                        multiline
                        numberOfLines={6}
                        activeOutlineColor={theme.colors.primary}
                        style={{ backgroundColor: 'transparent', maxHeight: 200 }}
                    />

                    <Button
                        mode="contained"
                        onPress={handleSave}
                        loading={saving}
                        disabled={saving || !nombre || !contenido}
                        style={{ borderRadius: 12, marginTop: 12, backgroundColor: theme.colors.primary }}
                        contentStyle={{ height: 48 }}
                    >
                        {isEditMode ? "Guardar Cambios" : "Crear Plantilla"}
                    </Button>
                </View>
            </AppBottomSheet>
        </View>
    );
}
