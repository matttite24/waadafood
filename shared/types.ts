import type { Doc } from "../convex/_generated/dataModel";

// El menú es la fuente de verdad de Convex (convex/menuValidators.ts); aquí solo se derivan los tipos.
export type Menu = Doc<"stores">["publishedMenu"] & object;
export type Product = Menu["products"][number];
