import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, StatusBar, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, TextInput, Button, SegmentedButtons } from 'react-native-paper';
import { Eye, EyeSlash as EyeOff } from 'phosphor-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';

export default function LoginScreen() {
    const router = useRouter();
    const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
    const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();

    const [mode, setMode] = useState('login'); // 'login' o 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // MFA State
    const [show2FA, setShow2FA] = useState(false);
    const [code2FA, setCode2FA] = useState('');

    const handleLogin = async () => {
        if (!signInLoaded || !email.trim() || !password) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        setLoading(true);
        try {
            console.log('Mobile login attempt for:', email.trim());
            const result = await signIn.create({
                identifier: email.trim(),
                password,
            });

            if (result.status === 'complete') {
                await setSignInActive({ session: result.createdSessionId });
                router.replace('/menu');
            } else if (result.status === 'needs_second_factor') {
                console.log('MFA requerido (Mobile). Mostrando input de verificación...');
                setShow2FA(true);
            } else {
                console.warn('Login status pendiente (Mobile):', result.status);
                Alert.alert('Estado del Login', `El proceso no se completó. Estado actual: ${result.status}`);
            }
        } catch (error: any) {
            console.error('Mobile login error:', error);
            const msg = error.errors?.[0]?.longMessage || error.errors?.[0]?.message || 'No se pudo iniciar sesión';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyFactor = async () => {
        if (!signInLoaded || !code2FA) {
            Alert.alert('Error', 'Por favor ingresa el código de verificación');
            return;
        }

        setLoading(true);
        try {
            console.log('Verificando MFA en mobile...');
            const result = await signIn.attemptSecondFactor({
                strategy: 'phone_code', // O el correspondiente
                code: code2FA,
            });

            if (result.status === 'complete') {
                await setSignInActive({ session: result.createdSessionId });
                router.replace('/menu');
            } else {
                Alert.alert('Error', `Estado: ${result.status}`);
            }
        } catch (error: any) {
            console.error('Mobile MFA error:', error);
            const msg = error.errors?.[0]?.longMessage || error.errors?.[0]?.message || 'Código inválido';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!signUpLoaded || !email.trim() || !password || !confirmPassword) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

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
                [{ text: 'OK' }]
            );
        } catch (error: any) {
            console.error('Mobile register error:', error);
            const msg = error.errors?.[0]?.longMessage || error.errors?.[0]?.message || 'No se pudo crear la cuenta';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = () => {
        if (mode === 'login') {
            handleLogin();
        } else {
            handleRegister();
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
                            <Text style={styles.heroSubtitle}>iA fácil para restaurantes</Text>
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


                            <View style={styles.formContent}>
                                {show2FA ? (
                                    <>
                                        <Text style={styles.formTitle}>Verificación</Text>
                                        <Text style={styles.formSubtitle}>Ingresa el código de 6 dígitos enviado a tu dispositivo</Text>

                                        <View style={styles.inputGroup}>
                                            <TextInput
                                                label="Código de Verificación"
                                                mode="outlined"
                                                value={code2FA}
                                                onChangeText={setCode2FA}
                                                keyboardType="number-pad"
                                                outlineColor="rgba(0, 117, 74, 0.2)"
                                                activeOutlineColor="#00754A"
                                                outlineStyle={{ borderRadius: 12 }}
                                                style={styles.input}
                                                disabled={loading}
                                            />
                                        </View>

                                        <Button
                                            mode="contained"
                                            onPress={handleVerifyFactor}
                                            loading={loading}
                                            disabled={loading}
                                            style={styles.submitButton}
                                            contentStyle={styles.submitButtonContent}
                                            labelStyle={styles.submitButtonLabel}
                                        >
                                            Verificar
                                        </Button>

                                        <TouchableOpacity
                                            onPress={() => setShow2FA(false)}
                                            style={{ alignSelf: 'center', marginTop: 10 }}
                                        >
                                            <Text style={{ color: '#00754A', fontWeight: 'bold' }}>Volver</Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <>
                                        <Text style={styles.formTitle}>
                                            {mode === 'login' ? '¡Hola de nuevo!' : 'Crear Cuenta'}
                                        </Text>
                                        <Text style={styles.formSubtitle}>
                                            {mode === 'login'
                                                ? 'Ingresa tus credenciales para continuar'
                                                : 'Completa tus datos para comenzar'}
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

                                        {mode === 'register' && (
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
                                        )}

                                        <View style={styles.socialSection}>
                                            <View style={styles.dividerRow}>
                                                <View style={styles.dividerLine} />
                                                <Text style={styles.dividerText}>o continuar con</Text>
                                                <View style={styles.dividerLine} />
                                            </View>

                                            <View style={styles.socialRow}>
                                                <TouchableOpacity
                                                    style={[styles.socialButton, { backgroundColor: '#FFFFFF' }]}
                                                    activeOpacity={0.8}
                                                    onPress={() => Alert.alert('Próximamente', 'La integración con Google estará disponible pronto.')}
                                                >
                                                    <MaterialCommunityIcons name="google" size={20} color="#DB4437" />
                                                    <Text style={styles.socialButtonText}>Google</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={[styles.socialButton, { backgroundColor: '#1877F2' }]}
                                                    activeOpacity={0.8}
                                                    onPress={() => Alert.alert('Próximamente', 'La integración con Facebook estará disponible pronto.')}
                                                >
                                                    <MaterialCommunityIcons name="facebook" size={20} color="#FFFFFF" />
                                                    <Text style={[styles.socialButtonText, { color: '#FFFFFF' }]}>Facebook</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <Button
                                            mode="contained"
                                            onPress={handleSubmit}
                                            loading={loading}
                                            disabled={loading}
                                            style={styles.submitButton}
                                            contentStyle={styles.submitButtonContent}
                                            labelStyle={styles.submitButtonLabel}
                                        >
                                            {mode === 'login' ? 'Ingresar' : 'Crear Cuenta'}
                                        </Button>

                                        <TouchableOpacity
                                            onPress={() => router.push(mode === 'login' ? '/register' : '/login')}
                                            style={styles.toggleModeButton}
                                        >
                                            <Text style={styles.toggleModeText}>
                                                {mode === 'login'
                                                    ? '¿No tienes cuenta? Regístrate'
                                                    : '¿Ya tienes cuenta? Inicia Sesión'}
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F0EB' },
    scrollContent: { paddingBottom: 40 },
    heroSpacer: { height: 240, backgroundColor: 'transparent' },
    heroBanner: { position: 'absolute', top: 0, left: 0, right: 0, height: 400, backgroundColor: '#1E3932', zIndex: 0 },
    heroGradient: { width: '100%', height: '70%', backgroundColor: '#1E3932', justifyContent: 'center', alignItems: 'center' },
    heroContent: { alignItems: 'center', gap: 2 },
    logoImage: { width: 80, height: 80, marginBottom: 8 },
    heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
    overlapContainer: { backgroundColor: '#F2F0EB', borderTopLeftRadius: 36, borderTopRightRadius: 36, paddingHorizontal: 20, paddingTop: 20, minHeight: 600 },
    formCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 5, marginBottom: 24 },
    segmentedButtons: { marginBottom: 20 },
    formContent: { gap: 0 },
    formTitle: { fontSize: 24, fontWeight: 'bold', fontFamily: 'BricolageGrotesque_700Bold', color: '#1E3932', marginBottom: 4 },
    formSubtitle: { fontSize: 13, color: '#64748b', marginBottom: 16 },
    inputGroup: { marginBottom: 12 },
    input: { backgroundColor: '#FFFFFF' },
    submitButton: { borderRadius: 28, backgroundColor: '#00754A', marginTop: 8, marginBottom: 12, shadowColor: '#00754A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
    submitButtonContent: { height: 50 },
    submitButtonLabel: { fontSize: 16, fontWeight: 'bold' },
    socialSection: { marginTop: 24, marginBottom: 24, gap: 16 },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
    dividerText: { color: '#64748b', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    socialRow: { flexDirection: 'row', gap: 12 },
    socialButton: { flex: 1, height: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    socialButtonText: { fontSize: 14, fontWeight: '700', color: '#1E3932' },
    toggleModeButton: { marginTop: 16, alignSelf: 'center', padding: 8 },
    toggleModeText: { color: '#00754A', fontWeight: '600', fontSize: 14 },
});
