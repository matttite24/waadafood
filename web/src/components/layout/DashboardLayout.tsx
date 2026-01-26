import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";
import { motion } from "framer-motion";
import { HeaderProvider } from "@/hooks/use-header";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <HeaderProvider>
            <div className="flex h-screen w-full bg-muted/30 overflow-hidden">
                <AppSidebar className="h-full shrink-0 border-r border-border/50 bg-background z-30" />
                <div className="flex flex-col flex-1 h-full overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent bg-muted/30">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="h-full"
                        >
                            <div className="w-full h-full">
                                {children}
                            </div>
                        </motion.div>
                    </main>
                </div>
            </div>
        </HeaderProvider>
    );
}
