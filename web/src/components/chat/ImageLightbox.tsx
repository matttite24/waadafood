import { X, DownloadSimple } from "@phosphor-icons/react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImageLightboxProps {
    src: string;
    isOpen: boolean;
    onClose: () => void;
    alt?: string;
}

export function ImageLightbox({ src, isOpen, onClose, alt = "Image" }: ImageLightboxProps) {
    const handleDownload = async () => {
        try {
            const response = await fetch(src);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `chatbase-image-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading image:", error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[100vw] w-screen h-screen p-0 border-none bg-black/95 shadow-none overflow-hidden flex items-center justify-center !gap-0 !rounded-none">
                <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDownload}
                        className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-md"
                    >
                        <DownloadSimple size={20} weight="bold" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-md"
                    >
                        <X size={20} weight="bold" />
                    </Button>
                </div>

                <img
                    src={src}
                    alt={alt}
                    className="max-w-full max-h-[90vh] object-contain animate-in zoom-in-95 duration-300 select-none"
                    onContextMenu={(e) => e.preventDefault()}
                />

                {alt && alt !== "Shared" && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/40 backdrop-blur-lg rounded-full border border-white/10 text-white/90 text-xs font-medium tracking-wide">
                        {alt}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
