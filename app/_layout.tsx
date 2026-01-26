import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StatusBar, Platform, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { BricolageGrotesque_300Light, BricolageGrotesque_400Regular, BricolageGrotesque_500Medium, BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { useFonts } from 'expo-font';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@/lib/tokenCache';
import '@/global.css';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

// Tema personalizado - "Neutro Premium"
// Balance entre legibilidad clara y acentos elegantes
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,

    // Marca: Verde Starbucks/Emerald balanceado
    primary: '#00754A',
    primaryContainer: '#E6F4EA',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#1E3932',

    secondary: '#1E3932',
    secondaryContainer: '#F2F0EB',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#1E3932',

    // Fondos y Superficies Neutras
    background: '#F8F9FA',        // Gris muy claro para descanso visual
    onBackground: '#1C1C1E',      // Casi negro para máxima legibilidad

    surface: '#FFFFFF',           // Blanco puro para tarjetas
    surfaceVariant: '#F2F2F2',    // Gris suave para contraste sutil
    onSurface: '#1C1C1E',
    onSurfaceVariant: '#6B6B6B',  // Texto secundario legible

    // Bordes y divisores
    outline: '#E0E0E0',
    outlineVariant: '#F0F0F0',

    // Elevaciones para modo claro
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#F8F9FA',
      level3: '#F2F2F2',
      level4: '#E5E5E5',
      level5: '#D1D1D1',
    },
  },
  roundness: 28,
  fonts: {
    ...MD3LightTheme.fonts,
    displaySmall: {
      ...MD3LightTheme.fonts.displaySmall,
      fontFamily: 'BricolageGrotesque_700Bold',
    },
    displayMedium: {
      ...MD3LightTheme.fonts.displayMedium,
      fontFamily: 'BricolageGrotesque_700Bold',
    },
    displayLarge: {
      ...MD3LightTheme.fonts.displayLarge,
      fontFamily: 'BricolageGrotesque_800ExtraBold',
    },
    headlineSmall: {
      ...MD3LightTheme.fonts.headlineSmall,
      fontFamily: 'BricolageGrotesque_700Bold',
    },
    headlineMedium: {
      ...MD3LightTheme.fonts.headlineMedium,
      fontFamily: 'BricolageGrotesque_700Bold',
    },
    headlineLarge: {
      ...MD3LightTheme.fonts.headlineLarge,
      fontFamily: 'BricolageGrotesque_800ExtraBold',
    },
    titleSmall: {
      ...MD3LightTheme.fonts.titleSmall,
      fontFamily: 'BricolageGrotesque_600SemiBold',
    },
    titleMedium: {
      ...MD3LightTheme.fonts.titleMedium,
      fontFamily: 'BricolageGrotesque_700Bold',
    },
    titleLarge: {
      ...MD3LightTheme.fonts.titleLarge,
      fontFamily: 'BricolageGrotesque_800ExtraBold',
    },
    labelSmall: {
      ...MD3LightTheme.fonts.labelSmall,
      fontFamily: 'BricolageGrotesque_500Medium',
    },
    labelMedium: {
      ...MD3LightTheme.fonts.labelMedium,
      fontFamily: 'BricolageGrotesque_500Medium',
    },
    labelLarge: {
      ...MD3LightTheme.fonts.labelLarge,
      fontFamily: 'BricolageGrotesque_600SemiBold',
    },
  },
};

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import ToastContainer from '@/components/ToastContainer';

function InitialLayout() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [isMounted, setIsMounted] = useState(false);

  // Check if user has a comercio
  const comercio = useQuery(
    api.comercios.getByUserId,
    userId ? { userId } : "skip"
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoaded || !isMounted) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inAppGroup = segments[0] === '(app)';
    const inSandbox = segments[0] === 'sandbox';

    // Not signed in - redirect to login
    if (!isSignedIn && !inAuthGroup && !inSandbox) {
      console.log('[InitialLayout] No user, redirecting to login');
      router.replace('/login');
      return;
    }

    // Signed in - check onboarding status
    if (isSignedIn && !inAuthGroup && !inSandbox) {
      // Still loading comercio data
      if (comercio === undefined) {
        return;
      }

      // No comercio - redirect to onboarding
      if (comercio === null && !inOnboardingGroup) {
        router.replace('/welcome');
        return;
      }

      // Has comercio - redirect to app if in auth or onboarding
      if (comercio && (inAuthGroup || inOnboardingGroup)) {
        router.replace('/menu');
        return;
      }
    }

    // Signed in but in auth group - redirect to app or onboarding
    if (isSignedIn && inAuthGroup) {
      if (comercio === undefined) return;

      if (comercio === null) {
        console.log('[InitialLayout] Redirecting to onboarding (from auth)');
        router.replace('/welcome');
      } else {
        console.log('[InitialLayout] Redirecting to app (from auth)');
        router.replace('/menu');
      }
    }
  }, [isSignedIn, isLoaded, segments, isMounted, comercio, userId]);

  if (!isLoaded || !isMounted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
        <ActivityIndicator size="large" color="#00754A" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F0EB' }}>
      <View style={{
        flex: 1,
        width: '100%',
        backgroundColor: '#F2F0EB',
      }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="index" />
          <Stack.Screen name="sandbox" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </View>
      {/* Overlay de carga cuando estamos autenticados pero esperando data del comercio */}
      {isSignedIn && comercio === undefined && (
        <View style={{
          ...StyleSheet.absoluteFillObject,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F8F9FA',
          zIndex: 9999
        }}>
          <ActivityIndicator size="large" color="#00754A" />
        </View>
      )}
    </View>
  );
}

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_300Light,
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
  });

  useFrameworkReady();

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <SafeAreaProvider>
              <PaperProvider theme={theme}>
                <InitialLayout />
                <ToastContainer />
                {Platform.OS === 'web' && (
                  <style dangerouslySetInnerHTML={{
                    __html: `
                      *::-webkit-scrollbar {
                        display: none;
                      }
                      * {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                      }
                    `
                  }} />
                )}
                <StatusBar
                  animated={true}
                  backgroundColor="#1E3932"
                  barStyle="light-content"
                  translucent={false}
                />
              </PaperProvider>
            </SafeAreaProvider>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}


