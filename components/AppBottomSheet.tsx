import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Platform,
} from 'react-native';
import { Portal, Modal, Text, IconButton, useTheme } from 'react-native-paper';
import {
    BottomSheetModal,
    BottomSheetView,
    BottomSheetBackdrop,
    BottomSheetScrollView,
} from '@gorhom/bottom-sheet';

interface AppBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    snapPoints?: string[]; // Opcional: personalizar alturas del modal, ej: ['50%', '90%']
    index?: number; // Nueva prop: el punto de apertura inicial
    enableContentPanningGesture?: boolean; // Nueva prop para habilitar/deshabilitar gestos
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AppBottomSheet({
    visible,
    onClose,
    title,
    children,
    snapPoints: customSnapPoints,
    index = 1, // Por defecto se abre en el segundo snap point (ej: 93%)
    enableContentPanningGesture = true // Por defecto habilitado
}: AppBottomSheetProps) {
    const theme = useTheme();
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);

    // variables
    const snapPoints = useMemo(() => customSnapPoints || ['60%', '93%'], [customSnapPoints]);

    // callbacks
    const handleSheetChanges = useCallback((index: number) => {
        if (index === -1) {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (visible) {
            bottomSheetModalRef.current?.present();
        } else {
            bottomSheetModalRef.current?.dismiss();
        }
    }, [visible]);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                opacity={0.5}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                pressBehavior="close"
            />
        ),
        []
    );

    const isDesktop = SCREEN_WIDTH >= 1024 && Platform.OS === 'web';

    if (isDesktop) {
        return (
            <Portal>
                <Modal
                    visible={visible}
                    onDismiss={onClose}
                    contentContainerStyle={[
                        styles.desktopModalContent,
                        { backgroundColor: theme.colors.surface }
                    ]}
                >
                    <View style={styles.header}>
                        {title && (
                            <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onSurface }]}>
                                {title}
                            </Text>
                        )}
                    </View>
                    <BottomSheetScrollView showsVerticalScrollIndicator={false}>
                        {children}
                    </BottomSheetScrollView>
                </Modal>
            </Portal>
        );
    }

    return (
        <BottomSheetModal
            ref={bottomSheetModalRef}
            index={index}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}
            backdropComponent={renderBackdrop}
            backgroundStyle={{
                backgroundColor: theme.colors.surface,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
            }}
            handleIndicatorStyle={{ backgroundColor: theme.colors.outline, opacity: 0.3 }}
            enablePanDownToClose={true}
            enableContentPanningGesture={enableContentPanningGesture}
            enableDynamicSizing={false}
            keyboardBehavior="fillParent"
            keyboardBlurBehavior="restore"
        >
            <View style={styles.header}>
                {title && (
                    <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
                        {title}
                    </Text>
                )}
            </View>

            <BottomSheetScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {children}
            </BottomSheetScrollView>
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    desktopModalContent: {
        width: 640,
        maxHeight: '85%',
        alignSelf: 'center',
        borderRadius: 24,
        padding: 24,
        overflow: 'hidden',
    },
    sheetContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingTop: 0,
        paddingBottom: 10,
    },
    title: {
        fontFamily: 'BricolageGrotesque_800ExtraBold',
        letterSpacing: -0.5,
    },
    closeBtn: {
        margin: 0,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 320, // Aumentado drásticamente para permitir overscroll con teclado
    },
    scrollView: {
        flex: 1,
    }
});
