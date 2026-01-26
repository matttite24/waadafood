import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Este archivo fuerza a Metro a entender que el root es Expo Router
export function App() {
    const ctx = require.context('./app');
    return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);