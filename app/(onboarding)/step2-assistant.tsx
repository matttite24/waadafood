import { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CaretLeft as ChevronLeft } from 'phosphor-react-native';

const PERSONALIDADES = [
    { id: 'amigable', label: 'Amigable y cercano', prompt: 'Eres un asistente amigable y cercano que trata a los clientes como amigos.' },
    { id: 'profesional', label: 'Profesional y formal', prompt: 'Eres un asistente profesional que mantiene un tono formal y cortés.' },
    { id: 'casual', label: 'Casual y relajado', prompt: 'Eres un asistente casual y relajado que usa un lenguaje informal.' },
];

export default function Step2AssistantScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [formData, setFormData] = useState({
        nombre_asistente: '',
        personalidad: 'amigable',
        directrices_comunicacion: '',
        instrucciones_pago: '',
    });

    const isValid = formData.nombre_asistente.trim().length > 0;

    const handleNext = () => {
        const selectedPersonality = PERSONALIDADES.find(p => p.id === formData.personalidad);
        router.push({
            pathname: '/(onboarding)/step3-product',
            params: {
                ...params,
                nombre_asistente: formData.nombre_asistente,
                prompt_personalidad: selectedPersonality?.prompt || '',
                directrices_comunicacion: formData.directrices_comunicacion,
                instrucciones_pago: formData.instrucciones_pago,
            },
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
                    <View style={styles.progressDot} />
                    <View style={[styles.progressDot, styles.progressDotActive]} />
                    <View style={styles.progressDot} />
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Configura tu Asistente IA</Text>
                <Text style={styles.subtitle}>Personaliza cómo tu asistente interactúa con los clientes</Text>

                <View style={styles.form}>
                    <TextInput
                        label="Nombre del Asistente *"
                        value={formData.nombre_asistente}
                        onChangeText={(text) => setFormData({ ...formData, nombre_asistente: text })}
                        mode="outlined"
                        style={styles.input}
                        outlineColor="#D1D5DB"
                        activeOutlineColor="#00754A"
                        placeholder="Ej: Ana, Bot de WaadaFood"
                    />

                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Personalidad del Asistente</Text>
                        <View style={styles.chipsContainer}>
                            {PERSONALIDADES.map((p) => (
                                <TouchableOpacity
                                    key={p.id}
                                    style={[
                                        styles.chip,
                                        formData.personalidad === p.id && styles.chipActive
                                    ]}
                                    onPress={() => setFormData({ ...formData, personalidad: p.id })}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        formData.personalidad === p.id && styles.chipTextActive
                                    ]}>
                                        {p.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <TextInput
                        label="Directrices de Comunicación (Opcional)"
                        value={formData.directrices_comunicacion}
                        onChangeText={(text) => setFormData({ ...formData, directrices_comunicacion: text })}
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        style={styles.input}
                        outlineColor="#D1D5DB"
                        activeOutlineColor="#00754A"
                        placeholder="Ej: Siempre ofrecer el plato del día"
                    />

                    <TextInput
                        label="Instrucciones de Pago (Opcional)"
                        value={formData.instrucciones_pago}
                        onChangeText={(text) => setFormData({ ...formData, instrucciones_pago: text })}
                        mode="outlined"
                        multiline
                        numberOfLines={2}
                        style={styles.input}
                        outlineColor="#D1D5DB"
                        activeOutlineColor="#00754A"
                        placeholder="Ej: Aceptamos efectivo, tarjeta y transferencia"
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
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    chipActive: {
        backgroundColor: '#D4E9E2',
        borderColor: '#00754A',
    },
    chipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    chipTextActive: {
        color: '#00754A',
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
