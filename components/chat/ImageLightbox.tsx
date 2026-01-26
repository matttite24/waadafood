import React, { useState, useEffect, useRef } from 'react';
import {
    Modal,
    StyleSheet,
    View,
    Image,
    Dimensions,
    Platform,
    StatusBar,
    Alert,
    ActivityIndicator,
    Animated,
    PanResponder,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { X, DownloadSimple as Download } from 'phosphor-react-native';
import { BlurView } from 'expo-blur';
import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageLightboxProps {
    isVisible: boolean;
    imageUrl: string;
    onClose: () => void;
}

const ImageLightbox = ({ isVisible, imageUrl, onClose }: ImageLightboxProps) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(true);

    // Standard Animated values for 100% stability
    const scale = useRef(new Animated.Value(1)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    // Trackers for gesture math
    const lastScale = useRef(1);
    const lastTranslateX = useRef(0);
    const lastTranslateY = useRef(0);
    const initialDistance = useRef(0);

    useEffect(() => {
        if (isVisible) {
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();

            // Reset state
            scale.setValue(1);
            translateX.setValue(0);
            translateY.setValue(0);
            lastScale.current = 1;
            lastTranslateX.current = 0;
            lastTranslateY.current = 0;
            setIsImageLoading(true);
        }
    }, [isVisible]);

    const handleDownload = async () => {
        if (Platform.OS === 'web') {
            try {
                const link = document.createElement('a');
                link.href = imageUrl;
                link.target = '_blank';
                link.download = `chat-image-${Date.now()}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (error) {
                console.error('Web download error:', error);
                Alert.alert('Error', 'No se pudo descargar la imagen en el navegador.');
            }
            return;
        }

        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado 🚫', 'Necesitamos permiso para guardar fotos en tu galería.');
                return;
            }

            setIsDownloading(true);
            const fileName = `chatbox-${Date.now()}.jpg`;
            const targetFile = new File(Paths.cache, fileName);
            const downloadedFile = await File.downloadFileAsync(imageUrl, targetFile);

            if (downloadedFile && downloadedFile.uri) {
                await MediaLibrary.saveToLibraryAsync(downloadedFile.uri);
                Alert.alert('¡Guardado! ✨', 'La imagen se ha guardado en tu galería con éxito.');
            }
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Error de descarga', 'No pudimos guardar la imagen.');
        } finally {
            setIsDownloading(false);
        }
    };

    const getDistance = (touches: any[]) => {
        const [t1, t2] = touches;
        return Math.sqrt(
            Math.pow(t2.pageX - t1.pageX, 2) + Math.pow(t2.pageY - t1.pageY, 2)
        );
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (event) => {
                const touches = event.nativeEvent.touches;
                if (touches.length >= 2) {
                    initialDistance.current = getDistance(touches);
                }
            },
            onPanResponderMove: (event, gestureState) => {
                const touches = event.nativeEvent.touches;

                if (touches.length >= 2) {
                    // PINCH ZOOM
                    const currentDistance = getDistance(touches);
                    const newScale = (currentDistance / initialDistance.current) * lastScale.current;
                    const clampedScale = Math.min(Math.max(newScale, 1), 4);
                    scale.setValue(clampedScale);
                } else if (touches.length === 1) {
                    // PANNING
                    if (lastScale.current > 1.05) {
                        // Move image when zoomed
                        translateX.setValue(lastTranslateX.current + gestureState.dx);
                        translateY.setValue(lastTranslateY.current + gestureState.dy);
                    } else {
                        // Drag down to close
                        translateY.setValue(gestureState.dy);
                        const dragProgress = Math.abs(gestureState.dy) / (SCREEN_HEIGHT / 2);
                        opacity.setValue(1 - dragProgress);
                    }
                }
            },
            onPanResponderRelease: (event, gestureState) => {
                // Determine current state
                const currentScale = (scale as any)._value; // Access internal value for sync check
                const currentTranslateY = (translateY as any)._value;

                if (currentScale <= 1.1) {
                    // CLOSE OR RESET
                    if (Math.abs(gestureState.dy) > 150) {
                        Animated.timing(opacity, {
                            toValue: 0,
                            duration: 200,
                            useNativeDriver: true,
                        }).start(() => onClose());
                    } else {
                        Animated.parallel([
                            Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
                            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
                            Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
                            Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
                        ]).start();
                        lastScale.current = 1;
                        lastTranslateX.current = 0;
                        lastTranslateY.current = 0;
                    }
                } else {
                    // KEEP ZOOMED STATE + BOUNDS
                    lastScale.current = currentScale;

                    // Simple bounds checking
                    const imageWidth = SCREEN_WIDTH * currentScale;
                    const imageHeight = SCREEN_HEIGHT * currentScale;
                    const maxTranslateX = (imageWidth - SCREEN_WIDTH) / 2;
                    const maxTranslateY = (imageHeight - SCREEN_HEIGHT) / 2;

                    let targetX = lastTranslateX.current + gestureState.dx;
                    let targetY = lastTranslateY.current + gestureState.dy;

                    if (targetX > maxTranslateX) targetX = maxTranslateX;
                    else if (targetX < -maxTranslateX) targetX = -maxTranslateX;

                    if (targetY > maxTranslateY) targetY = maxTranslateY;
                    else if (targetY < -maxTranslateY) targetY = -maxTranslateY;

                    Animated.parallel([
                        Animated.spring(translateX, { toValue: targetX, useNativeDriver: true }),
                        Animated.spring(translateY, { toValue: targetY, useNativeDriver: true }),
                    ]).start();

                    lastTranslateX.current = targetX;
                    lastTranslateY.current = targetY;
                }
            }
        })
    ).current;

    const animatedStyle = {
        transform: [
            { translateX: translateX },
            { translateY: translateY },
            { scale: scale },
        ],
    };

    if (!isVisible) return null;

    return (
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.root}>
                <StatusBar barStyle="light-content" />

                <Animated.View style={[styles.backdrop, { opacity }]}>
                    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                </Animated.View>

                <View style={styles.container}>
                    <Animated.View style={[styles.header, { opacity }]}>
                        <IconButton
                            icon={() => <X color="#FFF" size={24} />}
                            onPress={onClose}
                            style={styles.closeButton}
                        />
                        <View style={styles.headerActions}>
                            <IconButton
                                icon={() => isDownloading ? (
                                    <ActivityIndicator size={20} color="#FFF" />
                                ) : (
                                    <Download color="#FFF" size={24} />
                                )}
                                onPress={handleDownload}
                                disabled={isDownloading}
                                style={styles.actionButton}
                            />
                        </View>
                    </Animated.View>

                    <Animated.View
                        {...panResponder.panHandlers}
                        style={[styles.imageContainer, animatedStyle]}
                    >
                        {isImageLoading && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#FFF" />
                            </View>
                        )}
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.fullImage}
                            resizeMode="contain"
                            onLoad={() => setIsImageLoading(false)}
                        />
                    </Animated.View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.9)',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        zIndex: 10,
    },
    headerActions: {
        flexDirection: 'row',
    },
    closeButton: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
    },
    actionButton: {
        backgroundColor: 'rgba(0,117,74,0.6)',
        borderRadius: 20,
    },
    imageContainer: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        position: 'absolute',
        zIndex: 1,
    },
    fullImage: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.8,
    },
});

export default ImageLightbox;
