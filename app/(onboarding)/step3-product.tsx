import { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { CaretLeft as ChevronLeft } from 'phosphor-react-native';

const CATEGORIAS = ['Combos', 'Entradas', 'Principales', 'Bebidas', 'Postres', 'Otros'];

export default function Step3ProductScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { userId } = useAuth();
    const createComercio = useMutation(api.comercios.createWithOnboarding);

    const [formData, setFormData] = useState({
        producto_nombre: '',
        producto_descripcion: '',
        producto_precio: '',
        producto_categoria: 'Principales',
    });

    const [loading, setLoading] = useState(false);

    const isValid = formData.producto_nombre && formData.producto_precio && parseFloat(formData.producto_precio) > 0;

    const handleComplete = async () => {
        if (!userId) {
            Alert.alert('Error', 'No se pudo obtener el ID de usuario');
            return;
        }

        setLoading(true);
        try {
            await createComercio({
                clerk_user_id: userId,
                nombre_comercio: params.nombre_comercio as string,
                descripcion_corta: params.descripcion_corta as string || '',
                ciudad: params.ciudad as string,
                direccion: params.direccion as string,
                telefono_contacto: params.telefono_contacto as string,
                horario_atencion: params.horario_atencion as string,
                nombre_asistente: params.nombre_asistente as string,
                prompt_personalidad: params.prompt_personalidad as string,
                directrices_comunicacion: params.directrices_comunicacion as string,
                instrucciones_pago: params.instrucciones_pago as string,
                producto_nombre: formData.producto_nombre,
                producto_descripcion: formData.producto_descripcion || '',
                producto_precio: parseFloat(formData.producto_precio),
                producto_categoria: formData.producto_categoria,
            });

            router.replace('/(onboarding)/complete');
        } catch (error: any) {
            console.error('Error creating comercio:', error);
            Alert.alert('Error', 'No se pudo completar el registro. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Header */}
            <View style={styles.header}>
                <Button
                    mode="text"
                    onPress={() => router.back()}
                    icon={() => <ChevronLeft size={24} color="#1E3932" />}
                    style={styles.backButton}
                    disabled={loading}
                >
                    Atrás
                </Button>
                <View style={styles.progressContainer}>
                    <View style={styles.progressDot} />
                    <View style={styles.progressDot} />
                    <View style={[styles.progressDot, styles.progressDotActive]} />
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Tu Primer Producto</Text>
                <Text style={styles.subtitle}>Agrega un producto para comenzar tu menú</Text>

                <View style={styles.form}>
                    <TextInput
                        label="Nombre del Producto *"
                        value={formData.producto_nombre}
                        onChangeText={(text) => setFormData({ ...formData, producto_nombre: text })}
                        mode="outlined"
                        style={styles.input}
                        outlineColor="#D1D5DB"
                        activeOutlineColor="#00754A"
                        placeholder="Ej: Bandeja Paisa"
                        disabled={loading}
                    />

                    <TextInput
                        label="Descripción"
                        value={formData.producto_descripcion}
                        onChangeText={(text) => setFormData({ ...formData, producto_descripcion: text })}
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        style={styles.input}
                        outlineColor="#D1D5DB"
                        activeOutlineColor="#00754A"
                        placeholder="Describe tu producto..."
                        disabled={loading}
                    />

                    <TextInput
                        label="Precio *"
                        value={formData.producto_precio}
                        onChangeText={(text) => setFormData({ ...formData, producto_precio: text.replace(/[^0-9.]/g, '') })}
                        mode="outlined"
                        keyboardType="decimal-pad"
                        style={styles.input}
                        outlineColor="#D1D5DB"
                        activeOutlineColor="#00754A"
                        placeholder="0.00"
                        left={<TextInput.Affix text="$" />}
                        disabled={loading}
                    />

                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Categoría</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
                            <View style={styles.categoriesContainer}>
                                {CATEGORIAS.map((cat) => (
                                    <Button
                                        key={cat}
                                        mode={formData.producto_categoria === cat ? 'contained' : 'outlined'}
                                        onPress={() => setFormData({ ...formData, producto_categoria: cat })}
                                        style={[
                                            styles.categoryButton,
                                            formData.producto_categoria === cat && styles.categoryButtonActive
                                        ]}
                                        labelStyle={styles.categoryButtonLabel}
                                        disabled={loading}
                                    >
                                        {cat}
                                    </Button>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <Button
                    mode="contained"
                    onPress={handleComplete}
                    disabled={!isValid || loading}
                    style={[styles.button, (!isValid || loading) && styles.buttonDisabled]}
                    labelStyle={styles.buttonLabel}
                    loading={loading}
                >
                    {loading ? 'Creando tu negocio...' : 'Finalizar'}
                </Button>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F0EB',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        marginLeft: -12,
    },
    progressContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#D1D5DB',
    },
    progressDotActive: {
        backgroundColor: '#00754A',
        width: 24,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1E3932',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 32,
    },
    form: {
        gap: 24,
        paddingBottom: 24,
    },
    input: {
        backgroundColor: '#FFFFFF',
    },
    section: {
        gap: 12,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E3932',
        marginBottom: 4,
    },
    categoriesScroll: {
        marginHorizontal: -24,
        paddingHorizontal: 24,
    },
    categoriesContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    categoryButton: {
        borderRadius: 20,
        borderColor: '#E5E7EB',
    },
    categoryButtonActive: {
        backgroundColor: '#00754A',
    },
    categoryButtonLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    button: {
        backgroundColor: '#00754A',
        borderRadius: 12,
        paddingVertical: 8,
    },
    buttonDisabled: {
        backgroundColor: '#D1D5DB',
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: '700',
    },
});
