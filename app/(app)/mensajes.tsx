import React from 'react';
import { View, useWindowDimensions, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import ChatList from '@/components/chat/ChatList';
import ChatDetailView from '@/components/chat/ChatDetailView';

export default function ChatScreen() {
    const { width } = useWindowDimensions();
    const { clienteId } = useLocalSearchParams<{ clienteId?: string }>();
    const isDesktop = width >= 1024 && Platform.OS === 'web';

    // En desktop, mostrar solo el ChatDetailView (ChatList se muestra en el panel izquierdo del layout)
    if (isDesktop) {
        return <ChatDetailView />;
    }

    // En móvil, si hay un cliente seleccionado, mostrar el detalle
    if (clienteId) {
        return <ChatDetailView />;
    }

    // En móvil, si no hay cliente seleccionado, mostrar la lista de chats
    return <ChatList />;
}
