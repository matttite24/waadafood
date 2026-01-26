import { useState, useEffect } from 'react';
import { Alert, DeviceEventEmitter } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

export function useProductoForm(id: string | string[], onSaveComplete?: () => void) {
    const router = useRouter();
    const productId = id as Id<"productos">;

    // Convex Hooks
    const producto = useQuery(api.productos.get, { id: productId });
    const updateProducto = useMutation(api.productos.update);
    const deleteProducto = useMutation(api.productos.remove);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    // Note: If you have a dedicated action for file deletion or URL management, use it.
    // Assuming we use Convex Storage directly or a mutation for it.

    // Loading states
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    // Form states
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [precio, setPrecio] = useState('');
    const [categoria, setCategoria] = useState('');
    const [disponible, setDisponible] = useState(true);
    const [imagenUrl, setImagenUrl] = useState<string | null>(null);

    useEffect(() => {
        if (producto) {
            setNombre(producto.nombre || '');
            setDescripcion(producto.descripcion || '');
            setPrecio(String(producto.precio || ''));
            setCategoria(producto.categoria || 'Principales');
            setDisponible(producto.disponible !== false);
            setImagenUrl(producto.imagen_url || null);
            setIsDirty(false);
        }
    }, [producto]);

    // Auto-save logic
    useEffect(() => {
        if (!producto) return;

        const hasChanged =
            nombre !== (producto.nombre || '') ||
            descripcion !== (producto.descripcion || '') ||
            precio !== String(producto.precio || '') ||
            categoria !== (producto.categoria || '') ||
            disponible !== (producto.disponible !== false);

        if (hasChanged) {
            setIsDirty(true);
            const timer = setTimeout(() => {
                handleGuardar(true);
            }, 2000); // 2 seconds debounce
            return () => clearTimeout(timer);
        } else {
            setIsDirty(false);
        }
    }, [nombre, descripcion, precio, categoria, disponible]);

    // Manual save trigger listener
    useEffect(() => {
        const sub = DeviceEventEmitter.addListener('MANUAL_SAVE_TRIGGER', () => {
            handleGuardar(false);
        });
        return () => sub.remove();
    }, [nombre, precio, descripcion, categoria, disponible, imagenUrl]);

    const handleGuardar = async (silent = false) => {
        if (!nombre.trim() || !precio.trim()) {
            if (!silent) Alert.alert('Faltan datos', 'El nombre y el precio son obligatorios.');
            return;
        }

        setSaving(true);
        try {
            await updateProducto({
                id: productId,
                nombre: nombre.trim(),
                descripcion: descripcion.trim(),
                precio: parseFloat(precio),
                categoria: categoria,
                disponible: disponible,
                imagen_url: imagenUrl || undefined
            });

            setLastSaved(new Date());
            setIsDirty(false);

            // Emitir evento para que el menú se actualice
            DeviceEventEmitter.emit('PRODUCTO_UPDATED');

            if (!silent) {
                // Usar callback si está disponible, sino navegar hacia atrás
                if (onSaveComplete) {
                    onSaveComplete();
                } else {
                    Alert.alert('Éxito', 'Producto actualizado correctamente');
                    router.back();
                }
            }
        } catch (error: any) {
            if (!silent) Alert.alert('Error', 'No se pudo guardar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEliminarImagen = async () => {
        const isWeb = typeof window !== 'undefined' && window.confirm;
        const confirmMsg = '¿Quitar la imagen de este plato?';

        const proceedWithDeletion = async () => {
            try {
                // Actualizar el producto para quitar la referencia de la imagen
                await updateProducto({
                    id: productId,
                    imagen_url: undefined
                });

                // Actualizar el estado local inmediatamente
                setImagenUrl(null);

            } catch (error: any) {
                const errorMsg = 'No se pudo eliminar la imagen: ' + error.message;
                if (isWeb) window.alert('Error: ' + errorMsg);
                else Alert.alert('Error', errorMsg);
            }
        };

        if (isWeb) {
            if (window.confirm(confirmMsg)) {
                await proceedWithDeletion();
            }
        } else {
            Alert.alert(
                'Eliminar Imagen',
                confirmMsg,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Eliminar', style: 'destructive', onPress: proceedWithDeletion }
                ]
            );
        }
    };

    const handleEliminar = async () => {
        Alert.alert(
            'Eliminar Producto',
            '¿Estás seguro de que quieres eliminar este plato? Esta acción no se puede deshacer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            // En Convex Storage, el borrado de archivos se gestiona de forma diferente o se delega.
                            // El almacenamiento en Convex es automático por storageId.
                            // Para eliminar el documento del producto:
                            await deleteProducto({ id: productId });
                            router.back();
                        } catch (error: any) {
                            Alert.alert('Error', 'No se pudo eliminar: ' + error.message);
                        } finally {
                            setDeleting(false);
                        }
                    }
                }
            ]
        );
    };

    const handleSeleccionarImagen = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso necesario', 'Necesitamos acceso a tus fotos para cambiar la imagen del plato.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0].uri) {
            subirImagen(result.assets[0].uri);
        }
    };

    const subirImagen = async (uri: string) => {
        setUploadingImage(true);
        try {
            const postUrl = await generateUploadUrl();
            const response = await fetch(uri);
            const blob = await response.blob();

            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": blob.type },
                body: blob,
            });

            const { storageId } = await result.json();

            // Save storageId to product
            await updateProducto({
                id: productId,
                imagen_url: storageId
            });

            // We don't manually setImagenUrl to storageId here because it's not a URL.
            // We wait for the subscription (useEffect) to update it with the resolved URL.
            // But to avoid flicker, maybe we can keep the local uri?
            // Yes, let's set it to the local URI temporarily!
            setImagenUrl(uri);

            Alert.alert('Éxito', 'Imagen actualizada correctamente');

        } catch (error: any) {
            console.error('Error subiendo imagen:', error);
            Alert.alert('Error', 'No se pudo subir la imagen: ' + error.message);
        } finally {
            setUploadingImage(false);
        }
    };

    return {
        loading: producto === undefined,
        saving,
        lastSaved,
        isDirty,
        deleting,
        uploadingImage,
        nombre,
        descripcion,
        precio,
        categoria,
        disponible,
        imagenUrl,
        setNombre,
        setDescripcion,
        setPrecio,
        setCategoria,
        setDisponible,
        handleGuardar,
        handleEliminar,
        handleSeleccionarImagen,
        handleEliminarImagen,
    };
}
