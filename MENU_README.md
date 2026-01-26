# Pantalla de Menú - Instrucciones de Uso

## 📋 Descripción

La pantalla `app/menu.tsx` es una interfaz completa para gestionar el menú de productos de un restaurante usando **Gluestack UI** y **Supabase**.

## ✨ Características

- ✅ **Lista de productos** obtenida desde Supabase
- ✅ **Filtrado por comercio_id** (actualmente usando `test-comercio-001`)
- ✅ **Cards atractivos** con nombre y precio de cada producto
- ✅ **Botón flotante (Fab)** para añadir nuevos platos
- ✅ **Modal (Actionsheet)** con formulario de nombre y precio
- ✅ **Validación de formulario** con mensajes de error
- ✅ **Actualización automática** de la lista tras guardar
- ✅ **Pull-to-refresh** para recargar productos
- ✅ **Estados de carga** con spinners

## 🚀 Configuración Inicial

### 1. Configurar la Base de Datos en Supabase

Ejecuta el script SQL en el **SQL Editor** de Supabase:

```bash
# El archivo está en:
packages/api/setup-productos-table.sql
```

Este script:
- Crea la tabla `productos` con los campos necesarios
- Configura índices para optimizar consultas
- Habilita Row Level Security (RLS)
- Crea políticas de acceso
- Inserta datos de prueba

### 2. Verificar Variables de Entorno

Asegúrate de que el archivo `.env` en la raíz del proyecto contenga:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xrhkrqvwzbwefvtpwgok.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### 3. Ejecutar la Aplicación

```bash
# Desde la raíz del proyecto
npm run dev

# O si estás usando Expo directamente
npx expo start
```

## 📱 Navegación

Para acceder a la pantalla de menú, navega a:

```
/menu
```

En tu aplicación, puedes usar `expo-router` para navegar:

```typescript
import { router } from 'expo-router';

// Navegar a la pantalla de menú
router.push('/menu');
```

## 🎨 Componentes Utilizados

### Gluestack UI Components:
- `Box` - Contenedor principal
- `VStack` / `HStack` - Layouts verticales y horizontales
- `Card` - Tarjetas para mostrar productos
- `Heading` / `Text` - Tipografía
- `Button` - Botones de acción
- `Fab` - Botón flotante
- `Actionsheet` - Modal deslizable
- `Input` / `FormControl` - Formularios
- `Spinner` - Indicadores de carga

### React Native:
- `ScrollView` - Lista scrolleable
- `RefreshControl` - Pull-to-refresh
- `Alert` - Notificaciones

## 🔧 Personalización

### Cambiar el ID de Comercio

En `app/menu.tsx`, línea 33:

```typescript
const COMERCIO_ID_PRUEBA = 'test-comercio-001'; // Cambia esto
```

### Modificar Colores

Los colores usan el sistema de tokens de Gluestack UI:

```typescript
// Ejemplo: cambiar el color primario del header
<Box bg="$primary500" px="$6" pt="$12" pb="$6">
  // Puedes usar: $primary500, $success600, $error500, etc.
</Box>
```

### Agregar Más Campos al Formulario

Puedes extender el formulario agregando más `FormControl` en el `Actionsheet`:

```typescript
<FormControl>
  <FormControlLabel>
    <FormControlLabelText>Descripción</FormControlLabelText>
  </FormControlLabel>
  <Input>
    <InputField
      placeholder="Descripción del plato"
      value={descripcion}
      onChangeText={setDescripcion}
    />
  </Input>
</FormControl>
```

## 📊 Estructura de Datos

### Tipo Producto

```typescript
interface Producto {
  id: string;
  nombre: string;
  precio: number;
  comercio_id: string;
  created_at?: string;
}
```

### Tabla en Supabase

```sql
CREATE TABLE productos (
  id UUID PRIMARY KEY,
  nombre TEXT NOT NULL,
  precio DECIMAL(10, 2) NOT NULL,
  comercio_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

## 🐛 Solución de Problemas

### Error: "No se pudieron cargar los productos"

1. Verifica que la tabla `productos` exista en Supabase
2. Confirma que las variables de entorno estén correctas
3. Las imágenes ahora se gestionan mediante Convex Storage.
 el `comercio_id` sea válido
3. Revisa la consola para más detalles del error

### La lista no se actualiza

1. Asegúrate de que `cargarProductos()` se llame después de guardar
2. Verifica que no haya errores en la consola
3. Intenta hacer pull-to-refresh manualmente

## 🎯 Próximos Pasos

Funcionalidades que puedes agregar:

- [ ] **Editar productos** - Agregar botón de edición en cada card
- [ ] **Eliminar productos** - Swipe-to-delete o botón de eliminar
- [ ] **Búsqueda** - Filtrar productos por nombre
- [ ] **Categorías** - Organizar productos por categorías
- [ ] **Imágenes** - Agregar fotos a los productos
- [ ] **Disponibilidad** - Toggle para marcar productos como disponibles/agotados
- [ ] **Ordenamiento** - Ordenar por precio, nombre, fecha, etc.

## 📚 Recursos

- [Gluestack UI Docs](https://ui.gluestack.io/)
- [Supabase Docs](https://supabase.com/docs)
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [React Native Docs](https://reactnative.dev/)

---

**¡Listo para usar! 🎉**
