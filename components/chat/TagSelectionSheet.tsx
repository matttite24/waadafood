import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Checkbox, Button, useTheme, ActivityIndicator } from 'react-native-paper';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import AppBottomSheet from '@/components/AppBottomSheet';
import { Id } from '@/convex/_generated/dataModel';
import { Check, Tag as TagIcon } from 'phosphor-react-native';

interface TagSelectionSheetProps {
    visible: boolean;
    onClose: () => void;
    clienteId: Id<"clientes"> | null;
    comercioId: Id<"comercios">;
    initialTagIds?: Id<"etiquetas">[];
}

export default function TagSelectionSheet({
    visible,
    onClose,
    clienteId,
    comercioId,
    initialTagIds = []
}: TagSelectionSheetProps) {
    const theme = useTheme();
    const etiquetas = useQuery(api.etiquetas.listByComercio, { comercio_id: comercioId });
    const aplicarEtiquetas = useMutation(api.etiquetas.aplicarEtiquetas);

    const [selectedIds, setSelectedIds] = useState<Id<"etiquetas">[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (visible) {
            setSelectedIds(initialTagIds);
        }
    }, [visible, initialTagIds]);

    const toggleTag = (id: Id<"etiquetas">) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const handleConfirm = async () => {
        if (!clienteId) return;
        setSaving(true);
        try {
            await aplicarEtiquetas({
                cliente_id: clienteId,
                etiquetas_ids: selectedIds
            });
            onClose();
        } catch (error) {
            console.error('Error applying tags:', error);
        } finally {
            setSaving(false);
        }
    };

    const isLoading = etiquetas === undefined;

    return (
        <AppBottomSheet
            visible={visible}
            onClose={onClose}
            title="Etiquetar Chat"
            snapPoints={['50%', '70%']}
        >
            <View style={styles.container}>
                {isLoading ? (
                    <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
                ) : etiquetas && etiquetas.length > 0 ? (
                    <View style={styles.list}>
                        {etiquetas.map((tag) => {
                            const isSelected = selectedIds.includes(tag._id);
                            return (
                                <TouchableOpacity
                                    key={tag._id}
                                    style={[
                                        styles.tagItem,
                                        { backgroundColor: isSelected ? `${tag.color}15` : '#F8FAFC' }
                                    ]}
                                    onPress={() => toggleTag(tag._id)}
                                >
                                    <View style={[styles.tagColor, { backgroundColor: tag.color }]} />
                                    <Text style={[styles.tagName, { color: isSelected ? tag.color : '#1E3932' }]}>
                                        {tag.nombre}
                                    </Text>
                                    {isSelected && <Check size={20} color={tag.color} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ) : (
                    <View style={styles.empty}>
                        <TagIcon size={48} color="#CBD5E1" />
                        <Text style={styles.emptyText}>No tienes etiquetas configuradas.</Text>
                        <Text style={styles.emptySubtext}>Puedes crearlas en Ajustes - Etiquetas.</Text>
                    </View>
                )}

                <View style={styles.footer}>
                    <Button
                        mode="contained"
                        onPress={handleConfirm}
                        loading={saving}
                        disabled={saving || !clienteId}
                        style={styles.confirmButton}
                    >
                        Confirmar
                    </Button>
                </View>
            </View>
        </AppBottomSheet>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingTop: 10,
    },
    loader: {
        marginVertical: 40,
    },
    list: {
        gap: 12,
    },
    tagItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    tagColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    tagName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
    },
    footer: {
        marginTop: 24,
    },
    confirmButton: {
        borderRadius: 12,
        paddingVertical: 4,
    },
    empty: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '700',
        color: '#64748B',
    },
    emptySubtext: {
        marginTop: 4,
        fontSize: 14,
        color: '#94A3B8',
    },
});
