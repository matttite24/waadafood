import { useEffect, useRef, useCallback } from 'react';
import { Platform, Vibration } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useToast } from './useToast';

interface UseNotificationsProps {
    comercioId?: Id<"comercios">;
    enableVibration?: boolean;
    enableToasts?: boolean;
}

interface NotificationSummary {
    chatsUrgentes: number;
    pedidosPendientes: number;
    chatsManualesSinResponder: number;
    totalNotificaciones: number;
    ultimoChatUrgente: {
        clienteNombre: string;
        motivo: string;
        clienteId: string;
    } | null;
    ultimoPedidoPendiente: {
        clienteNombre: string;
        total: number;
        pedidoId: string;
    } | null;
    ultimoChatManual: {
        clienteNombre: string;
        ultimoMensaje: string;
        clienteId: string;
    } | null;
}

/**
 * Hook personalizado para manejar notificaciones in-app
 * - Obtiene contadores en tiempo real desde Convex
 * - Vibra cuando hay nuevas notificaciones
 * - Muestra toasts para eventos importantes
 * - Retorna contadores para mostrar badges
 */
export function useNotifications({
    comercioId,
    enableVibration = true,
    enableToasts = true
}: UseNotificationsProps) {
    const previousCountsRef = useRef({ chats: 0, pedidos: 0, manuales: 0 });
    const isInitialLoadRef = useRef(true);
    const router = useRouter();
    const { showPedidoToast, showEscalacionToast, showMensajeToast } = useToast();

    // Obtener resumen de notificaciones en tiempo real
    const summary = useQuery(
        api.notifications.getSummary,
        comercioId ? { comercio_id: comercioId } : "skip"
    ) as NotificationSummary | undefined;

    // Detectar nuevas notificaciones y mostrar toasts
    useEffect(() => {
        if (!summary) return;

        const currentChats = summary.chatsUrgentes;
        const currentPedidos = summary.pedidosPendientes;
        const currentManuales = summary.chatsManualesSinResponder;
        const previousChats = previousCountsRef.current.chats;
        const previousPedidos = previousCountsRef.current.pedidos;
        const previousManuales = previousCountsRef.current.manuales;

        // Saltar la primera carga para evitar toasts al iniciar la app
        if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false;
            previousCountsRef.current = {
                chats: currentChats,
                pedidos: currentPedidos,
                manuales: currentManuales,
            };
            return;
        }

        // 1. Nuevo chat urgente (escalación)
        if (currentChats > previousChats && enableToasts && summary.ultimoChatUrgente) {
            console.log('🔔 Toast: Nuevo chat urgente detectado');
            showEscalacionToast(
                summary.ultimoChatUrgente.clienteNombre,
                summary.ultimoChatUrgente.motivo,
                () => router.push({
                    pathname: '/mensajes',
                    params: { clienteId: summary.ultimoChatUrgente!.clienteId }
                })
            );
        }

        // 2. Nuevo pedido pendiente
        if (currentPedidos > previousPedidos && enableToasts && summary.ultimoPedidoPendiente) {
            console.log('🔔 Toast: Nuevo pedido detectado');
            showPedidoToast(
                summary.ultimoPedidoPendiente.clienteNombre,
                summary.ultimoPedidoPendiente.total,
                () => router.push('/pedidos')
            );
        }

        // 3. Nuevo mensaje en chat manual (cliente respondió)
        if (currentManuales > previousManuales && enableToasts && summary.ultimoChatManual) {
            console.log('🔔 Toast: Nuevo mensaje en chat manual');
            showMensajeToast(
                summary.ultimoChatManual.clienteNombre,
                summary.ultimoChatManual.ultimoMensaje,
                () => router.push({
                    pathname: '/mensajes',
                    params: { clienteId: summary.ultimoChatManual!.clienteId }
                })
            );
        }

        // Vibrar si hay nuevas notificaciones
        if ((currentChats > previousChats || currentPedidos > previousPedidos || currentManuales > previousManuales) &&
            enableVibration) {
            triggerNotificationFeedback();
        }

        // Actualizar referencias
        previousCountsRef.current = {
            chats: currentChats,
            pedidos: currentPedidos,
            manuales: currentManuales,
        };
    }, [summary]);

    // Función para dar feedback de notificación
    const triggerNotificationFeedback = () => {
        try {
            // Vibración corta en móviles
            if (Platform.OS !== 'web') {
                Vibration.vibrate([0, 100, 50, 100]); // Patrón: espera, vibra, espera, vibra
            }
        } catch (error) {
            console.log('Error al vibrar:', error);
        }
    };

    return {
        chatsUrgentes: summary?.chatsUrgentes ?? 0,
        pedidosPendientes: summary?.pedidosPendientes ?? 0,
        chatsManualesSinResponder: summary?.chatsManualesSinResponder ?? 0,
        totalNotificaciones: summary?.totalNotificaciones ?? 0,
        isLoading: summary === undefined,
    };
}
