# Paleta de Colores - Chatbox

Esta es la paleta de colores oficial de la aplicación, implementada en React Native Paper.

## Colores Principales

### Verde Principal
- **#00754A** - Color primario (botones, acentos principales)
- Uso: Botones principales, iconos destacados, enlaces importantes

### Verde Claro
- **#D4E9E2** - Contenedores y fondos suaves
- Uso: Fondos de tarjetas secundarias, estados hover, badges

### Verde Oscuro Secundario
- **#006241** - Acciones secundarias
- Uso: Botones secundarios, texto de énfasis medio

### Verde Muy Oscuro
- **#1E3932** - Texto principal y elementos oscuros
- Uso: Texto principal, iconos, elementos de alta jerarquía

### Beige Claro
- **#F2F0EB** - Fondo principal de la app
- Uso: Fondo de pantallas, áreas grandes

### Beige/Durazno
- **#F2D0AD** - Acentos cálidos
- Uso: Badges especiales, notificaciones, elementos destacados

## Uso en Componentes de React Native Paper

Los colores se aplican automáticamente a través del tema configurado en `app/_layout.tsx`:

```typescript
// Botón principal (verde #00754A)
<Button mode="contained">Acción Principal</Button>

// Botón secundario (verde oscuro #006241)
<Button mode="outlined">Acción Secundaria</Button>

// Input con borde verde
<TextInput mode="outlined" label="Email" />

// Superficie blanca sobre fondo beige
<Surface style={{ padding: 16 }}>
  <Text>Contenido</Text>
</Surface>
```

## Mapeo de Colores en el Tema

| Propiedad | Color | Uso |
|-----------|-------|-----|
| `primary` | #00754A | Botones, FABs, switches activos |
| `primaryContainer` | #D4E9E2 | Fondos de elementos primarios |
| `secondary` | #006241 | Elementos secundarios |
| `secondaryContainer` | #F2F0EB | Fondos secundarios |
| `tertiary` | #1E3932 | Elementos terciarios |
| `tertiaryContainer` | #F2D0AD | Fondos terciarios |
| `background` | #F2F0EB | Fondo de la app |
| `surface` | #FFFFFF | Tarjetas y superficies elevadas |
| `surfaceVariant` | #D4E9E2 | Variantes de superficies |
| `outline` | #00754A | Bordes de inputs y divisores |
| `onPrimary` | #FFFFFF | Texto sobre primary |
| `onSurface` | #1E3932 | Texto sobre surface |
| `onBackground` | #1E3932 | Texto sobre background |

## Accesibilidad

Todos los colores cumplen con WCAG 2.1 AA para contraste:
- Verde principal (#00754A) sobre blanco: ✅ AAA
- Verde oscuro (#1E3932) sobre blanco: ✅ AAA
- Blanco sobre verde principal: ✅ AAA

## Ejemplos de Uso

### Pantalla de Login
- Fondo: Verde principal (#00754A)
- Tarjeta: Blanco (#FFFFFF) con opacidad 95%
- Texto en fondo verde: Blanco (#FFFFFF)

### Pantallas de App
- Fondo: Beige claro (#F2F0EB)
- Tarjetas: Blanco (#FFFFFF)
- Texto principal: Verde oscuro (#1E3932)
- Acentos: Verde principal (#00754A)

### Botones
- Primario: Verde (#00754A) con texto blanco
- Secundario: Borde verde (#00754A) con texto verde
- Terciario: Texto verde (#00754A) sin fondo
