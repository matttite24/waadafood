import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Receipt, ChatCircleText, ArrowRight } from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ActivityItem {
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: number;
    link: string;
}

interface ActivityFeedProps {
    items?: ActivityItem[];
}

export function ActivityFeed({ items }: ActivityFeedProps) {
    if (!items || items.length === 0) {
        return (
            <Card className="border-transparent h-full flex flex-col justify-center items-center p-8 text-center bg-muted/20">
                <p className="text-muted-foreground">No hay actividad reciente.</p>
            </Card>
        );
    }

    return (
        <Card className="border-transparent h-full bg-background/100 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-bold font-display">Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pt-0">
                <div className="divide-y divide-border/50">
                    {items.map((item) => (
                        <Link
                            key={item.id}
                            to={item.link}
                            className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors group"
                        >
                            <div className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${item.type === 'order'
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-purple-100 text-purple-600'
                                }`}>
                                {item.type === 'order' ? (
                                    <Receipt size={20} weight="fill" />
                                ) : (
                                    <ChatCircleText size={20} weight="fill" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-200">
                                        {item.title}
                                    </p>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                        {formatDistanceToNow(item.timestamp, { addSuffix: true, locale: es })}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                    {item.description}
                                </p>
                            </div>
                            <ArrowRight size={16} className="text-muted-foreground/30 group-hover:text-primary transition-colors duration-200" />
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
