import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, TextInput, Button, Switch, ActivityIndicator, Chip, useTheme } from 'react-native-paper';
import { Check as Save, Trash, Camera } from 'phosphor-react-native';
import AppImage from '@/components/AppImage';
import { useProductoForm } from '@/hooks/useProductoForm';

const CATEGORIAS_LISTA = ['Combos', 'Entradas', 'Principales', 'Bebidas', 'Postres'];

export default function EditarProductoWeb() {
    const theme = useTheme();
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const {
        loading,
        saving,
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
    } = useProductoForm(id);

    const themedStyles = useMemo(() => ({
        container: { backgroundColor: '#F2F0EB' },
        textOnSurface: { color: theme.colors.onSurface },
        textPrimary: { color: theme.colors.primary },
        textOutline: { color: theme.colors.outline },
        divider: { backgroundColor: theme.colors.outlineVariant },
        saveButton: { backgroundColor: theme.colors.primary },
    }), [theme]);

    if (loading) {
        return (
            <View style={[styles.center, themedStyles.container]}>
                <ActivityIndicator color={theme.colors.primary} size="large" />
                <Text style={[styles.loadingText, themedStyles.textOutline]}>Cargando detalles...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, themedStyles.container]}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
        >
            <View style={styles.webContentWrapper}>

                {/* Formulario Unificado con Imagen */}
                <View style={styles.formBox}>

                    {/* Imagen del Producto */}
                    <View style={styles.imageBox}>
                        <Pressable
                            onPress={handleSeleccionarImagen}
                            disabled={uploadingImage}
                            style={styles.imageContainer}
                        >
                            {imagenUrl ? (
                                <>
                                    <AppImage
                                        source={{ uri: imagenUrl }}
                                        style={styles.image}
                                        containerStyle={styles.imageInner}
                                        resizeMode="cover"
                                    />
                                    <View style={styles.imageOverlay}>
                                        <Camera size={32} color="#FFFFFF" weight="regular" />
                                        <Text style={styles.imageOverlayText}>Cambiar imagen</Text>
                                    </View>
                                </>
                            ) : (
                                <View style={styles.imagePlaceholder}>
                                    <View style={styles.placeholderIconContainer}>
                                        <Camera size={48} color={theme.colors.primary} weight="regular" />
                                    </View>
                                    <Text style={[styles.imagePlaceholderText, themedStyles.textOnSurface]}>
                                        Añadir imagen del producto
                                    </Text>
                                    <Text style={[styles.imagePlaceholderHint, themedStyles.textOutline]}>
                                        Haz clic para seleccionar una imagen
                                    </Text>
                                </View>
                            )}

                            {uploadingImage && (
                                <View style={styles.uploadingOverlay}>
                                    <ActivityIndicator size="large" color="#FFFFFF" />
                                    <Text style={styles.uploadingText}>Subiendo imagen...</Text>
                                </View>
                            )}
                        </Pressable>

                        {imagenUrl && !uploadingImage && (
                            <TouchableOpacity
                                style={styles.deleteIconButton}
                                onPress={handleEliminarImagen}
                            >
                                <Trash size={20} color={theme.colors.error} weight="bold" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Estado Disponible */}
                    <View style={styles.statusRow}>
                        <View style={styles.statusInfo}>
                            <Text style={[styles.statusTitle, themedStyles.textOnSurface]}>Visible en el Menú</Text>
                            <Text style={[styles.statusSubtitle, themedStyles.textPrimary]}>
                                {disponible ? 'Activo y disponible para clientes' : 'Oculto para los clientes'}
                            </Text>
                        </View>
                        <Switch
                            value={disponible}
                            onValueChange={setDisponible}
                            color={theme.colors.primary}
                        />
                    </View>

                    <View style={[styles.divider, themedStyles.divider]} />

                    {/* Categoría Selector */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, themedStyles.textOnSurface]}>Categoría</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.categoryChips}>
                                {CATEGORIAS_LISTA.map(cat => {
                                    const isSel = categoria === cat;
                                    return (
                                        <Chip
                                            key={cat}
                                            selected={isSel}
                                            onPress={() => setCategoria(cat)}
                                            mode="outlined"
                                            showSelectedOverlay
                                            style={[
                                                styles.categoryChip,
                                                { backgroundColor: isSel ? theme.colors.primary : theme.colors.elevation.level2 }
                                            ]}
                                            textStyle={[
                                                styles.categoryChipText,
                                                { color: isSel ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }
                                            ]}
                                            selectedColor={theme.colors.onPrimary}
                                        >
                                            {cat}
                                        </Chip>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Nombre */}
                    <View style={styles.inputGroup}>
                        <TextInput
                            label="Nombre"
                            mode="outlined"
                            value={nombre}
                            onChangeText={setNombre}
                            activeOutlineColor={theme.colors.primary}
                            outlineStyle={styles.inputOutline}
                            style={styles.textInput}
                        />
                    </View>

                    {/* Descripción */}
                    <View style={styles.inputGroup}>
                        <TextInput
                            label="Descripción"
                            mode="outlined"
                            value={descripcion}
                            onChangeText={setDescripcion}
                            multiline
                            numberOfLines={3}
                            activeOutlineColor={theme.colors.primary}
                            outlineStyle={styles.inputOutline}
                            style={styles.textArea}
                        />
                    </View>

                    {/* Fila: Precio + Botón Guardar */}
                    <View style={styles.priceAndSaveRow}>
                        {/* Precio */}
                        <View style={styles.priceInput}>
                            <TextInput
                                label="Precio"
                                mode="outlined"
                                value={precio}
                                onChangeText={setPrecio}
                                keyboardType="decimal-pad"
                                activeOutlineColor={theme.colors.primary}
                                outlineStyle={styles.inputOutline}
                                style={styles.textInput}
                            />
                        </View>

                        {/* Botón de Guardar */}
                        <View style={styles.saveButtonContainer}>
                            <Button
                                mode="contained"
                                onPress={() => handleGuardar(false)}
                                loading={saving}
                                disabled={saving || deleting}
                                style={[styles.saveButton, themedStyles.saveButton]}
                                contentStyle={styles.saveButtonContent}
                                labelStyle={styles.saveButtonLabel}
                                icon={() => <Save size={20} color={theme.colors.onPrimary} />}
                            >
                                Guardar
                            </Button>
                        </View>
                    </View>

                    {/* Botón de Eliminar */}
                    <Button
                        mode="text"
                        onPress={handleEliminar}
                        loading={deleting}
                        disabled={saving || deleting}
                        textColor={theme.colors.error}
                        style={styles.deleteButton}
                    >
                        Eliminar este plato
                    </Button>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontWeight: '500',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    webContentWrapper: {
        paddingTop: 94, // 74px header + 20px aire
        paddingHorizontal: 20,
        maxWidth: '100%',
        width: '100%',
        alignSelf: 'center',
    },
    imageBox: {
        borderRadius: 15,
        padding: 0,
        position: 'relative',
        marginBottom: 24,
        backgroundColor: 'transparent',
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: 15,
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageInner: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        gap: 12,
    },
    placeholderIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    imagePlaceholderText: {
        fontSize: 16,
        fontWeight: '700',
    },
    imagePlaceholderHint: {
        fontSize: 13,
        opacity: 0.6,
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0,
    },
    imageOverlayText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
    },
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadingText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 12,
    },
    deleteIconButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: '#FFFFFF',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
    },
    formBox: {
        borderRadius: 24,
        padding: 24,
        backgroundColor: '#FFFFFF',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    statusInfo: {
        flex: 1,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 2,
    },
    statusSubtitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginBottom: 24,
        opacity: 0.5,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 12,
        marginLeft: 4,
    },
    categoryChips: {
        flexDirection: 'row',
        gap: 8,
        paddingBottom: 4,
    },
    categoryChip: {
        borderRadius: 20,
        borderWidth: 0,
    },
    categoryChipText: {
        fontWeight: '700',
        fontSize: 13,
    },
    inputOutline: {
        borderRadius: 18,
    },
    textInput: {
        backgroundColor: 'transparent',
    },
    textArea: {
        backgroundColor: 'transparent',
        minHeight: 100,
    },
    priceAndSaveRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
        alignItems: 'flex-end',
    },
    priceInput: {
        flex: 0.4,
    },
    saveButtonContainer: {
        flex: 0.6,
    },
    saveButton: {
        borderRadius: 28,
    },
    saveButtonContent: {
        height: 60,
    },
    saveButtonLabel: {
        fontSize: 17,
        fontWeight: '800',
    },
    deleteButton: {
        marginTop: 8,
    },
});
