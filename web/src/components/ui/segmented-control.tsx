import { cn } from "@/lib/utils";
import { Check } from "@phosphor-icons/react";

interface SegmentedControlOption {
    value: string;
    label: string;
    count?: number;
}

interface SegmentedControlProps {
    options: SegmentedControlOption[];
    value: string;
    onValueChange: (value: string) => void;
    className?: string;
}

export function SegmentedControl({
    options,
    value,
    onValueChange,
    className
}: SegmentedControlProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-2 flex-wrap",
                className
            )}
            role="tablist"
        >
            {options.map((option) => {
                const isActive = value === option.value;
                return (
                    <button
                        key={option.value}
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onValueChange(option.value)}
                        className={cn(
                            "group relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-bold tracking-tight whitespace-nowrap transition-all duration-200 border",
                            isActive
                                ? "bg-[#D1EAE2] border-[#A3D1C2] text-[#00754A] shadow-sm"
                                : "bg-white border-transparent text-[#6B7280] hover:bg-gray-50 hover:text-[#4B5563]"
                        )}
                    >
                        {isActive && (
                            <Check
                                size={14}
                                weight="bold"
                                className="animate-in zoom-in duration-300"
                            />
                        )}
                        <span>{option.label}</span>
                        {option.count !== undefined && (
                            <span className={cn(
                                "ml-1 opacity-70 font-black",
                                isActive ? "text-[#00754A]" : "text-[#9CA3AF]"
                            )}>
                                {option.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
