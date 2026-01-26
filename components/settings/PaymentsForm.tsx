import React, { useState } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, View, Alert, DeviceEventEmitter, useWindowDimensions } from 'react-native';
import { Text, TextInput, IconButton, useTheme, Surface, Switch, Divider } from 'react-native-paper';
import {
    CurrencyCircleDollar,
    Check as Save,
    Money as Banknote,
    Bank,
    ChatCircleText as MessageSquare,
} from 'phosphor-react-native';
import GlassmorphicHeader from '@/components/GlassmorphicHeader';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface PaymentsFormProps {
    comercioId: Id<"comercios"> | null;
    initialData: {
        instruccionesPago: string;
        pagoEfectivo: boolean;
        pagoTransferencia: boolean;
    };
    onBack: () => void;
    onSaveSuccess?: () => void;
}

export default function PaymentsForm({
    comercioId,
    initialData,
    onBack,
    onSaveSuccess,
}: PaymentsFormProps) {
    const theme = useTheme();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024 && Platform.OS === 'web';

    const [instruccionesPago, setInstruccionesPago] = useState(initialData.instruccionesPago);
    const [pagoEfectivo, setPagoEfectivo] = useState(initialData.pagoEfectivo);
    const [pagoTransferencia, setPagoTransferencia] = useState(initialData.pagoTransferencia);

    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const updateComercio = useMutation(api.comercios.update);

    // Sincronizar estado local si initialData cambia
    React.useEffect(() => {
        setInstruccionesPago(initialData.instruccionesPago);
        setPagoEfectivo(initialData.pagoEfectivo);
        setPagoTransferencia(initialData.pagoTransferencia);
    }, [initialData]);

    // Detectar cambios sin guardar
    React.useEffect(() => {
        const changed =
            instruccionesPago !== initialData.instruccionesPago ||
            pagoEfectivo !== initialData.pagoEfectivo ||
            pagoTransferencia !== initialData.pagoTransferencia;
        setHasChanges(changed);
    }, [instruccionesPago, pagoEfectivo, pagoTransferencia, initialData]);

    const handleSave = async () => {
        if (!comercioId) {
            Alert.alert('Error', 'ID de comercio no encontrado');
            return;
        }

        setSaving(true);
        try {
            await updateComercio({
                id: comercioId,
                updates: {
                    instrucciones_pago: instruccionesPago,
                    pago_efectivo: pagoEfectivo,
                    pago_transferencia: pagoTransferencia,
                }
            });

            Alert.alert('Éxito', 'Configuración de pagos guardada correctamente');
            setHasChanges(false);
            onSaveSuccess?.();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'No se pudo guardar');
        } finally {
            setSaving(false);
        }
    };

    React.useEffect(() => {
        const sub = DeviceEventEmitter.addListener('WEB_SAVE_SETTINGS', () => {
            handleSave();
        });
        return () => sub.remove();
    }, [instruccionesPago, pagoEfectivo, pagoTransferencia, comercioId]);

    // Generar texto de previsualización
    const previewText = (() => {
        const p = [];
        if (pagoEfectivo) p.push("Efectivo");
        if (pagoTransferencia) p.push("Transferencia");
        const metodos = p.length > 0 ? `Aceptamos: ${p.join(", ")}.` : "";
        return `${metodos} ${instruccionesPago || ""}`.trim() || "No definido";
    })();

    return (
        <View style={{ flex: 1, backgroundColor: '#F2F0EB' }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingTop: 85, paddingHorizontal: 16, paddingBottom: 150 }}
                >
                    <View style={{ gap: 20 }}>
                        <Surface style={{
                            backgroundColor: theme.colors.surface,
                            padding: 24,
                            borderRadius: 24,
                            gap: 24,
                        }} elevation={0}>
                            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                                Métodos de Pago
                            </Text>

                            {/* Toggles */}
                            <View style={{ gap: 16 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <View style={{
                                            backgroundColor: pagoEfectivo ? 'rgba(34, 197, 94, 0.1)' : theme.colors.surfaceVariant,
                                            padding: 10,
                                            borderRadius: 12
                                        }}>
                                            <Banknote size={24} color={pagoEfectivo ? '#22c55e' : theme.colors.onSurfaceVariant} />
                                        </View>
                                        <View>
                                            <Text variant="bodyLarge" style={{ fontWeight: '600' }}>Efectivo</Text>
                                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Pago al recibir / en local</Text>
                                        </View>
                                    </View>
                                    <Switch value={pagoEfectivo} onValueChange={setPagoEfectivo} color="#22c55e" />
                                </View>

                                <Divider style={{ backgroundColor: theme.colors.outlineVariant, opacity: 0.5 }} />

                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <View style={{
                                            backgroundColor: pagoTransferencia ? 'rgba(59, 130, 246, 0.1)' : theme.colors.surfaceVariant,
                                            padding: 10,
                                            borderRadius: 12
                                        }}>
                                            <Bank size={24} color={pagoTransferencia ? '#3b82f6' : theme.colors.onSurfaceVariant} />
                                        </View>
                                        <View>
                                            <Text variant="bodyLarge" style={{ fontWeight: '600' }}>Transferencias</Text>
                                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Bancarias inmediatas</Text>
                                        </View>
                                    </View>
                                    <Switch value={pagoTransferencia} onValueChange={setPagoTransferencia} color="#3b82f6" />
                                </View>
                            </View>

                            {/* Datos Bancarios Input */}
                            <View>
                                <Text variant="titleSmall" style={{ fontWeight: 'bold', color: theme.colors.primary, marginBottom: 8, marginTop: 8 }}>
                                    Datos Bancarios / Instrucciones Adicionales
                                </Text>
                                <TextInput
                                    mode="outlined"
                                    value={instruccionesPago}
                                    onChangeText={setInstruccionesPago}
                                    multiline
                                    numberOfLines={10}
                                    placeholder="Ej: Número de Cuenta: 000...,Nombre y correo, etc."
                                    activeOutlineColor="#00754A"
                                    outlineStyle={{ borderRadius: 12 }}
                                    style={{ backgroundColor: 'transparent' }}
                                />
                                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}>
                                    Detalles específicos que la IA compartirá cuando el cliente elija pagar.
                                </Text>
                            </View>
                        </Surface>

                        {/* Previsualización */}
                        <Surface style={{
                            backgroundColor: theme.colors.surface,
                            padding: 24,
                            borderRadius: 24,
                            gap: 16,
                            borderWidth: 1,
                            borderColor: 'rgba(0,0,0,0.05)'
                        }} elevation={0}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <MessageSquare size={18} color={theme.colors.primary} />
                                <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                                    Lo que dirá la IA
                                </Text>
                            </View>

                            <View style={{
                                backgroundColor: theme.colors.surfaceVariant,
                                padding: 16,
                                borderRadius: 16,
                                borderTopLeftRadius: 4,
                            }}>
                                <Text style={{ fontStyle: 'italic', color: theme.colors.onSurface }}>
                                    "{previewText}"
                                </Text>
                            </View>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                Esta es la información exacta que tendrá disponible el asistente para responder.
                            </Text>
                        </Surface>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <GlassmorphicHeader
                title="Pagos"
                icon={CurrencyCircleDollar}
                onBack={onBack}
                actionButton={
                    <IconButton
                        icon={() => <Save size={20} color={saving ? theme.colors.onSurfaceVariant : (hasChanges ? '#FFFFFF' : theme.colors.onSurfaceVariant)} />}
                        onPress={handleSave}
                        disabled={saving || !hasChanges}
                        loading={saving}
                        style={{
                            backgroundColor: saving ? theme.colors.surfaceVariant : (hasChanges ? '#10B981' : theme.colors.surfaceVariant),
                            borderRadius: 99,
                            margin: 0,
                            width: 44,
                            height: 44,
                            shadowColor: hasChanges ? '#10B981' : 'transparent',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: hasChanges ? 0.5 : 0,
                            shadowRadius: hasChanges ? 12 : 0,
                            elevation: hasChanges ? 8 : 0,
                        }}
                    />
                }
            />
        </View>
    );
}
