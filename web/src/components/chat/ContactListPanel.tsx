import { MagnifyingGlass, Funnel, Check } from "@phosphor-icons/react";
import { Virtuoso } from "react-virtuoso";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Id } from "@convex/_generated/dataModel";
import { ChatListItem } from "./ChatListItem";
import { cn } from "@/lib/utils";


interface ContactListPanelProps {
    contacts: any[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedContactId: Id<"clientes"> | null;
    onSelectContact: (id: Id<"clientes">) => void;
    allTags: any[] | undefined;
    selectedTagIds: Id<"etiquetas">[];
    onToggleTag: (id: Id<"etiquetas">) => void;
    formatTime: (date?: string) => string;
    loading?: boolean;
    loadMore: (numItems: number) => void;
    canLoadMore: boolean;
}

export function ContactListPanel({
    contacts,
    searchQuery,
    setSearchQuery,
    selectedContactId,
    onSelectContact,
    allTags,
    selectedTagIds,
    onToggleTag,
    formatTime,
    loading,
    loadMore,
    canLoadMore
}: ContactListPanelProps) {
    return (
        <div className="w-[360px] shrink-0 flex flex-col bg-background rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {/* Header section consistent with native */}
            <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl font-bold text-[#1E3932]">Chats</h2>

                </div>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1E3932]/40" size={20} />
                        <Input
                            placeholder="Buscar chats..."
                            className="pl-12 bg-muted/30 border-none rounded-2xl h-12 focus-visible:ring-[#00754A]/20 placeholder:text-muted-foreground/40 font-medium text-[15px]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className={cn(
                                    "h-12 w-12 shrink-0 rounded-2xl border-none bg-muted/30 hover:bg-muted/50 transition-all",
                                    selectedTagIds.length > 0 && "bg-[#00754A]/10 text-[#00754A] shadow-sm ring-1 ring-[#00754A]/20"
                                )}
                            >
                                <Funnel size={20} weight={selectedTagIds.length > 0 ? "fill" : "regular"} />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0 rounded-2xl border-border/50 shadow-xl" align="end">
                            <Command className="rounded-2xl">
                                <CommandInput placeholder="Filtrar etiquetas..." className="h-9" />
                                <CommandList>
                                    <CommandEmpty>No hay etiquetas.</CommandEmpty>
                                    <CommandGroup>
                                        {allTags?.map((tag) => {
                                            const isSelected = selectedTagIds.includes(tag._id);
                                            return (
                                                <CommandItem
                                                    key={tag._id}
                                                    onSelect={() => onToggleTag(tag._id)}
                                                    className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                                                >
                                                    <div className={cn(
                                                        "flex h-4 w-4 items-center justify-center rounded-sm border border-primary transition-all",
                                                        isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                                                    )}>
                                                        <Check className="h-3 w-3" weight="bold" />
                                                    </div>
                                                    <div
                                                        className="h-2 w-2 rounded-full shrink-0"
                                                        style={{ backgroundColor: tag.color }}
                                                    />
                                                    <span className="flex-1 truncate text-sm font-medium">
                                                        {tag.nombre}
                                                    </span>
                                                </CommandItem>
                                            );
                                        })}
                                    </CommandGroup>
                                    {selectedTagIds.length > 0 && (
                                        <>
                                            <CommandSeparator />
                                            <CommandGroup>
                                                <CommandItem
                                                    onSelect={() => {
                                                        // Limpiar todas las etiquetas (esto requeriría un nuevo prop o lógica adicional)
                                                        // Por ahora, permitimos que el usuario las quite una a una o implementamos un clear
                                                        selectedTagIds.forEach(id => onToggleTag(id));
                                                    }}
                                                    className="justify-center text-center text-xs font-semibold text-primary hover:text-primary/80"
                                                >
                                                    Limpiar filtros
                                                </CommandItem>
                                            </CommandGroup>
                                        </>
                                    )}
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>


            {/* Virtualized List with Infinite Scroll */}
            <div className="flex-1 min-h-0">
                {loading ? (
                    <div className="p-12 text-center text-muted-foreground animate-pulse font-display text-sm font-medium">Cargando chats...</div>
                ) : contacts.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground/30">
                            <MagnifyingGlass size={32} />
                        </div>
                        <p className="text-[15px] font-medium text-muted-foreground/60 px-6">
                            {searchQuery ? "No se encontraron resultados para tu búsqueda" : "No hay mensajes en esta categoría"}
                        </p>
                    </div>
                ) : (
                    <Virtuoso
                        style={{ height: '100%' }}
                        data={contacts}
                        endReached={() => canLoadMore && loadMore(25)}
                        itemContent={(_, contact) => {
                            const contactTags = allTags?.filter(t => contact.etiquetas_ids?.includes(t._id)) || [];
                            const isSelected = selectedContactId === contact._id;

                            return (
                                <ChatListItem
                                    key={contact._id}
                                    contact={contact}
                                    isSelected={isSelected}
                                    onSelect={() => onSelectContact(contact._id)}
                                    formatTime={formatTime}
                                    tags={contactTags}
                                />
                            );
                        }}
                    />
                )}
            </div>
        </div>
    );
}
