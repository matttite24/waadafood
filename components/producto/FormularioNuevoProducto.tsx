import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, TextInput, Button, useTheme } from 'react-native-paper';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import AppChip from '@/components/AppChip';

const CATEGORIAS_LISTA = ['Combos', 'Entradas', 'Principales', 'Bebidas', 'Postres', 'Otros'];

interface FormularioNuevoProductoProps {
    comercioId: Id<"comercios">;
    onComplete: () => void;
}

export default function FormularioNuevoProducto({ comercioId, onComplete }: FormularioNuevoProductoProps) {
    const theme = useTheme();
    const [saving, setSaving] = useState(false);
    const [nombre, setNombre] = useState('');
    const [precio, setPrecio] = useState('');
    const [categoria, setCategoria] = useState('Principales');
    const [descripcion, setDescripcion] = useState('');

    const createProducto = useMutation(api.productos.create);

    const handleGuardar = async () => {
        if (!nombre.trim() || !precio.trim()) return;
        setSaving(true);
        try {
            await createProducto({
                comercio_id: comercioId,
                nombre: nombre.trim(),
                precio: parseFloat(precio),
                descripcion: descripcion.trim(),
                categoria: categoria,
                disponible: true
            });
            // Reset form
            setNombre('');
            setPrecio('');
            setDescripcion('');
            setCategoria('Principales');
            onComplete();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={{ gap: 24, paddingVertical: 8 }}>
            <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        {CATEGORIAS_LISTA.map(cat => (
                            <AppChip key={cat} selected={categoria === cat} onPress={() => setCategoria(cat)}>{cat}</AppChip>
                        ))}
                    </View>
                </ScrollView>
            </View>
            <TextInput
                label="Nombre del plato"
                mode="outlined"
                value={nombre}
                onChangeText={setNombre}
                outlineStyle={{ borderRadius: 12 }}
                style={{ backgroundColor: '#FFF' }}
                activeOutlineColor="#00754A"
                outlineColor="#E0E0E0"
                selectionColor="rgba(0, 117, 74, 0.2)"
                cursorColor="#00754A"
            />
            <TextInput
                label="Descripción (opcional)"
                mode="outlined"
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                numberOfLines={3}
                outlineStyle={{ borderRadius: 12 }}
                style={{ backgroundColor: '#FFF' }}
                activeOutlineColor="#00754A"
                outlineColor="#E0E0E0"
                selectionColor="rgba(0, 117, 74, 0.2)"
                cursorColor="#00754A"
            />
            <TextInput
                label="Precio"
                mode="outlined"
                value={precio}
                onChangeText={setPrecio}
                keyboardType="decimal-pad"
                left={<TextInput.Affix text="$" />}
                outlineStyle={{ borderRadius: 12 }}
                style={{ backgroundColor: '#FFF' }}
                activeOutlineColor="#00754A"
                outlineColor="#E0E0E0"
                selectionColor="rgba(0, 117, 74, 0.2)"
                cursorColor="#00754A"
            />
            <Button
                mode="contained"
                onPress={handleGuardar}
                loading={saving}
                disabled={saving}
                style={styles.submitButton}
                contentStyle={styles.submitButtonContent}
                labelStyle={styles.submitButtonLabel}
            >
                Guardar en el Menú
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    submitButton: {
        borderRadius: 28,
        backgroundColor: '#00754A',
        marginTop: 8,
        shadowColor: '#00754A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    submitButtonContent: {
        height: 52,
    },
    submitButtonLabel: {
        fontSize: 16,
        fontWeight: '700',
    },
});
