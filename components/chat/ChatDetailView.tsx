import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Avatar, Text, Switch, Surface, Button } from 'react-native-paper';
import { ChatCircleDots, Phone, DotsThreeVertical, Sparkle, WarningCircle, CheckCircle } from 'phosphor-react-native';
import { Platform, FlatList, View, StyleSheet, Animated, Alert, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChatBubble from '@/components/chat/ChatBubble';
import ChatInput from '@/components/chat/ChatInput';
import ChatBackground from '@/components/chat/ChatBackground';
import GlassmorphicHeader from '@/components/GlassmorphicHeader';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import AppBottomSheet from '@/components/AppBottomSheet';
import { Lightning } from 'phosphor-react-native';

import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    imagenes?: string[];
    isIA?: boolean;
}

export default function ChatDetailView() {
    const router = useRouter();
    const { clienteId } = useLocalSearchParams<{ clienteId?: string }>();
    const [inputText, setInputText] = useState('');
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const flatListRef = useRef<FlatList>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const keyboardHeight = useKeyboardHeight();
    const [isTemplatesSheetVisible, setIsTemplatesSheetVisible] = useState(false);

    const castClienteId = clienteId as Id<"clientes"> | undefined;

    // Convex Hooks
    const cliente = useQuery(api.clientes.getById, castClienteId ? { id: castClienteId } : "skip");
    const mensajesConvex = useQuery(api.mensajes.list, castClienteId ? { cliente_id: castClienteId } : "skip");
    const updateCliente = useMutation(api.clientes.update);
    const marcarComoLeido = useMutation(api.clientes.marcarComoLeido);
    const sendMessageMutation = useMutation(api.mensajes.send);
    const getAiAnswer = useAction(api.chat.answer);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const plantillas = useQuery(api.plantillas.list, cliente?.comercio_id ? { comercio_id: cliente.comercio_id } : "skip");

    const isLoading = cliente === undefined || mensajesConvex === undefined;

    const messages: Message[] = useMemo(() => {
        if (!mensajesConvex) return [];
        // Reversar mensajes para el FlatList invertido (el primer elemento es el más reciente)
        return [...mensajesConvex].reverse().map(msg => ({
            id: msg._id,
            role: (msg.es_ia || msg.es_dueno) ? 'assistant' : 'user',
            content: msg.contenido,
            timestamp: new Date(msg._creationTime),
            imagenes: msg.imagenes || [],
            isIA: msg.es_ia
        }));
    }, [mensajesConvex]);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();

        // Marcar como leído al entrar
        if (castClienteId) {
            marcarComoLeido({ id: castClienteId });
        }
    }, [castClienteId]);

    // Marcar como leído cuando llegan mensajes nuevos si estamos en la vista
    useEffect(() => {
        if (castClienteId && messages.length > 0) {
            // Solo si el último mensaje no es del dueño (es IA o cliente)
            const lastMsg = mensajesConvex?.[mensajesConvex.length - 1];
            if (lastMsg && !lastMsg.es_dueno) {
                marcarComoLeido({ id: castClienteId });
            }
        }
    }, [mensajesConvex?.length, castClienteId]);

    const toggleAI = async () => {
        if (!castClienteId || !cliente) return;
        const nuevoEstado = !cliente.asistente_activo;
        try {
            await updateCliente({
                id: castClienteId,
                updates: { asistente_activo: nuevoEstado }
            });
        } catch (error: any) {
            console.error('[toggleAI] Error:', error);
            Alert.alert('Error', 'No se pudo cambiar el estado de la IA');
        }
    };

    const resolverAtencion = async () => {
        if (!castClienteId) return;
        try {
            await updateCliente({
                id: castClienteId,
                updates: { requiere_atencion_humana: false }
            });
        } catch (error: any) {
            console.error('[resolverAtencion] Error:', error);
            Alert.alert('Error', 'No se pudo marcar como atendido');
        }
    };

    const handleSelectImages = async () => {
        try {
            // Solicitar permisos
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu galería para adjuntar imágenes.');
                return;
            }

            // Abrir selector de imágenes
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                quality: 0.8,
                selectionLimit: 5,
            });

            if (!result.canceled && result.assets) {
                const newImages = result.assets.map(asset => asset.uri);
                setSelectedImages(prev => [...prev, ...newImages].slice(0, 5)); // Máximo 5 imágenes
            }
        } catch (error) {
            console.error('[handleSelectImages] Error:', error);
            Alert.alert('Error', 'No se pudieron seleccionar las imágenes');
        }
    };

    const uploadImages = async (imageUris: string[]): Promise<string[]> => {
        const uploadedIds: string[] = [];

        for (const uri of imageUris) {
            try {
                // Obtener URL de subida desde Convex
                const uploadUrl = await generateUploadUrl();

                // Leer archivo como blob
                const response = await fetch(uri);
                const blob = await response.blob();

                // Subir a Convex Storage
                const result = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': blob.type },
                    body: blob,
                });

                if (result.ok) {
                    const { storageId } = await result.json();
                    uploadedIds.push(storageId);
                } else {
                    console.error('[uploadImages] Error uploading image:', await result.text());
                }
            } catch (error) {
                console.error('[uploadImages] Error:', error);
            }
        }

        return uploadedIds;
    };

    const handleSelectTemplate = (contenido: string) => {
        setInputText(prev => prev + (prev.length > 0 && !prev.endsWith(' ') ? ' ' : '') + contenido);
        setIsTemplatesSheetVisible(false);
    };

    const sendMessage = async () => {
        if ((!inputText.trim() && selectedImages.length === 0) || !castClienteId || !cliente) return;

        const messageContent = inputText.trim();
        const imagesToUpload = [...selectedImages];
        setInputText('');
        setSelectedImages([]);

        try {
            // Subir imágenes si hay alguna
            let imageIds: string[] = [];
            if (imagesToUpload.length > 0) {
                imageIds = await uploadImages(imagesToUpload);
            }
            // Al intervenir manualmente:
            // 1. Apagar el asistente si está activo
            // 2. Limpiar la bandera de atención humana requerida
            if (cliente.asistente_activo || cliente.requiere_atencion_humana) {
                await updateCliente({
                    id: castClienteId,
                    updates: {
                        asistente_activo: false,
                        requiere_atencion_humana: false
                    }
                });
            }

            // Enviar mensaje del dueño
            await sendMessageMutation({
                cliente_id: castClienteId,
                comercio_id: cliente.comercio_id,
                contenido: messageContent || '',
                es_ia: false,
                es_dueno: true,
                imagenes: imageIds.length > 0 ? imageIds : undefined,
            });

            // Nota: Aquí podrías llamar opcionalmente a getAiAnswer 
            // si quisieras que la IA responda incluso después de una intervención manual,
            // pero la lógica previa apagaba la IA.
        } catch (error: any) {
            console.error('Error sending message:', error);
            Alert.alert('Error', 'No se pudo enviar el mensaje');
            setInputText(messageContent);
            setSelectedImages(imagesToUpload);
        }
    };

    // Estado vacío mejorado
    if (!clienteId) {
        return (
            <View style={styles.emptyStateContainer}>
                <GlassmorphicHeader
                    title="Mensajes"
                    icon={ChatCircleDots}
                    onBack={() => router.push('/mensajes')}
                />
                <ChatBackground />
                <Animated.View style={[styles.emptyContent, { opacity: fadeAnim }]}>
                    <View style={styles.emptyIconContainer}>
                        <ChatCircleDots size={48} color="#00754A" />
                    </View>
                    <Text style={styles.emptyTitle}>Selecciona un chat</Text>
                    <Text style={styles.emptySubtitle}>
                        Elige una conversación para ver el historial y responder a tu cliente.
                    </Text>
                </Animated.View>
            </View>
        );
    }

    const insets = useSafeAreaInsets();

    return (
        <View style={styles.mainContainer}>
            <GlassmorphicHeader
                title={
                    cliente?.nombre_usuario === 'Cliente Sin Nombre' || !cliente?.nombre_usuario
                        ? (cliente?.telefono || '...')
                        : cliente.nombre_usuario
                }
                subtitle={cliente?.telefono}
                avatarLabel={cliente?.nombre_usuario ? cliente.nombre_usuario[0].toUpperCase() : '?'}
                icon={Phone}
                onBack={() => router.back()}
                onClientePress={() => castClienteId && router.push(`/cliente/${castClienteId}`)}
                actionButton={
                    <View style={styles.aiToggleContainer}>
                        <Sparkle
                            size={18}
                            color={cliente?.asistente_activo ? '#00754A' : '#EF4444'}
                            style={{ marginRight: 4 }}
                            weight={cliente?.asistente_activo ? 'fill' : 'regular'}
                        />
                        <Text style={[
                            styles.aiToggleLabel,
                            { color: cliente?.asistente_activo ? '#00754A' : '#EF4444' }
                        ]}>iA</Text>
                        <View style={Platform.OS === 'ios' ? { height: 36, justifyContent: 'center', marginLeft: -4 } : { marginLeft: 4 }}>
                            <Switch
                                value={cliente?.asistente_activo || false}
                                onValueChange={toggleAI}
                                color="#00754A"
                                style={Platform.OS === 'ios' ? { transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] } : {}}
                            />
                        </View>
                    </View>
                }
            />

            <View style={[styles.contentWrapper, { paddingBottom: keyboardHeight > 0 ? keyboardHeight : 0 }]}>
                <ChatBackground />

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    inverted
                    renderItem={({ item }) => (
                        <ChatBubble
                            role={item.role}
                            content={item.content}
                            timestamp={item.timestamp}
                            imagenes={item.imagenes}
                            isIA={item.isIA}
                        />
                    )}
                    keyExtractor={(item) => item.id}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    contentContainerStyle={styles.chatContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={() => (
                        isLoading && messages.length === 0 ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color="#00754A" />
                            </View>
                        ) : messages.length === 0 ? (
                            <View style={styles.noMessagesContainer}>
                                <Text style={styles.noMessagesText}>Sin mensajes aún con este cliente</Text>
                            </View>
                        ) : null
                    )}
                />
                <ChatInput
                    value={inputText}
                    onChangeText={setInputText}
                    onSend={sendMessage}
                    isLoading={isLoading}
                    keyboardVisible={keyboardHeight > 0}
                    comercioId={cliente?.comercio_id}
                    selectedImages={selectedImages}
                    onImagesChange={setSelectedImages}
                    onAttachImage={handleSelectImages}
                    onOpenTemplates={() => setIsTemplatesSheetVisible(true)}
                />

                <AppBottomSheet
                    visible={isTemplatesSheetVisible}
                    onClose={() => setIsTemplatesSheetVisible(false)}
                    title="Respuestas Rápidas"
                    snapPoints={['50%', '80%']}
                >
                    <View style={{ gap: 12 }}>
                        {plantillas && plantillas.length > 0 ? (
                            plantillas.map((item) => (
                                <TouchableOpacity
                                    key={item._id}
                                    style={sheetStyles.templateItem}
                                    onPress={() => handleSelectTemplate(item.contenido)}
                                >
                                    <View style={sheetStyles.templateIcon}>
                                        <Lightning size={16} color="#00754A" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={sheetStyles.templateName}>/{item.nombre}</Text>
                                        <Text numberOfLines={2} style={sheetStyles.templateContent}>{item.contenido}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: '#64748B' }}>No tienes plantillas creadas</Text>
                            </View>
                        )}
                    </View>
                </AppBottomSheet>
            </View>
        </View>
    );
}

