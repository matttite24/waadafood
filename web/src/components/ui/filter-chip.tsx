import { cn } from "@/lib/utils";

interface FilterChipProps {
    label: string;
    count?: number;
    isActive?: boolean;
    onClick?: () => void;
}

export function FilterChip({ label, count, isActive = false, onClick }: FilterChipProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all",
                isActive
                    ? "bg-[#00754A] text-white"
                    : "bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
        >
            {label}
            {count !== undefined && (
                <span className={cn(
                    "text-[11px] font-semibold tabular-nums",
                    isActive ? "text-white/80" : "text-muted-foreground/60"
                )}>
                    {count}
                </span>
            )}
        </button>
    );
}
