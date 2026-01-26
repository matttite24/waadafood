import { View, StyleSheet, Image } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Sparkle as Sparkles, Storefront as Store, ChatCircleText as MessageSquare } from 'phosphor-react-native';

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Store size={64} color="#00754A" weight="regular" />
                </View>

                {/* Title */}
                <Text style={styles.title}>¡Bienvenido a WaadaFood!</Text>
                <Text style={styles.subtitle}>
                    Configura tu negocio en 3 simples pasos y comienza a atender clientes con tu asistente IA
                </Text>

                {/* Features */}
                <View style={styles.features}>
                    <View style={styles.feature}>
                        <Store size={24} color="#00754A" />
                        <Text style={styles.featureText}>Configura tu negocio</Text>
                    </View>
                    <View style={styles.feature}>
                        <Sparkles size={24} color="#00754A" />
                        <Text style={styles.featureText}>Personaliza tu asistente IA</Text>
                    </View>
                    <View style={styles.feature}>
                        <MessageSquare size={24} color="#00754A" />
                        <Text style={styles.featureText}>Atiende clientes 24/7</Text>
                    </View>
                </View>
            </View>

            {/* CTA Button */}
            <View style={styles.footer}>
                <Button
                    mode="contained"
                    onPress={() => router.push('/(onboarding)/step1-business')}
                    style={styles.button}
                    labelStyle={styles.buttonLabel}
                >
                    Comenzar
                </Button>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F0EB',
    },
    content: {
        flex: 1,
        paddingHorizontal: 32,
        paddingTop: 80,
        alignItems: 'center',
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#D4E9E2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1E3932',
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 48,
    },
    features: {
        width: '100%',
        gap: 24,
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    featureText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E3932',
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
    },
    button: {
        backgroundColor: '#00754A',
        borderRadius: 12,
        paddingVertical: 8,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
