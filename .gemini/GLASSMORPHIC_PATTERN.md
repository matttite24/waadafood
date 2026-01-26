# Patrón Glassmorphic para Headers

## Pasos para aplicar:

1. **Agregar import de BlurView**
```tsx
import { BlurView } from 'expo-blur';
```

2. **Cambiar fondo del View principal**
```tsx
<View style={{ flex: 1, backgroundColor: '#F2F0EB' }}>
```

3. **Mover header a position absolute al final (antes del cierre de View)**
```tsx
{/* Header Flotante Glassmorphic */}
<BlurView
    intensity={100}
    tint="light"
    style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 117, 74, 0.15)',
        zIndex: 10,
    }}
>
    {/* Contenido del header aquí */}
</BlurView>
```

4. **Ajustar ScrollView**
```tsx
<ScrollView
    style={{ flex: 1 }}
    contentContainerStyle={{ paddingTop: 120, paddingHorizontal: 24, paddingBottom: 96 }}
    refreshControl={
        <RefreshControl
            refreshing={refreshing}
            onRefresh={...}
            tintColor="#00754A"
            progressViewOffset={120}
        />
    }
>
```

5. **Actualizar colores al tema**
- `#00754A` para primary
- `#1E3932` para texto oscuro
- `rgba(255, 255, 255, 0.8)` para fondos semi-transparentes
