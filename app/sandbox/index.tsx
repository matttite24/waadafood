import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';

// Helper component for images (copied from ChatBubble logic)
const ChatImage = ({ url, index, onPress }: { url: string, index: number, onPress?: (u: string) => void }) => {
    const isStorageId = !url.startsWith('http') && !url.startsWith('data:');
    const resolvedUrl = useQuery(api.files.getUrl, isStorageId ? { storageId: url } : "skip");
    const displayUrl = isStorageId ? resolvedUrl : url;

    if (isStorageId && !displayUrl) return <View style={{ width: 200, height: 150, backgroundColor: '#E0E0E0', borderRadius: 8, marginTop: 4 }} />;
    if (!displayUrl) return null;

    return (
        <TouchableOpacity
            onPress={() => onPress?.(displayUrl)}
            activeOpacity={0.9}
            style={{ marginTop: 4 }}
        >
            {Platform.OS === 'web' ? (
                <img
                    src={displayUrl}
                    style={{
                        maxWidth: '100%',
                        borderRadius: 8,
                        maxHeight: 200,
                        objectFit: 'cover'
                    }}
                />
            ) : (
                <Image
                    source={{ uri: displayUrl }}
                    style={{ width: 200, height: 150, borderRadius: 8 }}
                    resizeMode="cover"
                />
            )}
        </TouchableOpacity>
    );
};

// Component item to allow hooks
const SandboxMessageItem = ({ item }: { item: any }) => {
    const isMe = !item.es_ia && !item.es_dueno;

    return (
        <View style={[
            styles.messageRow,
            isMe ? styles.messageRowMe : styles.messageRowOther
        ]}>
            <View style={[
                styles.bubble,
                isMe ? styles.bubbleMe : styles.bubbleOther
            ]}>
                {item.contenido ? (
                    <Text style={isMe ? styles.textMe : styles.textOther}>
                        {item.contenido}
                    </Text>
                ) : null}

                {item.imagenes && item.imagenes.length > 0 && (
                    <View style={{ marginTop: 4 }}>
                        {item.imagenes.map((url: string, idx: number) => (
                            <ChatImage
                                key={idx}
                                url={url}
                                index={idx}
                            />
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
};

export default function SandboxScreen() {
    const { userId } = useAuth();
    const { comercioId: queryComercioId } = useLocalSearchParams<{ comercioId: string }>();

    // Priority: 1. URL Param (for public/friend testing), 2. Auth (for merchant testing)
    const effectiveComercioId = queryComercioId ? (queryComercioId as Id<"comercios">) : undefined;

    const commerceByAuth = useQuery(api.comercios.getByUserId, (!effectiveComercioId && userId) ? { userId } : "skip");
    const commerceById = useQuery(api.comercios.get, (effectiveComercioId) ? { id: effectiveComercioId } : "skip");

    const comercio = effectiveComercioId ? commerceById : commerceByAuth;

    // State
    const [step, setStep] = useState<'login' | 'chat'>('login');
    const [telefono, setTelefono] = useState('');
    const [nombre, setNombre] = useState('');
    const [clienteId, setClienteId] = useState<Id<"clientes"> | null>(null);
    const [msgText, setMsgText] = useState('');

    // Convex
    const existingClient = useQuery(api.clientes.getByTelefono,
        (comercio && telefono.length > 5) ? { telefono, commerceId: comercio._id } : "skip"
    );

    const createClient = useMutation(api.clientes.create);
    const sendMessage = useMutation(api.mensajes.send);

    const messages = useQuery(api.mensajes.list, clienteId ? { cliente_id: clienteId } : "skip");

    const handleStart = async () => {
        if (!comercio || !telefono) return;

        try {
            if (existingClient) {
                setClienteId(existingClient._id);
                setStep('chat');
            } else {
                const newId = await createClient({
                    comercio_id: comercio._id,
                    telefono,
                    nombre_usuario: nombre || 'Usuario Test'
                });
                setClienteId(newId);
                setStep('chat');
            }
        } catch (error) {
            console.error("Error starting chat:", error);
        }
    };

    const handleSend = async () => {
        if (!msgText.trim() || !clienteId || !comercio) return;

        try {
            await sendMessage({
                comercio_id: comercio._id,
                cliente_id: clienteId,
                contenido: msgText,
                es_ia: false, // Simulating USER message
                es_dueno: false, // Simulating USER message
                imagenes: []
            });
            setMsgText('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    if (!comercio) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#00754A" />
                <Text style={{ marginTop: 20 }}>Cargando datos del comercio...</Text>
            </View>
        );
    }

    if (step === 'login') {
        return (
            <View style={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.title}>Simulador de Cliente</Text>
                    <Text style={styles.subtitle}>Testea tu agente de IA</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Teléfono (ID único)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="+51 999 999 999"
                            value={telefono}
                            onChangeText={setTelefono}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nombre (Opcional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej. Juan Perez"
                            value={nombre}
                            onChangeText={setNombre}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, !telefono && styles.buttonDisabled]}
                        onPress={handleStart}
                        disabled={!telefono}
                    >
                        <Text style={styles.buttonText}>Iniciar Chat</Text>
                    </TouchableOpacity>

                    {existingClient && (
                        <Text style={styles.hint}>
                            ¡Cliente encontrado! Se retomará la conversación anterior.
                        </Text>
                    )}
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.chatContainer}
        >
            <View style={styles.chatHeader}>
                <TouchableOpacity onPress={() => setStep('login')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.chatHeaderTitle}>{nombre || telefono}</Text>
                    <Text style={styles.chatHeaderSubtitle}>Chat con {comercio.nombre_comercio}</Text>
                </View>
            </View>

            <FlatList
                data={messages}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.messageList}
                renderItem={({ item }) => <SandboxMessageItem item={item} />}
            />

            <View style={styles.inputArea}>
                <TextInput
                    style={styles.messageInput}
                    placeholder="Escribe un mensaje..."
                    value={msgText}
                    onChangeText={setMsgText}
                    onSubmitEditing={handleSend}
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                    <Ionicons name="send" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F0EB',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 30,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        color: '#1E3932'
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
        textAlign: 'center'
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333'
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#F9F9F9'
    },
    button: {
        backgroundColor: '#00754A',
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
    },
    hint: {
        marginTop: 15,
        textAlign: 'center',
        color: '#00754A',
        fontSize: 14,
        fontWeight: '500'
    },
    // Chat Styles
    chatContainer: {
        flex: 1,
        backgroundColor: '#E5DDD5', // WhatsApp-like bg
    },
    chatHeader: {
        height: 60,
        backgroundColor: '#00754A',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 0, // Safe area handled by layout?
    },
    backButton: {
        marginRight: 16
    },
    chatHeaderTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
    },
    chatHeaderSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },
    messageList: {
        padding: 16,
        paddingBottom: 20,
    },
    messageRow: {
        marginBottom: 10,
        flexDirection: 'row',
    },
    messageRowMe: {
        justifyContent: 'flex-end',
    },
    messageRowOther: {
        justifyContent: 'flex-start',
    },
    bubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 12,
    },
    bubbleMe: {
        backgroundColor: '#DCF8C6',
        borderTopRightRadius: 0,
    },
    bubbleOther: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 0,
    },
    textMe: {
        color: '#000',
        fontSize: 15,
    },
    textOther: {
        color: '#000',
        fontSize: 15,
    },
    inputArea: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: 'white',
        alignItems: 'center',
    },
    messageInput: {
        flex: 1,
        height: 40,
        backgroundColor: '#F0F0F0',
        borderRadius: 20,
        paddingHorizontal: 16,
        marginRight: 10,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#00754A',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
