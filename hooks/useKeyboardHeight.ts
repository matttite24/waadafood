import { useState, useEffect } from 'react';
import { Keyboard, Platform, KeyboardEvent } from 'react-native';

/**
 * Hook que devuelve la altura actual del teclado en tiempo real.
 * Escucha los eventos nativos del teclado y actualiza el estado.
 * Retorna 0 cuando el teclado está cerrado.
 */
export function useKeyboardHeight(): number {
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const handleKeyboardShow = (event: KeyboardEvent) => {
            setKeyboardHeight(event.endCoordinates.height);
        };

        const handleKeyboardHide = () => {
            setKeyboardHeight(0);
        };

        const showSubscription = Keyboard.addListener(showEvent, handleKeyboardShow);
        const hideSubscription = Keyboard.addListener(hideEvent, handleKeyboardHide);

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    return keyboardHeight;
}

export default useKeyboardHeight;
