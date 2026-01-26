import { Stack } from 'expo-router';

export default function OnboardingLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="welcome" />
            <Stack.Screen name="step1-business" />
            <Stack.Screen name="step2-assistant" />
            <Stack.Screen name="step3-product" />
            <Stack.Screen name="complete" />
        </Stack>
    );
}
