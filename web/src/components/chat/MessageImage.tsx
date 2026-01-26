import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { ImageLightbox } from "./ImageLightbox";
import { cn } from "@/lib/utils";

interface MessageImageProps {
    storageId: string;
    alt?: string;
    className?: string;
}

export function MessageImage({ storageId, alt = "Shared", className }: MessageImageProps) {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const isFullUrl = storageId.startsWith("http") || storageId.startsWith("data:");
    const resultUrl = useQuery(api.files.getUrl, isFullUrl ? "skip" : { storageId: storageId as Id<"_storage"> });

    const finalUrl = isFullUrl ? storageId : resultUrl;

    if (!finalUrl) {
        return (
            <div className={cn(className, "bg-muted/20 animate-pulse")} />
        );
    }

    return (
        <>
            <img
                src={finalUrl}
                alt={alt}
                className={cn(className, "cursor-pointer transition-all hover:brightness-90 active:scale-[0.98]")}
                onClick={() => setIsLightboxOpen(true)}
            />

            <ImageLightbox
                src={finalUrl}
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
                alt={alt}
            />
        </>
    );
}
