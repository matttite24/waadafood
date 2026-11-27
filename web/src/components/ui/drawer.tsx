import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"

import { cn } from "@/lib/utils"

/**
 * Hoja inferior estándar (el "Sheet side=bottom" de shadcn sobre Radix Dialog). Sin gesto de arrastre:
 * se cierra con la ✕, tocando fuera o con Esc. Mantiene los nombres "Drawer*" para no tocar las pantallas.
 */
const Drawer = DialogPrimitive.Root
const DrawerTrigger = DialogPrimitive.Trigger
const DrawerPortal = DialogPrimitive.Portal
const DrawerClose = DialogPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "sheet-overlay fixed inset-0 z-50 bg-black/50",
      className
    )}
    {...props}
  />
))
DrawerOverlay.displayName = "DrawerOverlay"

/**
 * En el iPhone el teclado NO achica la página: la tapa. Una hoja pegada abajo quedaría escondida detrás.
 * Con la API de visualViewport se mide cuánto tapa el teclado y se sube la hoja y se limita su alto.
 */
function useVisibleViewport() {
  const [v, setV] = React.useState<{ bottom: number; height: number } | null>(null)
  React.useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => setV({ bottom: Math.max(0, window.innerHeight - vv.height - vv.offsetTop), height: vv.height })
    update()
    vv.addEventListener("resize", update)
    vv.addEventListener("scroll", update)
    return () => {
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
    }
  }, [])
  return v
}

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, style, onOpenAutoFocus, ...props }, ref) => {
  const vv = useVisibleViewport()
  const inner = React.useRef<HTMLDivElement | null>(null)
  const setRefs = (node: HTMLDivElement | null) => {
    inner.current = node
    if (typeof ref === "function") ref(node)
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
  }
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DialogPrimitive.Content
        ref={setRefs}
        aria-describedby={undefined}
        // Al abrir, el foco va a la hoja y no al primer botón (la ✕ salía con un aro) ni a un campo (abriría el teclado solo).
        onOpenAutoFocus={(e) => {
          onOpenAutoFocus?.(e)
          if (!e.defaultPrevented) {
            e.preventDefault()
            inner.current?.focus()
          }
        }}
        className={cn(
          "sheet-content fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-md flex-col rounded-t-2xl border bg-background shadow-[0_-8px_30px_rgba(0,0,0,0.12)] outline-none",
          className
        )}
        style={{
          ...style,
          // Con el teclado abierto: se sube sobre él y nunca pasa del alto visible.
          bottom: vv ? vv.bottom : undefined,
          maxHeight: vv ? Math.min(vv.height * 0.96, window.innerHeight * 0.94) : undefined,
        }}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DrawerPortal>
  )
})
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)} {...props} />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-auto flex flex-col gap-2 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]", className)} {...props} />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
))
DrawerTitle.displayName = "DrawerTitle"

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
DrawerDescription.displayName = "DrawerDescription"

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
