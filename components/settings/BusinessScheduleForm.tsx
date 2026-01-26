import React, { useState, useEffect } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, View, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, IconButton, Switch, useTheme, Surface, Button, SegmentedButtons } from 'react-native-paper';
import {
    Clock,
    CaretDown as ChevronDown,
    CaretUp as ChevronUp,
    Check as Save,
    Warning as AlertTriangle
} from 'phosphor-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AppBottomSheet from '@/components/AppBottomSheet';
import GlassmorphicHeader from '@/components/GlassmorphicHeader';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface BusinessScheduleFormProps {
    comercioId: Id<"comercios"> | null;
    initialHorario: string;
    initialTiempoLimite: number;
    onBack: () => void;
    onSaveSuccess?: () => void;
}

interface DaySchedule {
    active: boolean;
    open: string;
    close: string;
}

interface ScheduleState {
    weekdays: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
}

export default function BusinessScheduleForm({
    comercioId,
    initialHorario,
    initialTiempoLimite,
    onBack,
    onSaveSuccess,
}: BusinessScheduleFormProps) {
    const theme = useTheme();

    const [horario, setHorario] = useState(initialHorario);
    const [notasHorario, setNotasHorario] = useState('');
    const [tiempoLimite, setTiempoLimite] = useState(initialTiempoLimite?.toString() || '15');
    const [saving, setSaving] = useState(false);
    const [showScheduleEditor, setShowScheduleEditor] = useState(true);
    const [hasChanges, setHasChanges] = useState(false);

    // Time picker state
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [currentPickerDay, setCurrentPickerDay] = useState<keyof ScheduleState | null>(null);
    const [currentPickerType, setCurrentPickerType] = useState<'open' | 'close' | null>(null);
    const [tempTime, setTempTime] = useState(new Date());

    const updateComercio = useMutation(api.comercios.update);

    // Parse initial schedule
    const [schedule, setSchedule] = useState<ScheduleState>(() => {
        const state: ScheduleState = {
            weekdays: { active: true, open: '09:00', close: '18:00' },
            saturday: { active: true, open: '09:00', close: '14:00' },
            sunday: { active: false, open: '09:00', close: '18:00' },
        };

        if (initialHorario && initialHorario !== 'Cerrado temporalmente') {
            const parts = initialHorario.split('|').map(p => p.trim());
            parts.forEach(part => {
                if (part.includes('Lun-Vie:')) {
                    const times = part.replace('Lun-Vie:', '').trim().split('-');
                    if (times.length === 2) state.weekdays = { active: true, open: times[0], close: times[1] };
                } else if (part.includes('Sáb:')) {
                    const times = part.replace('Sáb:', '').trim().split('-');
                    if (times.length === 2) state.saturday = { active: true, open: times[0], close: times[1] };
                } else if (part.includes('Dom:')) {
                    const times = part.replace('Dom:', '').trim().split('-');
                    if (times.length === 2) state.sunday = { active: true, open: times[0], close: times[1] };
                }
            });
        }
        return state;
    });

    // Detect changes
    useEffect(() => {
        const scheduleChanged = horario !== initialHorario;
        const limitChanged = Number(tiempoLimite) !== (initialTiempoLimite || 15);
        setHasChanges(scheduleChanged || limitChanged);
    }, [horario, initialHorario, tiempoLimite, initialTiempoLimite]);

    // Format schedule string
    useEffect(() => {
        const parts = [];
        if (schedule.weekdays.active) parts.push(`Lun-Vie: ${schedule.weekdays.open}-${schedule.weekdays.close}`);
        if (schedule.saturday.active) parts.push(`Sáb: ${schedule.saturday.open}-${schedule.saturday.close}`);
        if (schedule.sunday.active) parts.push(`Dom: ${schedule.sunday.open}-${schedule.sunday.close}`);
        let h = parts.length === 0 ? 'Cerrado temporalmente' : parts.join(' | ');
        if (notasHorario.trim()) h += ` | ${notasHorario.trim()}`;
        setHorario(h);
    }, [schedule, notasHorario]);

    const updateSchedule = (day: keyof ScheduleState, field: keyof DaySchedule, value: any) => {
        setSchedule(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
    };

    const openTimePicker = (day: keyof ScheduleState, type: 'open' | 'close') => {
        const timeString = schedule[day][type];
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes);
        setTempTime(date);
        setCurrentPickerDay(day);
        setCurrentPickerType(type);
        setShowTimePicker(true);
    };

    const handleTimeConfirm = () => {
        if (currentPickerDay && currentPickerType) {
            const hours = tempTime.getHours().toString().padStart(2, '0');
            const minutes = tempTime.getMinutes().toString().padStart(2, '0');
            const timeString = `${hours}:${minutes}`;
            updateSchedule(currentPickerDay, currentPickerType, timeString);
        }
        setShowTimePicker(false);
    };

    const handleTimeChange = (event: any, selectedDate?: Date) => {
        if (selectedDate) setTempTime(selectedDate);
    };

    const handleSave = async () => {
        if (!comercioId) return;
        setSaving(true);
        try {
            await updateComercio({
                id: comercioId,
                updates: {
                    horario_atencion: horario,
                    tiempo_limite_cierre: Number(tiempoLimite),
                }
            });
            setHasChanges(false);
            Alert.alert('Éxito', 'Horario y configuración guardados');
            onSaveSuccess?.();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'No se pudo guardar');
        } finally {
            setSaving(false);
        }
    };

    const getPickerTitle = () => {
        if (!currentPickerDay || !currentPickerType) return 'Seleccionar Hora';
        const dayLabels: Record<keyof ScheduleState, string> = {
            weekdays: 'Lun-Vie',
            saturday: 'Sábado',
            sunday: 'Domingo',
        };
        const typeLabel = currentPickerType === 'open' ? 'Apertura' : 'Cierre';
        return `${dayLabels[currentPickerDay]} - ${typeLabel}`;
    };

    const ScheduleRow = ({ label, day }: { label: string, day: keyof ScheduleState }) => (
        <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text variant="titleSmall" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>{label}</Text>
                <Switch value={schedule[day].active} onValueChange={(val) => updateSchedule(day, 'active', val)} color="#00754A" />
            </View>
            {schedule[day].active && (
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Button
                        mode="outlined"
                        onPress={() => openTimePicker(day, 'open')}
                        style={{ flex: 1, borderColor: theme.colors.primary, borderRadius: 12 }}
                        labelStyle={{ color: theme.colors.primary }}
                        icon={() => <Clock size={16} color={theme.colors.primary} />}
                    >
                        Abre: {schedule[day].open}
                    </Button>
                    <Button
                        mode="outlined"
                        onPress={() => openTimePicker(day, 'close')}
                        style={{ flex: 1, borderColor: theme.colors.primary, borderRadius: 12 }}
                        labelStyle={{ color: theme.colors.primary }}
                        icon={() => <Clock size={16} color={theme.colors.primary} />}
                    >
                        Cierra: {schedule[day].close}
                    </Button>
                </View>
            )}
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#F2F0EB' }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ paddingTop: 85, paddingHorizontal: 16, paddingBottom: 150 }}>
                    <View style={{ gap: 20 }}>
                        <Surface style={{ backgroundColor: theme.colors.surface, padding: 24, borderRadius: 24 }} elevation={0}>
                            <TouchableOpacity onPress={() => setShowScheduleEditor(!showScheduleEditor)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>Horario de Atención</Text>
                                {showScheduleEditor ? <ChevronUp size={20} color={theme.colors.primary} /> : <ChevronDown size={20} color={theme.colors.primary} />}
                            </TouchableOpacity>
                            {showScheduleEditor && (
                                <View style={{ marginTop: 20, gap: 20 }}>
                                    <ScheduleRow label="Lun-Vie" day="weekdays" />
                                    <ScheduleRow label="Sábado" day="saturday" />
                                    <ScheduleRow label="Domingo" day="sunday" />
                                    <TextInput
                                        label="Notas adicionales"
                                        value={notasHorario}
                                        onChangeText={setNotasHorario}
                                        mode="outlined"
                                        multiline
                                        activeOutlineColor="#00754A"
                                        outlineStyle={{ borderRadius: 12 }}
                                        style={{ backgroundColor: 'transparent' }}
                                        left={<TextInput.Icon icon={() => <Clock size={20} color="#00754A" />} />}
                                    />
                                    <View style={{ backgroundColor: '#F8F9FA', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0' }}>
                                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8, fontWeight: '600', textTransform: 'uppercase' }}>Previsualización del horario</Text>
                                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, lineHeight: 22 }}>{horario || 'Cerrado temporalmente'}</Text>
                                    </View>
                                </View>
                            )}
                        </Surface>

                        {/* Nueva sección: Cierre de Pedidos */}
                        <Surface style={{ backgroundColor: theme.colors.surface, padding: 24, borderRadius: 24 }} elevation={0}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                <AlertTriangle size={22} color={theme.colors.primary} />
                                <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>Cierre de Pedidos</Text>
                            </View>

                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
                                ¿Cuántos minutos antes del cierre dejas de recibir pedidos nuevos?
                            </Text>

                            <SegmentedButtons
                                value={tiempoLimite}
                                onValueChange={setTiempoLimite}
                                buttons={[
                                    { value: '10', label: '10 min' },
                                    { value: '15', label: '15 min' },
                                    { value: '30', label: '30 min' },
                                ]}
                                theme={{ colors: { secondaryContainer: 'rgba(0, 117, 74, 0.1)', onSecondaryContainer: '#00754A' } }}
                            />
                        </Surface>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <GlassmorphicHeader
                title="Horario"
                icon={Clock}
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

            <AppBottomSheet
                visible={showTimePicker}
                onClose={() => setShowTimePicker(false)}
                title={getPickerTitle()}
                snapPoints={['50%', '50%']}
                enableContentPanningGesture={false}
            >
                <View style={{ alignItems: 'center', gap: 20, paddingBottom: 32 }}>
                    <DateTimePicker
                        value={tempTime}
                        mode="time"
                        is24Hour={true}
                        display="spinner"
                        onChange={handleTimeChange}
                        style={{ width: '100%', height: 200 }}
                        textColor={theme.colors.onSurface}
                    />
                    <Button mode="contained" onPress={handleTimeConfirm} style={{ backgroundColor: '#00754A', borderRadius: 12, width: '100%' }} contentStyle={{ height: 48 }} labelStyle={{ fontSize: 16, fontWeight: '700' }}>Confirmar</Button>
                </View>
            </AppBottomSheet>
        </View>
    );
}
