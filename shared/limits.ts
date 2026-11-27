// Límites del producto (spec §5.2). Los aplican los validadores de Convex, no solo el panel.
export const LIMITS = {
    products: { min: 1, max: 5 },
    variants: { min: 1, max: 4 },
    groupsPerProduct: { min: 0, max: 3 },
    optionsPerGroup: { min: 1, max: 8 },
    upsells: { min: 0, max: 2 },
    descMax: 140,
    productNameMax: 40,
    originalPhotoMaxBytes: 12 * 1024 * 1024,
    uploadedVariantMaxBytes: 400 * 1024,
    freeOrdersPerMonth: 50,
} as const;

export const RESERVED_SLUGS = [
    'app', 'api', 'assets', 'i', 'health', 'panel', 'admin', 'www', 'login', 'static',
] as const;

export const SLUG_RE = /^[a-z0-9-]{2,40}$/;
