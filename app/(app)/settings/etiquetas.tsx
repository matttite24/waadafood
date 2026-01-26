import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, TextInput, Button, useTheme, Card, IconButton, Portal, Modal, List } from 'react-native-paper';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import GlassmorphicHeader from '@/components/GlassmorphicHeader';
import { Tag, Plus, Trash, PencilSimple as Edit2, Check } from 'phosphor-react-native';
import { Id } from '@/convex/_generated/dataModel';
import { useAuth } from '@clerk/clerk-expo';

const COLORS = [
    '#00754A', // Brand Green
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#3B82F6', // Blue
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#64748B', // Slate
    '#1E3932', // Dark Green
];

export default function EtiquetasScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { userId } = useAuth();

    const commerce = useQuery(api.comercios.getByUserId, userId ? { userId } : "skip");
    const etiquetas = useQuery(api.etiquetas.listByComercio, commerce ? { comercio_id: commerce._id } : "skip");

    const createEtiqueta = useMutation(api.etiquetas.create);
    const updateEtiqueta = useMutation(api.etiquetas.update);
    const removeEtiqueta = useMutation(api.etiquetas.remove);

    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState<Id<"etiquetas"> | null>(null);
    const [nombre, setNombre] = useState('');
    const [color, setColor] = useState(COLORS[0]);

    if (!commerce) return null;

    const handleSave = async () => {
        if (!nombre.trim()) return;

        try {
            if (editingId) {
                await updateEtiqueta({ id: editingId, nombre, color });
            } else {
                await createEtiqueta({ comercio_id: commerce._id, nombre, color });
            }
            closeModal();
        } catch (error) {
            Alert.alert('Error', 'No se pudo guardar la etiqueta');
        }
    };

    const handleDelete = (id: Id<"etiquetas">) => {
        Alert.alert(
            'Eliminar Etiqueta',
            '¿Estás seguro de que deseas eliminar esta etiqueta? Se quitará de todos los chats.',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => removeEtiqueta({ id }) }
            ]
        );
    };

    const openModal = (etiqueta?: any) => {
        if (etiqueta) {
            setEditingId(etiqueta._id);
            setNombre(etiqueta.nombre);
            setColor(etiqueta.color);
        } else {
            setEditingId(null);
            setNombre('');
            setColor(COLORS[0]);
        }
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingId(null);
        setNombre('');
    };

    return (
        <View style={styles.container}>
            <GlassmorphicHeader
                title="Etiquetas"
                icon={Tag}
                onBack={() => router.back()}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                    Etiquetas Disponibles
                </Text>

                <View style={styles.grid}>
                    {etiquetas?.map((item) => (
                        <Card key={item._id} style={styles.card}>
                            <Card.Content style={styles.cardContent}>
                                <View style={[styles.tagPreview, { backgroundColor: item.color }]}>
                                    <Text style={styles.tagText}>{item.nombre}</Text>
                                </View>
                                <View style={styles.actions}>
                                    <IconButton
                                        icon={() => <Edit2 size={18} color={theme.colors.primary} />}
                                        onPress={() => openModal(item)}
                                    />
                                    <IconButton
                                        icon={() => <Trash size={18} color="#EF4444" />}
                                        onPress={() => handleDelete(item._id)}
                                    />
                                </View>
                            </Card.Content>
                        </Card>
                    ))}

                    <TouchableOpacity style={styles.addCard} onPress={() => openModal()}>
                        <Plus size={32} color={theme.colors.primary} />
                        <Text style={{ color: theme.colors.primary, fontWeight: '700', marginTop: 8 }}>
                            Nueva Etiqueta
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Portal>
                <Modal visible={modalVisible} onDismiss={closeModal} contentContainerStyle={styles.modal}>
                    <Text variant="headlineSmall" style={styles.modalTitle}>
                        {editingId ? 'Editar Etiqueta' : 'Nueva Etiqueta'}
                    </Text>

                    <TextInput
                        label="Nombre de la etiqueta"
                        value={nombre}
                        onChangeText={setNombre}
                        mode="outlined"
                        style={styles.input}
                    />

                    <Text variant="labelLarge" style={styles.label}>
                        Color
                    </Text>
                    <View style={styles.colorGrid}>
                        {COLORS.map((c) => (
                            <TouchableOpacity
                                key={c}
                                style={[
                                    styles.colorCircle,
                                    { backgroundColor: c },
                                    color === c && styles.selectedColor
                                ]}
                                onPress={() => setColor(c)}
                            >
                                {color === c && <Check size={16} color="#FFF" />}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.modalActions}>
                        <Button onPress={closeModal}>Cancelar</Button>
                        <Button mode="contained" onPress={handleSave} disabled={!nombre.trim()}>
                            Guardar
                        </Button>
                    </View>
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        paddingTop: 120,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    sectionTitle: {
        marginBottom: 16,
        color: '#1E3932',
        fontWeight: '800',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    card: {
        width: '48%',
        borderRadius: 16,
        backgroundColor: '#FFF',
        elevation: 2,
    },
    cardContent: {
        padding: 12,
        alignItems: 'center',
    },
    tagPreview: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 12,
    },
    tagText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 12,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    addCard: {
        width: '48%',
        height: 120,
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        backgroundColor: 'white',
        padding: 24,
        margin: 20,
        borderRadius: 20,
    },
    modalTitle: {
        marginBottom: 20,
        fontWeight: '800',
        color: '#1E3932',
    },
    input: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 12,
        color: '#64748B',
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    colorCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedColor: {
        borderWidth: 3,
        borderColor: '#000',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
});
