import { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { CaretLeft as ChevronLeft } from 'phosphor-react-native';

export default function Step1BusinessScreen() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        nombre_comercio: '',
        descripcion_corta: '',
        ciudad: '',
        direccion: '',
        telefono_contacto: '',
        horario_atencion: '',
    });

    const isValid = formData.nombre_comercio && formData.ciudad && formData.direccion && formData.telefono_contacto;

    const handleNext = () => {
        // Guardar en contexto o AsyncStorage para pasar a siguiente paso
        router.push({
            pathname: '/(onboarding)/step2-assistant',
            params: formData,
        });
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
                >
                    Atrás
                </Button>
                <View style={styles.progressContainer}>
                    <View style={[styles.progressDot, styles.progressDotActive]} />
                    <View style={styles.progressDot} />
                    <View style={styles.progressDot} />
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Información del Negocio</Text>
                <Text style={styles.subtitle}>Cuéntanos sobre tu restaurante</Text>

                <View style={styles.form}>
                    <TextInput
                        label="Nombre del Negocio *"
                        value={formData.nombre_comercio}
                        onChangeText={(text) => setFormData({ ...formData, nombre_comercio: text })}
                        mode="outlined"
                        style={styles.input}
                        outlineColor="#D1D5DB"
                        activeOutlineColor="#00754A"
                    />

                    <TextInput
                        label="Descripción Corta"
                        value={formData.descripcion_corta}
                        onChangeText={(text) => setFormData({ ...formData, descripcion_corta: text })}
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        style={styles.input}
                        outlineColor="#D1D5DB"
                        activeOutlineColor="#00754A"
                        placeholder="Ej: Restaurante de comida colombiana tradicional"
                    />

                    <TextInput
                        label="Ciudad *"
                        value={formData.ciudad}
                        onChangeText={(text) => setFormData({ ...formData, ciudad: text })}
                        mode="outlined"
                        style={styles.input}
                        outlineColor="#D1D5DB"
                        activeOutlineColor="#00754A"
                    />

                    <TextInput
                        label="Dirección *"
                        value={formData.direccion}
                        onChangeText={(text) => setFormData({ ...formData, direccion: text })}
                        mode="outlined"
                        style={styles.input}
                        outlineColor="#D1D5DB"
                        activeOutlineColor="#00754A"
                    />

                    <TextInput
                        label="Teléfono de Contacto *"
                        value={formData.telefono_contacto}
                        onChangeText={(text) => setFormData({ ...formData, telefono_contacto: text })}
                        mode="outlined"
                        keyboardType="phone-pad"
                        style={styles.input}
                        outlineColor="#D1D5DB"
                        activeOutlineColor="#00754A"
                        placeholder="+57 300 123 4567"
                    />

                    <TextInput
                        label="Horario de Atención (Opcional)"
                        value={formData.horario_atencion}
                        onChangeText={(text) => setFormData({ ...formData, horario_atencion: text })}
                        mode="outlined"
                        style={styles.input}
                        outlineColor="#D1D5DB"
                        activeOutlineColor="#00754A"
                        placeholder="Lun-Vie: 8:00-20:00, Sáb-Dom: 9:00-22:00"
                    />
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <Button
                    mode="contained"
                    onPress={handleNext}
                    disabled={!isValid}
                    style={[styles.button, !isValid && styles.buttonDisabled]}
                    labelStyle={styles.buttonLabel}
                >
                    Continuar
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
        gap: 16,
        paddingBottom: 24,
    },
    input: {
        backgroundColor: '#FFFFFF',
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
