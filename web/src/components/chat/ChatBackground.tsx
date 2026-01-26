import {
    Pizza,
    ForkKnife,
    BowlFood,
    Coffee,
    Hamburger,
    Cookie,
    IceCream,
    Cake
} from "@phosphor-icons/react";

export function ChatBackground() {
    const icons = [Pizza, ForkKnife, BowlFood, Coffee, Hamburger, Cookie, IceCream, Cake];

    // Generar posiciones aleatorias pero consistentes
    const generateIcons = () => {
        const iconElements = [];
        const totalIcons = 40; // Menos iconos para más dispersión

        for (let i = 0; i < totalIcons; i++) {
            const IconComponent = icons[i % icons.length];

            // Usar el índice como seed para posiciones pseudo-aleatorias pero consistentes
            const x = ((i * 17) % 100); // Posición X en porcentaje
            const y = ((i * 70) % 100); // Posición Y en porcentaje
            const rotation = (i * 47) % 360;
            const scale = 0.8 + ((i * 13) % 40) / 100; // Escala entre 0.8 y 1.2
            const opacity = i % 3 === 0 ? 0.06 : i % 2 === 0 ? 0.04 : 0.08;

            iconElements.push({
                id: i,
                Icon: IconComponent,
                x,
                y,
                rotation,
                scale,
                opacity
            });
        }

        return iconElements;
    };

    const iconElements = generateIcons();

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#fafafa]">
            {iconElements.map((item) => (
                <div
                    key={item.id}
                    className="absolute"
                    style={{
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                        transform: `rotate(${item.rotation}deg) scale(${item.scale})`,
                        opacity: item.opacity
                    }}
                >
                    <item.Icon size={32} color="#6c6d6bff" weight="regular" />
                </div>
            ))}
        </div>
    );
}
