"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import * as PhosphorIcons from "@phosphor-icons/react";

interface MetricCardProps {
    title: string;
    value: string;
    iconName: string;
    color: string;
    bgColor: string;
    onClick: () => void;
}

export function MetricCard({ title, value, iconName, color, bgColor, onClick }: MetricCardProps) {
    // Dynamically get the icon from PhosphorIcons
    const Icon = (PhosphorIcons as any)[iconName] || PhosphorIcons.TrendUp;

    return (
        <Card
            className={cn(
                "border-transparent shadow-sm overflow-hidden bg-background/100 backdrop-blur-sm transition-all hover:shadow-md hover:-translate-y-1 cursor-pointer"
            )}
            onClick={onClick}
        >
            <CardHeader className="pb-1 pt-4">
                <div
                    className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center mb-1",
                        bgColor
                    )}
                    style={{ color }}
                >
                    <Icon size={24} weight="duotone" />
                </div>
                <CardTitle className="text-sm font-bold font-display text-muted-foreground">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
                <div className="text-2xl font-black font-display text-foreground tracking-tight">
                    {value}
                </div>
            </CardContent>
        </Card>
    );
}
