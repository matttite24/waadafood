import React from 'react';
import { View, ScrollView, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Switch, ActivityIndicator, useTheme } from 'react-native-paper';
import { Check as Save, Camera, ForkKnife as Utensils, Trash, X } from 'phosphor-react-native';
import AppImage from '@/components/AppImage';
import AppChip from '@/components/AppChip';
import { useProductoForm } from '@/hooks/useProductoForm';

const CATEGORIAS_LISTA = ['Combos', 'Entradas', 'Principales', 'Bebidas', 'Postres'];

interface FormularioProductoProps {
    productId: string;
    onComplete?: () => void;
    showImage?: boolean;
    disableScroll?: boolean;
}

export default function FormularioProducto({ productId, onComplete, showImage = true, disableScroll = false }: FormularioProductoProps) {
    const theme = useTheme();
    const {
        loading,
        saving,
        lastSaved,
        isDirty,
        deleting,
        uploadingImage,
        nombre,
        descripcion,
        precio,
        categoria,
        disponible,
        imagenUrl,
        setNombre,
        setDescripcion,
        setPrecio,
        setCategoria,
        setDisponible,
        handleGuardar,
        handleEliminar,
        handleSeleccionarImagen,
        handleEliminarImagen,
    } = useProductoForm(productId, onComplete);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={theme.colors.primary} size="large" />
                <Text style={styles.loadingText}>Cargando detalles...</Text>
            </View>
        );
    }

    const ContentWrapper = disableScroll ? View : ScrollView;
    const wrapperProps = disableScroll
        ? { style: styles.container }
        : {
            style: styles.container,
            showsVerticalScrollIndicator: false,
            keyboardShouldPersistTaps: "handled" as const,
            contentContainerStyle: styles.scrollContent,
        };

    return (
        <ContentWrapper {...wrapperProps}>
            {showImage && (
                <View style={styles.imageSectionOuter}>
                    <View style={styles.imageSection}>
                        {imagenUrl ? (
                            <View style={styles.imageWrapper}>
                                <AppImage
                                    source={{ uri: imagenUrl }}
                                    style={styles.heroImage}
                                    containerStyle={styles.heroImageContainer}
                                    resizeMode="cover"
                                />
                                <View style={styles.imageOverlay} />
                            </View>
                        ) : (
                            <View style={styles.placeholderHero}>
                                <View style={styles.placeholderIconContainer}>
                                    <Utensils size={40} color="rgba(0,0,0,0.2)" />
                                </View>
                                <Text style={styles.placeholderText}>Agregar Imagen</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={imagenUrl ? handleEliminarImagen : handleSeleccionarImagen}
                            style={styles.imageActionFAB}
                        >
                            {imagenUrl ? (
                                <X size={18} color="rgba(255,255,255,0.9)" weight="bold" />
                            ) : (
                                <Camera size={18} color="rgba(255,255,255,0.9)" />
                            )}
                        </TouchableOpacity>

                        {uploadingImage && (
                            <View style={styles.uploadingOverlay}>
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            </View>
                        )}
                    </View>
                </View>
            )}

            <View style={styles.formContent}>
                {/* Indicador de Guardado Automático */}
                <View style={styles.autoSaveIndicator}>
                    {(saving || isDirty) ? (
                        <View style={styles.savingRow}>
                            <ActivityIndicator size={12} color="#00754A" />
                            <Text style={styles.savingText}>Guardando cambios...</Text>
                        </View>
                    ) : lastSaved ? (
                        <Text style={styles.savedText}>
                            Último guardado {new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    ) : null}
                </View>

                {/* Estado Disponible - Integrado en Status Card */}
                <View style={styles.statusCard}>
                    <View style={styles.statusInfo}>
                        <Text style={[styles.statusTitle, { color: disponible ? '#00754A' : theme.colors.onSurfaceVariant }]}>
                            {disponible ? 'Visible en el Menú' : 'Oculto del Menú'}
                        </Text>
                        <Text style={styles.statusSubtitle}>
                            {disponible ? 'Disponible para el asistente' : 'No disponible para el asistente'}
                        </Text>
                    </View>
                    <Switch
                        value={disponible}
                        onValueChange={setDisponible}
                        color="#00754A"
                    />
                </View>

                {/* Categoría */}
                <View style={styles.inputGroup}>
                    <Text variant="labelLarge" style={styles.sectionLabel}>CATEGORÍA</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.categoryChips}>
                            {CATEGORIAS_LISTA.map(cat => (
                                <AppChip
                                    key={cat}
                                    selected={categoria === cat}
                                    onPress={() => setCategoria(cat)}
                                >
                                    {cat}
                                </AppChip>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                {/* Nombre */}
                <TextInput
                    label="Nombre"
                    mode="outlined"
                    value={nombre}
                    onChangeText={setNombre}
                    activeOutlineColor="#00754A"
                    outlineColor="#E0E0E0"
                    selectionColor="rgba(0, 117, 74, 0.2)"
                    cursorColor="#00754A"
                    outlineStyle={styles.inputOutline}
                    style={styles.textInput}
                />

                {/* Descripción */}
                <TextInput
                    label="Descripción"
                    mode="outlined"
                    value={descripcion}
                    onChangeText={setDescripcion}
                    multiline
                    numberOfLines={3}
                    activeOutlineColor="#00754A"
                    outlineColor="#E0E0E0"
                    selectionColor="rgba(0, 117, 74, 0.2)"
                    cursorColor="#00754A"
                    outlineStyle={styles.inputOutline}
                    style={styles.textArea}
                />

                {/* Precio */}
                <TextInput
                    label="Precio"
                    mode="outlined"
                    value={precio}
                    onChangeText={setPrecio}
                    keyboardType="decimal-pad"
                    activeOutlineColor="#00754A"
                    outlineColor="#E0E0E0"
                    selectionColor="rgba(0, 117, 74, 0.2)"
                    cursorColor="#00754A"
                    outlineStyle={styles.inputOutline}
                    style={styles.textInput}
                    left={<TextInput.Affix text="$" />}
                />


                <Button
                    mode="text"
                    onPress={handleEliminar}
                    loading={deleting}
                    disabled={saving || deleting}
                    textColor={theme.colors.error}
                    style={styles.deleteButton}
                >
                    Eliminar del Menú
                </Button>
            </View>
        </ContentWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 0,
    },
    center: {
        padding: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontWeight: '500',
        opacity: 0.5,
    },
    imageSectionOuter: {
        marginTop: 12,
        borderRadius: 20,
        borderWidth: 2.5,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 22 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 16,
    },
    imageSection: {
        height: 260,
        width: '100%',
        backgroundColor: '#F8F9FA',
        position: 'relative',
        borderRadius: 18,
        overflow: 'hidden',
    },
    imageWrapper: {
        flex: 1,
        position: 'relative',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    heroImageContainer: {
        width: '100%',
        height: '100%',
        borderRadius: 0,
        overflow: 'hidden',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    imageActionFAB: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    placeholderHero: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(0,0,0,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    placeholderText: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.3)',
    },
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    formContent: {
        paddingTop: 12,
        paddingBottom: 40,
        gap: 20,
    },
    autoSaveIndicator: {
        height: 20,
        marginBottom: -10,
        alignItems: 'flex-end',
        paddingHorizontal: 4,
    },
    savingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    savingText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#00754A',
    },
    savedText: {
        fontSize: 11,
        fontWeight: '500',
        color: '#9CA3AF',
    },
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        backgroundColor: '#F2F4F3',
        borderWidth: 1,
        borderColor: 'rgba(0,117,74,0.1)',
        gap: 12,
    },
    statusInfo: {
        flex: 1,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 2,
    },
    statusSubtitle: {
        fontSize: 12,
        fontWeight: '500',
        opacity: 0.6,
        color: '#1E3932',
    },
    inputGroup: {
        marginBottom: 0,
    },
    sectionLabel: {
        marginBottom: 12,
        color: '#00754A',
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    categoryChips: {
        flexDirection: 'row',
        gap: 8,
    },
    inputOutline: {
        borderRadius: 12,
    },
    textInput: {
        backgroundColor: '#FFF',
    },
    textArea: {
        backgroundColor: '#FFF',
        minHeight: 80,
    },
    saveButton: {
        borderRadius: 28,
        backgroundColor: '#00754A',
        shadowColor: '#00754A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    saveButtonContent: {
        height: 52,
    },
    saveButtonLabel: {
        fontSize: 16,
        fontWeight: '700',
    },
    deleteButton: {
        marginTop: 0,
    },
});
