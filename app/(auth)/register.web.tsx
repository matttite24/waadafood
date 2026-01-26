import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, TextInput, Button, useTheme } from 'react-native-paper';
import { CaretLeft as ArrowLeft, Star, Eye, EyeSlash as EyeOff } from 'phosphor-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSignUp } from '@clerk/clerk-expo';

export default function RegisterWebScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { signUp, isLoaded } = useSignUp();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!isLoaded || !email.trim() || !password || !confirmPassword) {
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
        <View style={styles.container}>
            <View style={styles.leftSection}>
                <View style={styles.formWrapper}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft size={20} color={theme.colors.primary} />
                        <Text style={styles.backText}>Volver</Text>
                    </TouchableOpacity>

                    <View style={styles.logoContainer}>
                        <Image
                            source={require('@/assets/images/Logo-green.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.headerText}>
                        <Text variant="headlineMedium" style={styles.title}>Crea tu cuenta</Text>
                        <Text variant="bodyLarge" style={styles.subtitle}>Empieza a gestionar tu restaurante</Text>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Correo Electrónico</Text>
                            <TextInput
                                mode="outlined"
                                value={email}
                                onChangeText={setEmail}
                                placeholder="tu@negocio.com"
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
                                placeholder="Contraseña segura"
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

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Confirmar Contraseña</Text>
                            <TextInput
                                mode="outlined"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Repite tu contraseña"
                                secureTextEntry={!showPassword}
                                style={styles.input}
                                autoCapitalize="none"
                                outlineColor="#E0E0E0"
                                activeOutlineColor={theme.colors.primary}
                                textColor="#1C1C1E"
                                placeholderTextColor="#94A3B8"
                                disabled={loading}
                            />
                        </View>

                        <Button
                            mode="contained"
                            onPress={handleRegister}
                            loading={loading}
                            style={styles.registerButton}
                            contentStyle={styles.registerButtonContent}
                            labelStyle={styles.registerButtonLabel}
                        >
                            Crear cuenta
                        </Button>

                        <View style={styles.dividerRow}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>o regístrate con</Text>
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
                            <Text style={styles.alreadyText}>¿Ya tienes una cuenta?</Text>
                            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                                <Text style={styles.loginLink}>Inicia sesión</Text>
                            </TouchableOpacity>
                        </View>
                        {/* Contenedor para el CAPTCHA de Clerk en Web */}
                        {Platform.OS === 'web' && (
                            <div id="clerk-captcha" style={{ display: 'none' }} />
                        )}
                    </ScrollView>
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
    scroll: { flexGrow: 0 },
    backButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
    backText: { fontFamily: 'BricolageGrotesque_600SemiBold', fontSize: 14, color: '#00754A' },
    logoContainer: { marginBottom: 48, width: '100%', alignItems: 'flex-start' },
    logo: { width: 90, height: 90 },
    headerText: { marginBottom: 32 },
    title: { fontFamily: 'BricolageGrotesque_800ExtraBold', color: '#1E3932', fontSize: 32, marginBottom: 8 },
    subtitle: { fontFamily: 'BricolageGrotesque_400Regular', color: '#6B6B6B', fontSize: 16, lineHeight: 24 },
    inputGroup: { marginBottom: 16 },
    label: { fontFamily: 'BricolageGrotesque_600SemiBold', fontSize: 14, color: '#1E3932', marginBottom: 8 },
    input: { backgroundColor: '#FFFFFF', height: 52 },
    registerButton: { height: 56, borderRadius: 30, justifyContent: 'center', backgroundColor: '#00754A', marginTop: 16, marginBottom: 24 },
    registerButtonContent: { height: 56 },
    registerButtonLabel: { fontFamily: 'BricolageGrotesque_700Bold', fontSize: 16 },
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    divider: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
    dividerText: { paddingHorizontal: 16, fontFamily: 'BricolageGrotesque_400Regular', fontSize: 14, color: '#6B6B6B' },
    socialRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },
    socialButton: { flex: 1, flexDirection: 'row', height: 52, borderRadius: 30, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', gap: 12 },
    socialText: { fontFamily: 'BricolageGrotesque_600SemiBold', fontSize: 14, color: '#1C1C1E' },
    footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8, paddingBottom: 24 },
    alreadyText: { fontFamily: 'BricolageGrotesque_400Regular', fontSize: 14, color: '#6B6B6B' },
    loginLink: { fontFamily: 'BricolageGrotesque_700Bold', fontSize: 14, color: '#00754A' },
    rightSection: { flex: 1, padding: 24 },
    imageCard: { flex: 1, borderRadius: 40, overflow: 'hidden', position: 'relative' },
    heroImage: { width: '100%', height: '100%' },
    imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(30, 57, 50, 0.4)', justifyContent: 'flex-end', padding: 60 },
    starBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
    badgeText: { fontFamily: 'BricolageGrotesque_600SemiBold', color: '#FFFFFF', fontSize: 14, letterSpacing: 0.5 },
    overlayContent: { maxWidth: 600 },
    overlayTitle: { fontFamily: 'BricolageGrotesque_800ExtraBold', color: '#FFFFFF', fontSize: 48, lineHeight: 58, marginBottom: 0 },
});
