import { ProductCard } from "./ProductCard";
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

interface CategorySectionProps {
    title: string;
    products: Product[];
    onProductClick: (product: Product) => void;
    className?: string;
}

export function CategorySection({ title, products, onProductClick, className }: CategorySectionProps) {
    if (products.length === 0) return null;

    return (
        <section className={cn("space-y-4", className)}>
            <div className="flex items-center gap-3">
                <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                    {title}
                </h2>
                <span className="bg-muted px-2.5 py-0.5 rounded-full text-xs font-bold text-muted-foreground">
                    {products.length} {products.length === 1 ? 'ítem' : 'ítems'}
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                {products.map((product) => (
                    <ProductCard
                        key={product._id}
                        product={product}
                        onClick={() => onProductClick(product)}
                        className="w-full"
                    />
                ))}
            </div>
        </section>
    );
}
