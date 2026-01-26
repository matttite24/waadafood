import { create } from 'zustand';
import { ToastType } from '@/components/NotificationToast';

interface ToastData {
    id: string;
    type: ToastType;
    title: string;
    message: string;
    onPress?: () => void;
    duration?: number;
}

interface ToastStore {
    toasts: ToastData[];
    showToast: (toast: Omit<ToastData, 'id'>) => void;
    dismissToast: (id: string) => void;
}

const MAX_TOASTS = 3;

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    showToast: (toast) => {
        const id = Math.random().toString(36).substring(7);
        set((state) => {
            // Limitar a MAX_TOASTS, eliminar el más antiguo si es necesario
            const newToasts = [...state.toasts, { ...toast, id }];
            if (newToasts.length > MAX_TOASTS) {
                newToasts.shift(); // Eliminar el primero (más antiguo)
            }
            return { toasts: newToasts };
        });
    },
    dismissToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        }));
    },
}));

// Hook conveniente para mostrar toasts
export function useToast() {
    const { showToast } = useToastStore();

    return {
        showPedidoToast: (clienteNombre: string, total: number, onPress?: () => void) => {
            showToast({
                type: 'pedido',
                title: '🛒 Nuevo Pedido',
                message: `${clienteNombre} - $${total.toLocaleString('es-CO')}`,
                onPress,
                duration: 5000,
            });
        },
        showEscalacionToast: (clienteNombre: string, motivo: string, onPress?: () => void) => {
            showToast({
                type: 'escalacion',
                title: '⚠️ Atención Requerida',
                message: `${clienteNombre}: ${motivo}`,
                onPress,
                duration: 6000,
            });
        },
        showMensajeToast: (clienteNombre: string, mensaje: string, onPress?: () => void) => {
            showToast({
                type: 'mensaje',
                title: '💬 Nuevo Mensaje',
                message: `${clienteNombre}: ${mensaje}`,
                onPress,
                duration: 4000,
            });
        },
        showSuccessToast: (message: string) => {
            showToast({
                type: 'success',
                title: '✓ Éxito',
                message,
                duration: 3000,
            });
        },
        showErrorToast: (message: string) => {
            showToast({
                type: 'error',
                title: '✗ Error',
                message,
                duration: 4000,
            });
        },
        showCustomToast: (toast: Omit<ToastData, 'id'>) => {
            showToast(toast);
        },
    };
}
