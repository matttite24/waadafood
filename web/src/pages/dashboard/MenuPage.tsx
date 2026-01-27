"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { useHeaderContent } from "@/hooks/use-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { CategorySection } from "@/components/menu/CategorySection";
import { ProductEditPanel } from "@/components/menu/ProductEditPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { ForkKnife } from "@phosphor-icons/react";
import { Id } from "@convex/_generated/dataModel";

const CATEGORIAS_LISTA = ['Combos', 'Entradas', 'Principales', 'Bebidas', 'Postres', 'Otros'] as const;

type Product = {
    _id: Id<"productos">;
    nombre: string;
    precio: number;
    categoria?: string;
    descripcion?: string;
    imagen_url?: string;
    disponible?: boolean;
};

export default function MenuPage() {
    const { user } = useKindeAuth();
    const userId = user?.id;
    const [activeCategory, setActiveCategory] = useState<string>("Todas");
    const [selectedProduct, setSelectedProduct] = useState<Product | null | undefined>(undefined);

    // 1. Data Fetching
    const comercio = useQuery(api.comercios.getByUserId, userId ? { userId } : "skip");
    const products = useQuery(api.productos.list, comercio ? { comercio_id: comercio._id } : "skip");

    // 2. Filtering & Grouping Logic
    const { filteredProducts, categoryCounts, visibleCategories } = useMemo(() => {
        if (!products) return { filteredProducts: [], categoryCounts: {} as Record<string, number>, visibleCategories: [] as string[] };

        const normalized = products.map((p) => ({
            ...p,
            categoria: p.categoria === "Platos Fuertes" ? "Principales" : p.categoria
        }));

        const counts: Record<string, number> = { "Todas": normalized.length };
        CATEGORIAS_LISTA.forEach(cat => {
            counts[cat] = normalized.filter(p => p.categoria === cat).length;
        });

        const active = activeCategory === "Todas"
            ? normalized
            : normalized.filter(p => p.categoria === activeCategory);

        const visible = CATEGORIAS_LISTA.filter(cat =>
            normalized.some(p => p.categoria === cat)
        );

        return {
            filteredProducts: active as Product[],
            categoryCounts: counts,
            visibleCategories: visible
        };
    }, [products, activeCategory]);

    // 3. Header Injection
    const headerCenter = useMemo(() => {
        const filterOptions = [
            { label: "Todas", value: "Todas", count: categoryCounts["Todas"] || 0 },
            ...CATEGORIAS_LISTA.map(cat => ({
                label: cat,
                value: cat,
                count: categoryCounts[cat] || 0
            }))
        ];

        return (
            <SegmentedControl
                options={filterOptions}
                value={activeCategory}
                onValueChange={setActiveCategory}
            />
        );
    }, [activeCategory, categoryCounts]);

    useHeaderContent({
        center: headerCenter,
    });

    if (products === undefined || comercio === undefined) {
        return (
            <div className="flex gap-4 h-full">
                <div className="flex-1 space-y-8 animate-pulse overflow-hidden">
                    <div className="flex gap-4">
                        <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                    {[1, 2].map(i => (
                        <div key={i} className="space-y-4">
                            <Skeleton className="h-8 w-40 rounded-lg" />
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map(j => (
                                    <Skeleton key={j} className="aspect-[4/5] rounded-2xl" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <Skeleton className="w-[440px] h-full rounded-2xl hidden lg:block border border-border/50" />
            </div>
        );
    }

    return (
        <div className="flex h-full gap-6 w-full overflow-hidden">
            {/* Left Column: Product Grid */}
            <div className="flex-1 overflow-y-auto pr-2 pb-16 scrollbar-thin scrollbar-thumb-muted-foreground/10 scrollbar-track-transparent">
                {filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
                        <div className="p-8 rounded-full bg-muted/50">
                            <ForkKnife size={64} weight="thin" />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="text-xl font-bold font-display">No hay productos</h3>
                            <p className="text-sm">Agrega tu primer producto para comenzar.</p>
                        </div>
                    </div>
                ) : activeCategory === "Todas" ? (
                    <div className="space-y-12">
                        {visibleCategories.map(cat => (
                            <CategorySection
                                key={cat}
                                title={cat}
                                products={filteredProducts.filter(p => p.categoria === cat)}
                                onProductClick={(p) => setSelectedProduct(p as Product)}
                                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                            />
                        ))}
                    </div>
                ) : (
                    <CategorySection
                        title={activeCategory}
                        products={filteredProducts}
                        onProductClick={(p) => setSelectedProduct(p as Product)}
                        className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                    />
                )}
            </div>

            {/* Right Column: Persistent Native Side Panel */}
            <div className="hidden lg:block h-full w-[440px] flex-shrink-0">
                {comercio && (
                    <ProductEditPanel
                        product={selectedProduct}
                        comercioId={comercio._id}
                        onClose={() => setSelectedProduct(undefined)}
                        onOpenNew={() => setSelectedProduct(null)}
                    />
                )}
            </div>
        </div>
    );
}
