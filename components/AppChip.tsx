import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip, useTheme } from 'react-native-paper';

interface AppChipProps {
    children: React.ReactNode;
    selected?: boolean;
    onPress?: () => void;
    activeColor?: string;
    mode?: 'flat' | 'outlined';
    icon?: string | any;
    style?: any;
    textStyle?: any;
}

/**
 * AppChip - Componente centralizado para mantener el estilo de los filtros y categorías.
 * Cualquier cambio visual realizado aquí se reflejará en toda la aplicación.
 */
export default function AppChip({
    children,
    selected = false,
    onPress,
    activeColor,
    mode = 'flat', // Cambiado a flat para evitar bordes por defecto
    icon,
    style,
    textStyle,
}: AppChipProps) {
    const theme = useTheme();

    // Si no se provee un color activo, usamos el primario del tema
    const selectionColor = activeColor || theme.colors.primary;

    return (
        <Chip
            selected={selected}
            onPress={onPress}
            mode={mode}
            icon={icon}
            showSelectedOverlay={false} // Desactivamos el overlay para tener control total del color
            style={[
                styles.chip,
                {
                    backgroundColor: selected ? 'rgba(0, 117, 74, 0.12)' : 'rgba(255, 255, 255, 0.6)',
                    borderWidth: 1,
                    borderColor: selected ? 'rgba(0, 117, 74, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                },
                style
            ]}
            rippleColor="rgba(0, 117, 74, 0.1)"
            textStyle={[
                styles.text,
                {
                    color: selected ? '#00754A' : theme.colors.onSurfaceVariant,
                },
                textStyle
            ]}
            selectedColor="#00754A"
        >
            {children}
        </Chip>
    );
}

const styles = StyleSheet.create({
    chip: {
        borderRadius: 20,
        minHeight: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontFamily: 'BricolageGrotesque_700Bold',
        fontSize: 13,
        textAlignVertical: 'center',
        includeFontPadding: false,
    },
});
