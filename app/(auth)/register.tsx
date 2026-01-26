import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, StatusBar, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, TextInput, Button, IconButton } from 'react-native-paper';
import { Eye, EyeSlash as EyeOff } from 'phosphor-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSignUp } from '@clerk/clerk-expo';

export default function RegisterScreen() {
    const router = useRouter();
    const { signUp, setActive, isLoaded } = useSignUp();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!isLoaded || !email.trim() || !password || !confirmPassword) return;

        if (password.length < 8) {
            Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        try {
            await signUp.create({
                emailAddress: email.trim(),
                password,
            });

            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

            Alert.alert(
                'Confirma tu email',
                'Te hemos enviado un código de verificación por correo.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // En una implementación real aquí irías a una pantalla para ingresar el código.
                        },
                    },
                ]
            );
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', error.errors?.[0]?.message || 'No se pudo crear la cuenta');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >

            <View style={styles.container}>
                <View style={styles.heroBanner}>
                    <View style={styles.heroGradient}>
                        <View style={styles.heroContent}>
                            <Image
                                source={require('@/assets/images/logo-icon.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                            <Text style={styles.heroSubtitle}>Únete a Chatbox y gestiona tu restaurante</Text>
                        </View>
                    </View>
                </View>

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.heroSpacer} />
                    <View style={styles.overlapContainer}>
                        <View style={styles.formCard}>
                            <Text style={styles.formTitle}>Registro</Text>
                            <Text style={styles.formSubtitle}>
                                Completa tus datos para comenzar
                            </Text>

                            <View style={styles.inputGroup}>
                                <TextInput
                                    label="Email"
                                    mode="outlined"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    outlineColor="rgba(0, 117, 74, 0.2)"
                                    activeOutlineColor="#00754A"
                                    outlineStyle={{ borderRadius: 12 }}
                                    style={styles.input}
                                    disabled={loading}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <TextInput
                                    label="Contraseña"
                                    mode="outlined"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    outlineColor="rgba(0, 117, 74, 0.2)"
                                    activeOutlineColor="#00754A"
                                    outlineStyle={{ borderRadius: 12 }}
                                    style={styles.input}
                                    disabled={loading}
                                    right={
                                        <TextInput.Icon
                                            icon={() => showPassword ? <EyeOff size={20} color="#64748b" /> : <Eye size={20} color="#64748b" />}
                                            onPress={() => setShowPassword(!showPassword)}
                                        />
                                    }
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <TextInput
                                    label="Confirmar Contraseña"
                                    mode="outlined"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                    outlineColor="rgba(0, 117, 74, 0.2)"
                                    activeOutlineColor="#00754A"
                                    outlineStyle={{ borderRadius: 12 }}
                                    style={styles.input}
                                    disabled={loading}
                                    right={
                                        <TextInput.Icon
                                            icon={() => showConfirmPassword ? <EyeOff size={20} color="#64748b" /> : <Eye size={20} color="#64748b" />}
                                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                        />
                                    }
                                />
                            </View>

                            <View style={styles.socialSection}>
                                <View style={styles.dividerRow}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>o registrarse con</Text>
                                    <View style={styles.dividerLine} />
                                </View>

                                <View style={styles.socialRow}>
                                    <TouchableOpacity
                                        style={[styles.socialButton, { backgroundColor: '#FFFFFF' }]}
                                        activeOpacity={0.8}
                                        onPress={() => Alert.alert('Próximamente', 'La integración con Google estará disponible pronto.')}
                                    >
                                        <MaterialCommunityIcons name="google" size={24} color="#DB4437" />
                                        <Text style={styles.socialButtonText}>Google</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.socialButton, { backgroundColor: '#1877F2' }]}
                                        activeOpacity={0.8}
                                        onPress={() => Alert.alert('Próximamente', 'La integración con Facebook estará disponible pronto.')}
                                    >
                                        <MaterialCommunityIcons name="facebook" size={24} color="#FFFFFF" />
                                        <Text style={[styles.socialButtonText, { color: '#FFFFFF' }]}>Facebook</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <Button
                            mode="contained"
                            onPress={handleRegister}
                            loading={loading}
                            disabled={loading}
                            style={styles.registerButton}
                            contentStyle={styles.registerButtonContent}
                            labelStyle={styles.registerButtonLabel}
                        >
                            Crear Cuenta
                        </Button>

                        <Button
                            mode="text"
                            onPress={() => router.push('/login')}
                            disabled={loading}
                            textColor="#00754A"
                        >
                            ¿Ya tienes cuenta? Inicia sesión aquí
                        </Button>
                    </View>
                </ScrollView>

                <View style={styles.navOverlay}>
                    <IconButton
                        icon="arrow-left"
                        iconColor="#FFFFFF"
                        size={24}
                        onPress={() => router.back()}
                        style={styles.backButton}
                    />
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F0EB' },
    scrollContent: { paddingBottom: 40 },
    heroSpacer: { height: 280, backgroundColor: 'transparent' },
    heroBanner: { position: 'absolute', top: 0, left: 0, right: 0, height: 320, backgroundColor: '#1E3932', zIndex: 0 },
    heroGradient: { width: '100%', height: '100%', backgroundColor: '#1E3932', justifyContent: 'center', alignItems: 'center' },
    heroContent: { alignItems: 'center', gap: 12 },
    logoImage: { width: 80, height: 80, marginBottom: 8 },
    heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '500', textAlign: 'center', paddingHorizontal: 40 },
    overlapContainer: { backgroundColor: '#F2F0EB', borderTopLeftRadius: 36, borderTopRightRadius: 36, paddingHorizontal: 20, paddingTop: 30, minHeight: 600 },
    navOverlay: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 10, left: 10, zIndex: 100 },
    backButton: { backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: 20 },
    formCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 5, marginBottom: 24 },
    formTitle: { fontSize: 24, fontWeight: 'bold', fontFamily: 'BricolageGrotesque_700Bold', color: '#1E3932', marginBottom: 8 },
    formSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 24 },
    inputGroup: { marginBottom: 16 },
    input: { backgroundColor: '#FFFFFF' },
    registerButton: { borderRadius: 28, backgroundColor: '#00754A', marginBottom: 12 },
    registerButtonContent: { height: 56 },
    registerButtonLabel: { fontSize: 16, fontWeight: 'bold' },
    socialSection: { marginTop: 8, gap: 16, marginBottom: 24 },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
    dividerText: { color: '#64748b', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    socialRow: { flexDirection: 'row', gap: 12 },
    socialButton: { flex: 1, height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    socialButtonText: { fontSize: 15, fontWeight: '700', color: '#1E3932' },
});
