import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ForkKnife, EyeSlash } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface Product {
    _id: string;
    nombre: string;
    precio: number;
    categoria?: string;
    descripcion?: string;
    imagen_url?: string;
    disponible?: boolean;
}

interface ProductCardProps {
    product: Product;
    onClick?: () => void;
    className?: string;
}

export const ProductCard = memo(({ product, onClick, className }: ProductCardProps) => {
    const isVisible = product.disponible !== false;

    return (
        <Card
            className={cn(
                "group relative overflow-hidden transition-all duration-200 cursor-pointer border-transparent bg-transparent shadow-none",
                !isVisible && "opacity-60",
                className
            )}
            onClick={onClick}
        >
            <div className="relative aspect-[4/3] overflow-hidden bg-muted rounded-2xl">
                {product.imagen_url ? (
                    <img
                        src={product.imagen_url}
                        alt={product.nombre}
                        className="h-full w-full object-cover transition-transform duration-200"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
                        <ForkKnife size={64} weight="thin" />
                    </div>
                )}

                {/* Price Badge */}
                <div className="absolute bottom-3 right-3">
                    <Badge
                        className="bg-background/90 text-primary backdrop-blur-md px-3 py-1 text-base font-black shadow-sm border-none hover:bg-background"
                    >
                        ${Number(product.precio || 0).toFixed(2)}
                    </Badge>
                </div>

                {/* Status Overlay */}
                {!isVisible && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                        <div className="bg-white/90 text-black px-4 py-1.5 rounded-full text-xs font-black tracking-widest flex items-center gap-2">
                            <EyeSlash size={14} weight="bold" />
                            OCULTO
                        </div>
                    </div>
                )}
            </div>

            <CardContent className="p-4 bg-transparent">
                <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg font-bold text-foreground leading-tight truncate group-hover:text-primary transition-colors duration-200">
                        {product.nombre}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[40px]">
                        {product.descripcion || product.categoria || "Sin descripción disponible"}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
});

ProductCard.displayName = "ProductCard";
