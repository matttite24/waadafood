import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, TextInput, Button, useTheme, Checkbox } from 'react-native-paper';
import { Eye, EyeSlash as EyeOff, Star } from 'phosphor-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSignIn } from '@clerk/clerk-expo';

export default function LoginWebScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { signIn, setActive, isLoaded } = useSignIn();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // MFA State
    const [show2FA, setShow2FA] = useState(false);
    const [code2FA, setCode2FA] = useState('');

    const handleLogin = async () => {
        console.log('Intento de login con:', email.trim());
        if (!isLoaded || !email.trim() || !password) {
            const msg = 'Por favor completa todos los campos';
            Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
            return;
        }

        setLoading(true);
        try {
            console.log('Enviando solicitud de inicio de sesión a Clerk...');
            const result = await signIn.create({
                identifier: email.trim(),
                password,
            });

            console.log('Resultado del login (crudo):', result);

            if (result.status === 'complete') {
                console.log('Sesión creada con éxito. ID:', result.createdSessionId);
                console.log('Activando sesión en el cliente...');

                await setActive({ session: result.createdSessionId });

                console.log('Sesión activa. El layout raíz se encargará de la redirección.');
            } else if (result.status === 'needs_second_factor') {
                console.log('MFA requerido. Cambiando a vista de verificación...');
                setShow2FA(true);
            } else {
                console.warn('Login status pendiente:', result.status);
                const msg = `El inicio de sesión no se completó. Estado: ${result.status}. Verifica si necesitas confirmar tu email o completar un factor adicional.`;
                Platform.OS === 'web' ? alert(msg) : Alert.alert('Estado del Login', msg);
            }
        } catch (error: any) {
            console.error('Error capturado en handleLogin:', error);

            // Extraer mensaje detallado de Clerk
            const clerkError = error.errors?.[0]?.longMessage || error.errors?.[0]?.message || 'Ocurrió un error inesperado';
            console.error('Mensaje de Clerk para el usuario:', clerkError);

            Platform.OS === 'web' ? alert(`Error: ${clerkError}`) : Alert.alert('Error', clerkError);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyFactor = async () => {
        if (!isLoaded || !code2FA) {
            const msg = 'Por favor ingresa el código de verificación';
            Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
            return;
        }

        setLoading(true);
        try {
            console.log('Intentando verificar segundo factor...');
            const result = await signIn.attemptSecondFactor({
                strategy: 'phone_code', // O 'totp' o 'email_code' dependiendo de la config de Clerk
                code: code2FA,
            });

            if (result.status === 'complete') {
                console.log('MFA verificado con éxito. El layout raíz se encargará de la redirección.');
                await setActive({ session: result.createdSessionId });
            } else {
                console.warn('MFA status no completado:', result.status);
                alert(`Error: ${result.status}`);
            }
        } catch (error: any) {
            console.error('Error en handleVerifyFactor:', error);
            const clerkError = error.errors?.[0]?.longMessage || error.errors?.[0]?.message || 'Código inválido';
            Platform.OS === 'web' ? alert(`Error: ${clerkError}`) : Alert.alert('Error', clerkError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.leftSection}>
                <View style={styles.formWrapper}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('@/assets/images/Logo-green.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.headerText}>
                        <Text variant="headlineMedium" style={styles.title}>¡Bienvenido de nuevo!</Text>
                        <Text variant="bodyLarge" style={styles.subtitle}>Ingresa tus credenciales para acceder a tu plataforma.</Text>
                    </View>

                    {!show2FA ? (
                        <>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Correo Electrónico</Text>
                                <TextInput
                                    mode="outlined"
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="ejemplo@google.com"
                                    style={styles.input}
                                    autoCapitalize="none"
                                    outlineColor="#E0E0E0"
                                    activeOutlineColor={theme.colors.primary}
                                    textColor="#1C1C1E"
                                    placeholderTextColor="#94A3B8"
                                    disabled={loading}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Contraseña</Text>
                                <TextInput
                                    mode="outlined"
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="••••••••"
                                    secureTextEntry={!showPassword}
                                    right={
                                        <TextInput.Icon
                                            icon={() => showPassword ? <EyeOff size={20} color="#94A3B8" /> : <Eye size={20} color="#94A3B8" />}
                                            onPress={() => setShowPassword(!showPassword)}
                                        />
                                    }
                                    style={styles.input}
                                    autoCapitalize="none"
                                    outlineColor="#E0E0E0"
                                    activeOutlineColor={theme.colors.primary}
                                    textColor="#1C1C1E"
                                    placeholderTextColor="#94A3B8"
                                    disabled={loading}
                                />
                            </View>

                            <View style={styles.actionsRow}>
                                <View style={styles.rememberRow}>
                                    <Checkbox
                                        status={rememberMe ? 'checked' : 'unchecked'}
                                        onPress={() => setRememberMe(!rememberMe)}
                                        color={theme.colors.primary}
                                    />
                                    <Text style={styles.rememberText}>Recuérdame</Text>
                                </View>
                                <TouchableOpacity onPress={() => Alert.alert('Próximamente')}>
                                    <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                                </TouchableOpacity>
                            </View>

                            <Button
                                mode="contained"
                                onPress={handleLogin}
                                loading={loading}
                                style={styles.loginButton}
                                contentStyle={styles.loginButtonContent}
                                labelStyle={styles.loginButtonLabel}
                            >
                                Iniciar Sesión
                            </Button>
                        </>
                    ) : (
                        <>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Código de Verificación (2FA)</Text>
                                <TextInput
                                    mode="outlined"
                                    value={code2FA}
                                    onChangeText={setCode2FA}
                                    placeholder="123456"
                                    style={styles.input}
                                    keyboardType="number-pad"
                                    outlineColor="#E0E0E0"
                                    activeOutlineColor={theme.colors.primary}
                                    textColor="#1C1C1E"
                                    placeholderTextColor="#94A3B8"
                                    disabled={loading}
                                />
                                <Text style={{ marginTop: 8, color: '#6B6B6B', fontSize: 13 }}>
                                    Ingresa el código que recibiste en tu dispositivo.
                                </Text>
                            </View>

                            <Button
                                mode="contained"
                                onPress={handleVerifyFactor}
                                loading={loading}
                                style={styles.loginButton}
                                contentStyle={styles.loginButtonContent}
                                labelStyle={styles.loginButtonLabel}
                            >
                                Verificar Código
                            </Button>

                            <TouchableOpacity
                                onPress={() => setShow2FA(false)}
                                style={{ alignSelf: 'center', marginBottom: 24 }}
                            >
                                <Text style={{ color: '#00754A', fontWeight: 'bold' }}>Volver al inicio de sesión</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    <View style={styles.dividerRow}>
                        <View style={styles.divider} />
                        <Text style={styles.dividerText}>o continúa con</Text>
                        <View style={styles.divider} />
                    </View>

                    <View style={styles.socialRow}>
                        <TouchableOpacity style={styles.socialButton} onPress={() => Alert.alert('Próximamente')}>
                            <MaterialCommunityIcons name="google" size={20} color="#1C1C1E" />
                            <Text style={styles.socialText}>Google</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialButton} onPress={() => Alert.alert('Próximamente')}>
                            <MaterialCommunityIcons name="facebook" size={20} color="#1C1C1E" />
                            <Text style={styles.socialText}>Facebook</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.noAccount}>¿No tienes una cuenta?</Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                            <Text style={styles.registerLink}>Regístrate ahora</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={styles.rightSection}>
                <View style={styles.imageCard}>
                    <Image
                        source={require('@/assets/images/restaurant-interior-green.png')}
                        style={styles.heroImage}
                        resizeMode="cover"
                    />
                    <View style={styles.imageOverlay}>
                        <View style={styles.overlayContent}>
                            <View style={styles.starBadge}>
                                <Star size={20} color="#FFD700" weight="fill" />
                                <Text style={styles.badgeText}>Premium AI Platform</Text>
                            </View>
                            <Text style={styles.overlayTitle}>La Inteligencia Artificial que conecta tu restaurante con el futuro</Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, flexDirection: 'row', backgroundColor: '#F2F0EB', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    leftSection: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    formWrapper: { width: '100%', maxWidth: 420, justifyContent: 'center' },
    logoContainer: { marginBottom: 48, width: '100%', alignItems: 'flex-start' },
    logo: { width: 90, height: 90 },
    headerText: { marginBottom: 32 },
    title: { fontFamily: 'BricolageGrotesque_800ExtraBold', color: '#1E3932', fontSize: 32, marginBottom: 8 },
    subtitle: { fontFamily: 'BricolageGrotesque_400Regular', color: '#6B6B6B', fontSize: 16, lineHeight: 24 },
    inputGroup: { marginBottom: 20 },
    label: { fontFamily: 'BricolageGrotesque_600SemiBold', fontSize: 14, color: '#1E3932', marginBottom: 8 },
    input: { backgroundColor: '#FFFFFF', height: 52 },
    actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
    rememberRow: { flexDirection: 'row', alignItems: 'center', marginLeft: -8 },
    rememberText: { fontFamily: 'BricolageGrotesque_500Medium', fontSize: 14, color: '#1E3932' },
    forgotText: { fontFamily: 'BricolageGrotesque_600SemiBold', fontSize: 14, color: '#00754A' },
    loginButton: { height: 56, borderRadius: 30, justifyContent: 'center', backgroundColor: '#00754A', marginBottom: 24 },
    loginButtonContent: { height: 56 },
    loginButtonLabel: { fontFamily: 'BricolageGrotesque_700Bold', fontSize: 16 },
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    divider: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
    dividerText: { paddingHorizontal: 16, fontFamily: 'BricolageGrotesque_400Regular', fontSize: 14, color: '#6B6B6B' },
    socialRow: { flexDirection: 'row', gap: 16, marginBottom: 40 },
    socialButton: { flex: 1, flexDirection: 'row', height: 52, borderRadius: 30, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', gap: 12 },
    socialText: { fontFamily: 'BricolageGrotesque_600SemiBold', fontSize: 14, color: '#1C1C1E' },
    footer: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
    noAccount: { fontFamily: 'BricolageGrotesque_400Regular', fontSize: 14, color: '#6B6B6B' },
    registerLink: { fontFamily: 'BricolageGrotesque_700Bold', fontSize: 14, color: '#00754A' },
    rightSection: { flex: 1, padding: 24 },
    imageCard: { flex: 1, borderRadius: 40, overflow: 'hidden', position: 'relative' },
    heroImage: { width: '100%', height: '100%' },
    imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(30, 57, 50, 0.4)', justifyContent: 'flex-end', padding: 60 },
    starBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
    badgeText: { fontFamily: 'BricolageGrotesque_600SemiBold', color: '#FFFFFF', fontSize: 14, letterSpacing: 0.5 },
    overlayContent: { maxWidth: 600 },
    overlayTitle: { fontFamily: 'BricolageGrotesque_800ExtraBold', color: '#FFFFFF', fontSize: 48, lineHeight: 58, marginBottom: 0 },
});
