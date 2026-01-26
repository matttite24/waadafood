import { useRef, useState, useEffect } from "react";
import { Lightning, PaperPlaneRight, PlusCircle, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

interface ChatInputProps {
    value: string;
    onChangeText: (text: string) => void;
    onSend: () => void;
    placeholder?: string;
    isLoading?: boolean;
    disabled?: boolean;
    comercioId?: Id<"comercios"> | null;
    selectedImages?: string[];
    onImagesChange?: (images: string[]) => void;
}

export function ChatInput({
    value,
    onChangeText,
    onSend,
    placeholder = "Escribe un mensaje...",
    isLoading = false,
    disabled = false,
    comercioId,
    selectedImages = [],
    onImagesChange,
}: ChatInputProps) {
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showTemplates, setShowTemplates] = useState(false);
    const isBlocked = isLoading || disabled;
    const canSend = (value.trim().length > 0 || selectedImages.length > 0) && !isBlocked;

    // Quick Replies Logic
    const plantillas = useQuery(api.plantillas.list, comercioId ? { comercio_id: comercioId } : "skip");
    const [matchingTemplates, setMatchingTemplates] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (!plantillas) return;

        const lastWord = value.split(/\s+/).pop();
        if (lastWord && lastWord.startsWith('/')) {
            const query = lastWord.slice(1).toLowerCase();
            const matches = plantillas.filter(p => p.nombre.toLowerCase().startsWith(query));
            setMatchingTemplates(matches);
            setShowSuggestions(matches.length > 0);
        } else {
            setShowSuggestions(false);
        }
    }, [value, plantillas]);

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = '24px';
            const scrollHeight = inputRef.current.scrollHeight;
            inputRef.current.style.height = Math.min(scrollHeight, 160) + 'px';
        }
    }, [value]);

    const handleSelectTemplate = (contenido: string) => {
        // Reemplazar la última palabra (el comando) por el contenido
        const words = value.split(/\s+/);
        words.pop(); // Remove shortcut
        const newValue = words.join(' ') + (words.length > 0 ? ' ' : '') + contenido + ' ';
        onChangeText(newValue);
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    const handleSend = () => {
        if (!canSend) return;
        onSend();
        // Mantener el foco en el input después de enviar
        setTimeout(() => {
            inputRef.current?.focus();
        }, 50);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || !onImagesChange) return;

        const fileArray = Array.from(files);

        // Convertir cada archivo a base64
        const imagePromises = fileArray.map(file => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (reader.result) {
                        resolve(reader.result as string);
                    } else {
                        reject(new Error('Failed to read file'));
                    }
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });

        try {
            const newImages = await Promise.all(imagePromises);
            onImagesChange([...selectedImages, ...newImages]);
        } catch (error) {
            console.error('Error loading images:', error);
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveImage = (index: number) => {
        if (onImagesChange) {
            const newImages = selectedImages.filter((_, i) => i !== index);
            onImagesChange(newImages);
        }
    };

    return (
        <div className="relative p-4 bg-background/95 backdrop-blur-sm border-t-2 border-border/30 shadow-lg rounded-b-2xl">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
            />

            {/* Quick Replies Suggestions usando Command */}
            {showSuggestions && matchingTemplates.length > 0 && (
                <div className="absolute bottom-full left-4 right-4 mb-2">
                    <Command className="rounded-xl border border-border/50 shadow-lg">
                        <CommandList className="max-h-[200px]">
                            <CommandEmpty>No se encontraron plantillas</CommandEmpty>
                            <CommandGroup heading="Plantillas rápidas">
                                {matchingTemplates.map((item) => (
                                    <CommandItem
                                        key={item._id}
                                        onSelect={() => handleSelectTemplate(item.contenido)}
                                        className="flex items-center gap-3 cursor-pointer"
                                    >
                                        <div className="bg-[#E8F5E9] p-2 rounded-lg">
                                            <Lightning size={14} weight="fill" className="text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-primary text-sm">/{item.nombre}</p>
                                            <p className="text-xs text-muted-foreground truncate">{item.contenido}</p>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </div>
            )}

            {/* Image Preview */}
            {selectedImages.length > 0 && (
                <div className="mb-3 max-w-4xl mx-auto">
                    <div className="flex gap-2 overflow-x-auto pb-2 pt-2 px-2">
                        {selectedImages.map((uri, index) => (
                            <div key={index} className="relative shrink-0">
                                <img
                                    src={uri}
                                    alt={`Preview ${index + 1}`}
                                    className="w-20 h-20 rounded-xl object-cover border border-border/50"
                                />
                                <button
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors duration-200"
                                >
                                    <X size={14} weight="bold" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Container - 3 partes separadas */}
            <div className="flex gap-3 items-center max-w-4xl mx-auto">
                {/* 1. Botón de adjuntar (izquierda) */}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-12 w-12 rounded-full text-primary hover:text-primary hover:bg-primary/5 shrink-0 transition-colors duration-200",
                        (isBlocked || value.trim().length > 0) && "opacity-30 pointer-events-none"
                    )}
                    disabled={isBlocked || value.trim().length > 0}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <PlusCircle size={40} weight="fill" />
                </Button>

                {/* 2. Input de texto (centro) */}
                <div className="flex-1 bg-muted/40 rounded-xl border border-border/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-200 px-4 min-h-[48px] flex items-center">
                    <textarea
                        ref={inputRef}
                        placeholder={isBlocked ? "Espere..." : placeholder}
                        className="w-full bg-transparent border-none focus:outline-none resize-none text-sm scrollbar-none font-medium text-foreground placeholder:text-muted-foreground/50 py-3"
                        style={{ height: '24px', minHeight: '24px', maxHeight: '160px' }}
                        value={value}
                        onChange={(e) => onChangeText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isBlocked}
                        maxLength={500}
                    />
                </div>

                {/* 3. Botones dinámicos (derecha) */}
                <div className="flex gap-2 shrink-0">
                    {/* Botón de plantillas (solo visible cuando no hay texto) */}
                    {!canSend && (
                        <Popover open={showTemplates} onOpenChange={setShowTemplates}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-12 w-12 rounded-full text-foreground hover:text-primary hover:bg-primary/5 transition-colors duration-200"
                                    disabled={isBlocked}
                                >
                                    <Lightning size={36} weight="fill" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="end">
                                <Command>
                                    <CommandInput placeholder="Buscar plantilla..." />
                                    <CommandList>
                                        <CommandEmpty>No se encontraron plantillas</CommandEmpty>
                                        <CommandGroup heading="Plantillas disponibles">
                                            {plantillas?.map((item) => (
                                                <CommandItem
                                                    key={item._id}
                                                    onSelect={() => {
                                                        onChangeText(item.contenido + ' ');
                                                        setShowTemplates(false);
                                                        inputRef.current?.focus();
                                                    }}
                                                    className="flex items-center gap-3 cursor-pointer"
                                                >
                                                    <div className="bg-[#E8F5E9] p-2 rounded-lg">
                                                        <Lightning size={14} weight="fill" className="text-primary" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-primary text-sm">{item.nombre}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{item.contenido}</p>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    )}

                    {/* Botón de enviar (siempre visible, habilitado solo cuando hay texto) */}
                    <Button
                        size="icon"
                        className={cn(
                            "h-12 w-12 rounded-full transition-all",
                            canSend
                                ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
                                : "bg-muted text-muted-foreground cursor-not-allowed"
                        )}
                        onClick={handleSend}
                        disabled={!canSend}
                    >
                        <PaperPlaneRight size={26} weight="fill" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
