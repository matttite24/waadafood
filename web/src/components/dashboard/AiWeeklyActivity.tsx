import {
    BarChart,
    Bar,
    XAxis,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkle } from "@phosphor-icons/react";

interface WeeklyActivityProps {
    data?: { day: string; messages: number }[];
}

export function AiWeeklyActivity({ data }: WeeklyActivityProps) {
    if (!data || data.length === 0) return null;

    return (
        <Card className="border-transparent overflow-hidden bg-background">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <div className="p-2 rounded-xl bg-emerald-600 text-white">
                    <Sparkle size={16} weight="fill" />
                </div>
                <CardTitle className="text-lg font-bold font-display">Actividad del Asistente (7 días)</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] w-full pt-6 pr-6">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={data}>
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "var(--muted-foreground)", fontWeight: 500 }}
                            dy={10}
                        />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                            contentStyle={{
                                borderRadius: '16px',
                                border: '1px solid hsl(var(--border))',
                                boxShadow: 'none',
                                backgroundColor: 'hsl(var(--popover)/0.9)',
                                backdropFilter: 'blur(8px)',
                                color: 'hsl(var(--popover-foreground))',
                                padding: '8px 12px'
                            }}
                            itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                        />
                        <Bar
                            dataKey="messages"
                            radius={[8, 8, 8, 8]}
                            barSize={40}
                            fill="url(#barGradient)"
                            animationDuration={1500}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.messages > 0 ? "url(#barGradient)" : "hsl(var(--muted)/0.3)"} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
