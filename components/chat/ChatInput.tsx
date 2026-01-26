import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Platform, LayoutAnimation, TouchableOpacity, ScrollView, Image } from 'react-native';
import { IconButton, Text, Surface, useTheme } from 'react-native-paper';
import { PaperPlaneRight, Lightning, X, PlusCircle } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { BlurView } from 'expo-blur';

interface ChatInputProps {
    value: string;
    onChangeText: (text: string) => void;
    onSend: () => void;
    placeholder?: string;
    isLoading?: boolean;
    disabled?: boolean;
    keyboardVisible?: boolean;
    comercioId?: Id<"comercios"> | null;
    selectedImages?: string[];
    onImagesChange?: (images: string[]) => void;
    onAttachImage?: () => void;
    onOpenTemplates?: () => void;
}

const ChatInput = ({
    value,
    onChangeText,
    onSend,
    placeholder = "Mensaje",
    isLoading = false,
    disabled = false,
    keyboardVisible = false,
    comercioId,
    selectedImages = [],
    onImagesChange,
    onAttachImage,
    onOpenTemplates
}: ChatInputProps) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const inputRef = useRef<any>(null);
    const isBlocked = isLoading || disabled;
    const canSend = (value.trim().length > 0 || selectedImages.length > 0) && !isBlocked;

    // Quick Replies Logic
    const plantillas = useQuery(api.plantillas.list, comercioId ? { comercio_id: comercioId } : "skip");
    const [matchingTemplates, setMatchingTemplates] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (!plantillas) return;

        const lastWord = value.split(/\s+/).pop();
        if (lastWord && lastWord.startsWith('/')) {
            const query = lastWord.slice(1).toLowerCase();
            const matches = plantillas.filter(p => p.nombre.toLowerCase().startsWith(query));
            setMatchingTemplates(matches);
            setShowSuggestions(matches.length > 0);
        } else {
            setShowSuggestions(false);
        }
    }, [value, plantillas]);

    const handleSelectTemplate = (contenido: string) => {
        // Reemplazar la última palabra (el comando) por el contenido
        const words = value.split(/\s+/);
        words.pop(); // Remove shortcut
        const newValue = words.join(' ') + (words.length > 0 ? ' ' : '') + contenido + ' ';
        onChangeText(newValue);
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    const handleRemoveImage = (index: number) => {
        if (onImagesChange) {
            const newImages = selectedImages.filter((_, i) => i !== index);
            onImagesChange(newImages);
        }
    };

    // Cuando el teclado está visible, usamos padding mínimo; si no, respetamos safe area
    const bottomPadding = keyboardVisible ? 8 : (Platform.OS === 'ios' ? Math.max(insets.bottom, 8) : 8);

    const handleSend = () => {
        onSend();
        // Mantener el foco en el input después de enviar
        setTimeout(() => {
            inputRef.current?.focus();
        }, 50);
    };

    return (
        <View style={[
            styles.inputWrapper,
            { paddingBottom: bottomPadding }
        ]}>
            {/* Quick Replies Suggestions Popover - Mantener por compatibilidad con escritura manual de "/" */}
            {showSuggestions && matchingTemplates.length > 0 && (
                <Surface style={styles.suggestionsContainer} elevation={4}>
                    <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 150 }}>
                        {matchingTemplates.map((item) => (
                            <TouchableOpacity
                                key={item._id}
                                style={styles.suggestionItem}
                                onPress={() => handleSelectTemplate(item.contenido)}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={{ backgroundColor: '#E8F5E9', padding: 4, borderRadius: 6 }}>
                                        <Lightning size={14} color="#00754A" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontWeight: 'bold', color: '#00754A' }}>/{item.nombre}</Text>
                                        <Text numberOfLines={1} style={{ fontSize: 12, color: '#64748B' }}>{item.contenido}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </Surface>
            )}

            {/* Image Preview */}
            {selectedImages.length > 0 && (
                <ScrollView
                    horizontal
                    style={styles.imagePreviewContainer}
                    showsHorizontalScrollIndicator={false}
                >
                    {selectedImages.map((uri, index) => (
                        <View key={index} style={styles.imagePreviewWrapper}>
                            <Image source={{ uri }} style={styles.imagePreview} />
                            <TouchableOpacity
                                style={styles.removeImageButton}
                                onPress={() => handleRemoveImage(index)}
                            >
                                <X size={14} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            )}

            <View style={styles.mainRow}>
                {onAttachImage && (
                    <TouchableOpacity
                        onPress={onAttachImage}
                        disabled={isBlocked || value.trim().length > 0}
                        style={[
                            styles.plusButton,
                            (isBlocked || value.trim().length > 0) && { opacity: 0.3 }
                        ]}
                    >
                        <PlusCircle size={28} color="#00754A" weight="bold" />
                    </TouchableOpacity>
                )}

                <BlurView
                    intensity={80}
                    tint="light"
                    style={styles.inputCapsule}
                >
                    <TextInput
                        ref={inputRef}
                        placeholder={isBlocked ? "Espere..." : placeholder}
                        value={value}
                        onChangeText={onChangeText}
                        style={[styles.textInput, isBlocked && { opacity: 0.6 }]}
                        multiline
                        maxLength={500}
                        placeholderTextColor="#94a3b8"
                        editable={!isBlocked}
                        selectionColor="#00754A"
                        blurOnSubmit={false}
                        underlineColorAndroid="transparent"
                        onContentSizeChange={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        }}
                    />
                </BlurView>

                <View style={styles.rightActionWrapper}>
                    {canSend ? (
                        <TouchableOpacity
                            onPress={handleSend}
                            style={styles.roundSendButton}
                        >
                            <PaperPlaneRight size={22} color="#FFFFFF" weight="fill" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={onOpenTemplates}
                            disabled={isBlocked}
                            style={styles.zapButton}
                        >
                            <Lightning size={24} color="#1E3932" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    inputWrapper: {
        width: '100%',
        paddingHorizontal: 12,
        paddingTop: 8,
        backgroundColor: 'rgba(242, 240, 235, 0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    mainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingBottom: 4,
    },
    inputCapsule: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 2,
        minHeight: 44,
        maxHeight: 160,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#1E3932',
        paddingTop: Platform.OS === 'ios' ? 10 : 8,
        paddingBottom: Platform.OS === 'ios' ? 10 : 8,
        lineHeight: 20,
        maxHeight: 140,
        textAlignVertical: 'center',
    },
    plusButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rightActionWrapper: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    roundSendButton: {
        backgroundColor: '#00754A',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#00754A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    zapButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    suggestionsContainer: {
        position: 'absolute',
        bottom: '100%',
        left: 20,
        right: 20,
        marginBottom: 8,
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    suggestionItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    imagePreviewContainer: {
        marginBottom: 8,
        maxHeight: 80,
    },
    imagePreviewWrapper: {
        position: 'relative',
        marginRight: 8,
    },
    imagePreview: {
        width: 70,
        height: 70,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
    },
    removeImageButton: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#EF4444',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
});

export default ChatInput;
