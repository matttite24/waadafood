import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import { Text, IconButton, useTheme } from 'react-native-paper';
import { Bell, Question, MagnifyingGlass, X } from 'phosphor-react-native';
import { usePathname } from 'expo-router';

interface HeaderAction {
    label: string;
    icon: any;
    onPress: () => void;
    color?: string;
    disabled?: boolean;
}

interface WebHeaderProps {
    primaryAction?: HeaderAction;
    title?: string;
    subtitle?: string;
    value?: string;
    onChange?: (text: string) => void;
}

export default function WebHeader({ primaryAction, title: customTitle, subtitle: customSubtitle, value, onChange }: WebHeaderProps) {
    const theme = useTheme();
    const pathname = usePathname();

    const getTitle = () => {
        if (customTitle) return customTitle;
        if (pathname === '/mensajes') return 'Mensajes';
        if (pathname === '/menu' || pathname.includes('/producto/')) return 'Menú';
        if (pathname.includes('/pedidos')) return 'Pedidos';
        if (pathname.includes('/metricas')) return 'Métricas';
        if (pathname.includes('/settings')) return 'Configuración';
        return 'Dashboard';
    };

    return (
        <BlurView
            intensity={80}
            tint="extraLight"
            style={[
                styles.container,
                {
                    backgroundColor: 'rgba(242, 240, 235, 0.2)',
                    borderBottomColor: 'rgba(0, 117, 74, 0.05)',
                }
            ]}
        >
            <View style={styles.leftSection}>
                <Text style={styles.title}>{getTitle()}</Text>
            </View>

            <View style={styles.centerSection}>
                {onChange && (
                    <View style={styles.searchContainer}>
                        <MagnifyingGlass size={18} color="rgba(30, 57, 50, 0.4)" style={styles.searchIcon} />
                        <TextInput
                            value={value}
                            onChangeText={onChange}
                            placeholder="Buscar..."
                            placeholderTextColor="rgba(30, 57, 50, 0.4)"
                            style={styles.searchInput}
                        />
                        {value ? (
                            <TouchableOpacity onPress={() => onChange('')} style={styles.clearButton}>
                                <X size={16} color="rgba(30, 57, 50, 0.4)" />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                )}
            </View>

            <View style={styles.rightSection}>
                <IconButton
                    icon={() => <Question size={22} color="#1E3932" />}
                    onPress={() => { }}
                    style={styles.headerIconButton}
                />
                <IconButton
                    icon={() => <Bell size={22} color="#1E3932" />}
                    onPress={() => { }}
                    style={styles.headerIconButton}
                />

                <View style={styles.divider} />

                {primaryAction && (
                    <TouchableOpacity
                        style={[
                            styles.primaryActionBtn,
                            { backgroundColor: primaryAction.color || '#00754A' }
                        ]}
                        onPress={primaryAction.onPress}
                        activeOpacity={0.8}
                    >
                        {primaryAction.icon && <primaryAction.icon size={20} color="#FFFFFF" style={{ marginRight: 8 }} />}
                        <Text style={styles.primaryActionLabel}>{primaryAction.label}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </BlurView>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 74,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 40,
        borderBottomWidth: 0,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    leftSection: {
        flex: 0.3,
    },
    centerSection: {
        flex: 0.4,
        alignItems: 'center',
    },
    title: {
        fontFamily: 'BricolageGrotesque_800ExtraBold',
        fontSize: 32,
        color: '#1E3932',
        letterSpacing: -0.8,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: 'rgba(0, 117, 74, 0.05)',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        fontSize: 15,
        color: '#1E3932',
        fontWeight: '500',
        outlineStyle: 'none',
    } as any, // Web compat
    clearButton: {
        padding: 4,
    },
    rightSection: {
        flex: 0.3,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 12,
    },
    headerIconButton: {
        backgroundColor: 'rgba(0, 117, 74, 0.05)',
        margin: 0,
        width: 44,
        height: 44,
    },
    divider: {
        width: 1,
        height: 32,
        backgroundColor: 'rgba(0, 117, 74, 0.1)',
        marginHorizontal: 12,
    },
    primaryActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 30,
        shadowColor: '#00754A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    primaryActionLabel: {
        fontFamily: 'BricolageGrotesque_800ExtraBold',
        color: '#FFFFFF',
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
