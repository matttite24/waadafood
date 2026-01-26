import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Text, useTheme, Card, Button, ProgressBar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Lightning as Zap, Crown, CheckCircle as CheckCircle2, Warning as AlertTriangle, CaretLeft as ArrowLeft, PlusCircle, SquaresFour as LayoutGrid } from 'phosphor-react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@clerk/clerk-expo';
import BlurViewWrapper from '@/components/BlurViewWrapper';

const { width } = Dimensions.get('window');

export default function CreditosScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { userId } = useAuth();

    const comercio = useQuery(api.comercios.getByUserId, userId ? { userId } : "skip");
    const otorgarCreditos = useMutation(api.comercios.otorgarCreditos);

    const creditos = comercio?.creditos ?? 0;
    const maxCreditos = 100; // Referencia para la barra
    const progress = Math.min(creditos / maxCreditos, 1);

    const getStatusColor = () => {
        if (creditos === 0) return '#EF4444';
        if (creditos < 10) return '#F59E0B';
        return '#00754A';
    };

    const handleRechargeSimulated = async () => {
        if (comercio) {
            await otorgarCreditos({ id: comercio._id, cantidad: 50 });
        }
    };

    if (comercio === undefined) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#1E3932" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Créditos IA</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Main Glassmorphic Balance Card */}
                <View style={styles.glassCardContainer}>
                    <BlurViewWrapper intensity={40} style={styles.glassCard}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: `${getStatusColor()}20` }]}>
                                <Zap size={32} color={getStatusColor()} weight="fill" />
                            </View>
                            <View>
                                <Text style={styles.balanceLabel}>Balance Actual</Text>
                                <Text style={[styles.balanceValue, { color: getStatusColor() }]}>{creditos}</Text>
                            </View>
                        </View>

                        <View style={styles.progressSection}>
                            <View style={styles.progressLabels}>
                                <Text style={styles.progressText}>
                                    {creditos === 0 ? 'Sin créditos' : `${creditos} mensajes disponibles`}
                                </Text>
                                <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
                            </View>
                            <ProgressBar
                                progress={progress}
                                color={getStatusColor()}
                                style={styles.progressBar}
                            />
                        </View>

                        {creditos < 10 && (
                            <View style={[styles.alertBanner, { backgroundColor: creditos === 0 ? '#FEF2F2' : '#FFFBEB' }]}>
                                <AlertTriangle size={16} color={creditos === 0 ? '#EF4444' : '#B45309'} />
                                <Text style={[styles.alertText, { color: creditos === 0 ? '#EF4444' : '#B45309' }]}>
                                    {creditos === 0
                                        ? 'Atención: IA desactivada por falta de créditos'
                                        : 'Aviso: Tus créditos se están agotando'}
                                </Text>
                            </View>
                        )}
                    </BlurViewWrapper>
                </View>

                {/* Gamification Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Gana Créditos Gratis</Text>
                    <Text style={styles.sectionSubtitle}>Completa estas tareas para potenciar tu IA</Text>
                </View>

                <View style={styles.tasksContainer}>
                    <TaskItem
                        title="Configura tu menú"
                        reward="+20"
                        completed={!!comercio?.imagenes_menu?.length}
                        icon={LayoutGrid}
                    />
                    <TaskItem
                        title="Vincular métodos de pago"
                        reward="+15"
                        completed={!!(comercio?.pago_efectivo || comercio?.pago_transferencia)}
                        icon={Crown}
                    />
                    <TaskItem
                        title="Personalizar personalidad"
                        reward="+10"
                        completed={!!comercio?.prompt_personalidad}
                        icon={BotIcon}
                    />
                </View>

                {/* Actions */}
                <Button
                    mode="contained"
                    onPress={handleRechargeSimulated}
                    style={styles.rechargeButton}
                    contentStyle={styles.rechargeButtonContent}
                    labelStyle={styles.rechargeButtonLabel}
                >
                    Recargar Paquete (Simulado)
                </Button>

                <TouchableOpacity style={styles.supportLink}>
                    <Text style={styles.supportText}>¿Necesitas ayuda con tus créditos?</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

function TaskItem({ title, reward, completed, icon: Icon }: any) {
    const theme = useTheme();
    return (
        <Card style={styles.taskCard}>
            <Card.Content style={styles.taskContent}>
                <View style={[styles.taskIconCircle, { backgroundColor: completed ? '#E6F4EA' : '#F3F4F6' }]}>
                    <Icon size={20} color={completed ? '#00754A' : '#6B7280'} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.taskTitle, completed && styles.taskTitleCompleted]}>{title}</Text>
                    {!completed && <Text style={styles.taskReward}>{reward} créditos</Text>}
                </View>
                {completed ? (
                    <CheckCircle2 size={24} color="#00754A" />
                ) : (
                    <PlusCircle size={22} color={theme.colors.primary} />
                )}
            </Card.Content>
        </Card>
    );
}

const BotIcon = ({ size, color }: any) => (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Crown size={size} color={color} />
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'BricolageGrotesque_700Bold',
        color: '#1E3932',
        marginLeft: 16,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    glassCardContainer: {
        padding: 20,
        marginTop: 10,
    },
    glassCard: {
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    balanceLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    balanceValue: {
        fontSize: 42,
        fontFamily: 'BricolageGrotesque_800ExtraBold',
        letterSpacing: -1,
    },
    progressSection: {
        marginBottom: 16,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressText: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '600',
    },
    progressPercent: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '700',
    },
    progressBar: {
        height: 10,
        borderRadius: 5,
        backgroundColor: '#E5E7EB',
    },
    alertBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 16,
        marginTop: 8,
    },
    alertText: {
        fontSize: 12,
        fontWeight: '700',
    },
    sectionHeader: {
        paddingHorizontal: 24,
        marginTop: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'BricolageGrotesque_700Bold',
        color: '#1E3932',
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    tasksContainer: {
        paddingHorizontal: 20,
        gap: 12,
    },
    taskCard: {
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        elevation: 0,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    taskContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    taskIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    taskTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    taskTitleCompleted: {
        color: '#9CA3AF',
        textDecorationLine: 'line-through',
    },
    taskReward: {
        fontSize: 12,
        color: '#00754A',
        fontWeight: '600',
    },
    rechargeButton: {
        marginHorizontal: 20,
        marginTop: 32,
        borderRadius: 20,
        backgroundColor: '#1E3932',
    },
    rechargeButtonContent: {
        height: 56,
    },
    rechargeButtonLabel: {
        fontSize: 16,
        fontFamily: 'BricolageGrotesque_700Bold',
    },
    supportLink: {
        alignSelf: 'center',
        marginTop: 20,
        padding: 10,
    },
    supportText: {
        fontSize: 13,
        color: '#6B7280',
        textDecorationLine: 'underline',
    }
});
