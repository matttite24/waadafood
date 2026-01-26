import { X, Tag } from "@phosphor-icons/react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Id } from "@convex/_generated/dataModel";

interface TagsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    availableTags: any[] | undefined;
    selectedTagIds: Id<"etiquetas">[];
    onToggleTag: (tagId: Id<"etiquetas">) => void;
}

export function TagsModal({
    open,
    onOpenChange,
    availableTags,
    selectedTagIds,
    onToggleTag
}: TagsModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-display text-xl flex items-center gap-2">
                        <Tag size={24} weight="duotone" className="text-primary" />
                        Gestionar Etiquetas
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3 py-4">
                    {!availableTags || availableTags.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p className="text-sm">No hay etiquetas disponibles</p>
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            {availableTags.map(tag => {
                                const isSelected = selectedTagIds.includes(tag._id);
                                return (
                                    <button
                                        key={tag._id}
                                        onClick={() => onToggleTag(tag._id)}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border-2 transition-all",
                                            isSelected
                                                ? "border-current shadow-sm"
                                                : "border-border/50 hover:border-border"
                                        )}
                                        style={{
                                            backgroundColor: isSelected ? `${tag.color}15` : 'transparent',
                                            color: isSelected ? tag.color : 'inherit'
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="h-4 w-4 rounded-full border-2"
                                                style={{
                                                    backgroundColor: tag.color,
                                                    borderColor: tag.color
                                                }}
                                            />
                                            <span className="font-medium text-sm">{tag.nombre}</span>
                                        </div>
                                        {isSelected && (
                                            <div className="h-5 w-5 rounded-full flex items-center justify-center"
                                                style={{ backgroundColor: tag.color }}
                                            >
                                                <X size={12} weight="bold" className="text-white" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl"
                    >
                        Cerrar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
