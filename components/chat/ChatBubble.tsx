import React, { useState } from 'react';
import { View, StyleSheet, Image, Platform, TouchableOpacity, Linking, Alert } from 'react-native';
import { Text, Surface, Avatar, useTheme } from 'react-native-paper';
import { Robot as Bot, DotsThreeVertical as MoreVertical } from 'phosphor-react-native';
import ImageLightbox from './ImageLightbox';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface ChatImageProps {
    url: string;
    index: number;
    onPress: (url: string) => void;
}

const ChatImage = ({ url, index, onPress }: ChatImageProps) => {
    // Determine if it's a storage ID (alphanumeric, no protocol) or a direct URL
    const isStorageId = !url.startsWith('http') && !url.startsWith('data:');

    // If it's a storage ID, fetch the URL. Otherwise skip.
    const resolvedUrl = useQuery(api.files.getUrl, isStorageId ? { storageId: url } : "skip");

    // Use the resolved URL if available, otherwise fallback to the input (if it was already a URL)
    const displayUrl = isStorageId ? resolvedUrl : url;

    if (isStorageId && !displayUrl) {
        return (
            <View style={[styles.imageWrapper, { aspectRatio: 4 / 3, backgroundColor: '#E0E0E0', borderRadius: 12 }]} />
        );
    }

    if (!displayUrl) return null;

    return (
        <TouchableOpacity
            key={index}
            style={styles.imageWrapper}
            onPress={() => onPress(displayUrl)}
            activeOpacity={0.9}
        >
            {Platform.OS === 'web' ? (
                <img
                    src={displayUrl}
                    alt={`Imagen ${index + 1}`}
                    style={{
                        width: '100%',
                        aspectRatio: '4 / 3',
                        objectFit: 'cover',
                        borderRadius: 12,
                        display: 'block',
                        backgroundColor: '#F1F5F9',
                    }}
                    onError={(e) => console.error('[ChatBubble] Error cargando imagen:', displayUrl)}
                />
            ) : (
                <Image
                    source={{ uri: displayUrl }}
                    style={styles.messageImage}
                    resizeMode="cover"
                />
            )}
        </TouchableOpacity>
    );
};

interface ChatBubbleProps {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    imagenes?: string[];
    isIA?: boolean;
    isClientPerspective?: boolean;
}

const ChatBubble = ({ role, content, timestamp, imagenes, isIA, isClientPerspective }: ChatBubbleProps) => {
    const isUser = role === 'user';
    const isAssistant = role === 'assistant';

    // Invert alignment logic if we are in client perspective (Sandbox)
    // From business perspective: Assistant is Right, User is Left
    // From client perspective: Assistant is Left, User is Right
    const alignRight = isClientPerspective ? isUser : isAssistant;
    const theme = useTheme();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const handleOpenURL = async (url: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', 'No se puede abrir este enlace');
            }
        } catch (error) {
            console.error('[ChatBubble] Error abriendo URL:', error);
        }
    };

    const renderContent = () => {
        if (!content) return null;

        // Regex para detectar URLs
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = content.split(urlRegex);

        return parts.map((part, index) => {
            if (part.match(urlRegex)) {
                return (
                    <Text
                        key={index}
                        style={[
                            styles.messageText,
                            isAssistant ? styles.businessText : styles.clientText,
                            styles.linkText,
                            isAssistant ? { color: '#FFFFFF', textDecorationColor: '#FFFFFF' } : { color: '#00754A', textDecorationColor: '#00754A' }
                        ]}
                        onPress={() => handleOpenURL(part)}
                    >
                        {part}
                    </Text>
                );
            }
            return (
                <Text
                    key={index}
                    style={[
                        styles.messageText,
                        isAssistant ? styles.businessText : styles.clientText
                    ]}
                >
                    {part}
                </Text>
            );
        });
    };

    return (
        <View style={[
            styles.messageWrapper,
            { alignSelf: alignRight ? 'flex-end' : 'flex-start' }
        ]}>
            {/* Texto del mensaje */}
            {content && content.trim() !== '' ? (
                <Surface
                    elevation={0}
                    style={[
                        styles.messageBubble,
                        isAssistant ? (isIA ? styles.businessBubble : styles.humanBusinessBubble) : styles.clientBubble
                    ]}
                >
                    <View style={styles.textContainer}>
                        <Text>
                            {renderContent()}
                        </Text>
                        <View style={styles.metaContainer}>
                            {isIA ? (
                                <View style={styles.aiTag}>
                                    <Bot size={10} color="#FFFFFF" style={{ opacity: 0.8 }} />
                                    <Text style={[styles.aiTagText, { color: '#FFFFFF' }]}>iA</Text>
                                </View>
                            ) : null}
                            <Text style={[
                                styles.timestamp,
                                alignRight ? styles.businessTimestamp : styles.clientTimestamp
                            ]}>
                                {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    </View>
                </Surface>
            ) : null}

            {/* Imágenes fuera del Surface */}
            {imagenes && imagenes.length > 0 ? (
                <View style={styles.imagesContainer}>
                    {imagenes.map((url, index) => (
                        <ChatImage
                            key={`${url}-${index}`}
                            url={url}
                            index={index}
                            onPress={(u) => setSelectedImage(u)}
                        />
                    ))}
                </View>
            ) : null}

            {/* Lightbox for images */}
            {selectedImage && (
                <ImageLightbox
                    isVisible={!!selectedImage}
                    imageUrl={selectedImage}
                    onClose={() => setSelectedImage(null)}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    messageWrapper: {
        maxWidth: '85%',
        marginBottom: 4,
    },
    messageBubble: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    businessBubble: {
        backgroundColor: '#00754A',
        borderBottomRightRadius: 4,
    },
    humanBusinessBubble: {
        backgroundColor: '#1E3932', // Un verde más oscuro y sobrio para el humano
        borderBottomRightRadius: 4,
    },
    clientBubble: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    textContainer: {
        flexDirection: 'column',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    linkText: {
        textDecorationLine: 'underline',
    },
    businessText: {
        color: '#FFFFFF',
    },
    clientText: {
        color: '#1E3932',
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 2,
        gap: 6,
    },
    aiTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 117, 74, 0.05)',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 8,
        gap: 2,
    },
    aiTagText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#00754A',
    },
    timestamp: {
        fontSize: 10,
        opacity: 0.5,
    },
    clientTimestamp: {
        color: '#64748B',
    },
    businessTimestamp: {
        color: '#FFFFFF',
    },
    imagesContainer: {
        marginTop: 6,
        borderRadius: 16,
        overflow: 'hidden',
    },
    imageWrapper: {
        width: '100%',
    },
    inlineImageContainer: {
        marginVertical: 8,
        borderRadius: 12,
        overflow: 'hidden',
    },
    messageImage: {
        width: '100%',
        aspectRatio: 4 / 3,
        backgroundColor: '#F1F5F9',
    },
});

export default ChatBubble;