const sheetStyles = StyleSheet.create({
    templateItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    templateIcon: {
        backgroundColor: '#E8F5E9',
        padding: 8,
        borderRadius: 10,
    },
    templateName: {
        fontWeight: '700',
        color: '#1E3932',
        fontSize: 16,
    },
    templateContent: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
});

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    contentWrapper: {
        flex: 1,
        backgroundColor: '#F2F0EB',
    },
    chatArea: {
        flex: 1,
    },
    loadingContainer: {
        marginTop: 30,
        alignItems: 'center',
    },
    chatContent: {
        paddingTop: 12, // Espacio pequeño cerca del input (ahora es el inicio visualmente)
        paddingHorizontal: 12,
        paddingBottom: 110, // Espacio grande para el header (ahora es el final visualmente)
    },
    emptyStateContainer: {
        flex: 1,
        backgroundColor: '#F2F0EB',
    },
    emptyContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyContentWrapper: {
        gap: 24,
        alignItems: 'center',
        maxWidth: 300,
    },
    emptyTextContainer: {
        gap: 10,
        alignItems: 'center',
    },
    messagesList: {
        gap: 4,
    },
    aiToggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 36,
    },
    aiToggleLabel: {
        fontSize: 13,
        fontWeight: '700',
        marginRight: 0,
    },
    noMessagesContainer: {
        marginTop: 60,
        alignItems: 'center',
    },
    noMessagesText: {
        color: '#94A3B8',
        fontSize: 14,
        fontStyle: 'italic',
    },
    emptyIconContainer: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    emptyTitle: {
        textAlign: 'center',
        color: '#1E3932',
        fontWeight: '800',
        letterSpacing: -0.5,
        fontSize: 24,
    },
    emptySubtitle: {
        textAlign: 'center',
        color: '#64748b',
        lineHeight: 20,
        fontSize: 15,
        marginTop: 8,
    },
    typingContainer: {
        alignSelf: 'flex-start',
        paddingLeft: 4,
        marginBottom: 12,
    },
    typingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    typingText: {
        fontSize: 12,
        color: '#00754A',
        fontWeight: '600',
        fontStyle: 'italic',
    },

});
