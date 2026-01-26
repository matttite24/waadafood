import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
    loading?: boolean;
}

export function ConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "default",
    loading = false,
}: ConfirmationDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="font-display font-bold text-xl">{title}</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground text-[15px] leading-relaxed">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
                    <AlertDialogCancel className="rounded-full px-6 h-11 font-bold text-xs uppercase tracking-widest">
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        className={cn(
                            "rounded-full px-6 h-11 font-bold text-xs uppercase tracking-widest transition-all",
                            variant === "destructive"
                                ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20 shadow-lg"
                                : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 shadow-lg"
                        )}
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="h-4 w-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                        ) : (
                            confirmText
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
