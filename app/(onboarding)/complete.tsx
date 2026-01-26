import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { CheckCircle, Lightning as Zap } from 'phosphor-react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

export default function CompleteScreen() {
    const router = useRouter();

    useEffect(() => {
        // Auto-redirect después de 3 segundos
        const timer = setTimeout(() => {
            router.replace('/(app)/menu');
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View entering={ZoomIn.duration(600)} style={styles.content}>
                <View style={styles.iconContainer}>
                    <CheckCircle size={80} color="#00754A" weight="regular" />
                </View>

                <Animated.View entering={FadeIn.delay(300)}>
                    <Text style={styles.title}>¡Todo Listo!</Text>
                    <Text style={styles.subtitle}>
                        Tu negocio ha sido configurado exitosamente
                    </Text>

                    <View style={styles.creditBadge}>
                        <Zap size={16} color="#EAB308" weight="fill" />
                        <Text style={styles.creditText}>Has ganado 20 créditos IA de regalo</Text>
                    </View>

                    <Text style={styles.description}>
                        Ahora puedes comenzar a gestionar tu menú, recibir pedidos y atender clientes con tu asistente IA.
                    </Text>
                </Animated.View>
            </Animated.View>

            <View style={styles.footer}>
                <Button
                    mode="contained"
                    onPress={() => router.replace('/(app)/menu')}
                    style={styles.button}
                    labelStyle={styles.buttonLabel}
                >
                    Ir al Dashboard
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#D4E9E2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1E3932',
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#00754A',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 24,
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
    },
    creditBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEFCE8',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FEF08A',
        alignSelf: 'center',
        marginBottom: 20,
        gap: 8,
    },
    creditText: {
        color: '#854D0E',
        fontSize: 14,
        fontWeight: '700',
    },
});
