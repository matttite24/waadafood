"use client";

import { SegmentedControl } from "@/components/ui/segmented-control";

export type DateFilterType = "hoy" | "ayer" | "7dias" | "30dias";

interface DateFiltersProps {
    selected: DateFilterType;
    onChange: (filter: DateFilterType) => void;
}

export function DateFilters({ selected, onChange }: DateFiltersProps) {
    const options = [
        { label: "Hoy", value: "hoy" },
        { label: "Ayer", value: "ayer" },
        { label: "7 días", value: "7dias" },
        { label: "30 días", value: "30dias" },
    ];

    return (
        <SegmentedControl
            options={options}
            value={selected}
            onValueChange={(val) => onChange(val as DateFilterType)}
        />
    );
}
