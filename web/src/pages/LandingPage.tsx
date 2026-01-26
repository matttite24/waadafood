import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, ShieldCheck, Lightning } from "@phosphor-icons/react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
    const { isSignedIn } = useAuth();
    const navigate = useNavigate();

    const handleCtaClick = () => {
        if (isSignedIn) {
            navigate("/overview");
        } else {
            navigate("/sign-in");
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/20">
            {/* Navbar Placeholder */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background/60 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                        <Lightning size={20} weight="fill" />
                    </div>
                    <span className="font-display text-xl font-bold tracking-tight">Chatbox</span>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate("/sign-in")}>
                        Iniciar Sesión
                    </Button>
                    <Button size="sm" onClick={() => navigate("/sign-up")} className="rounded-full px-6">
                        Comenzar
                    </Button>
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6">
                    <div className="max-w-7xl mx-auto text-center relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                                Nueva Versión 2.0 Disponible
                            </div>
                            <h1 className="text-5xl md:text-7xl font-bold font-display tracking-tight mb-6 leading-[1.1]">
                                Gestiona tu negocio <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                                    sin complicaciones.
                                </span>
                            </h1>
                            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                                Una plataforma unificada para tus pedidos, clientes y chats.
                                Diseñado para crecer contigo.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Button
                                    size="lg"
                                    className="h-14 px-8 text-lg rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all font-medium"
                                    onClick={handleCtaClick}
                                >
                                    {isSignedIn ? "Ir al Dashboard" : "Empezar Gratis"}
                                    <ArrowRight className="ml-2 h-5 w-5" weight="bold" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="h-14 px-8 text-lg rounded-full border-2 hover:bg-muted/50 transition-all"
                                >
                                    Ver Demo
                                </Button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Background Elements */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden -z-10 pointer-events-none">
                        <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-primary/10 rounded-full blur-[100px] opacity-50 mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
                        <div className="absolute top-[30%] right-[20%] w-[30rem] h-[30rem] bg-emerald-400/10 rounded-full blur-[120px] opacity-40 mix-blend-screen" />
                    </div>
                </section>

                {/* Feature Grid */}
                <section className="py-20 px-6 bg-muted/20">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: Lightning,
                                    title: "Rápido y Fluido",
                                    desc: "Interfaz optimizada para cargar en milisegundos. No pierdas tiempo esperando."
                                },
                                {
                                    icon: ShieldCheck,
                                    title: "Seguro por Defecto",
                                    desc: "Tus datos están protegidos con los mejores estándares de la industria."
                                },
                                {
                                    icon: CheckCircle,
                                    title: "Todo en Uno",
                                    desc: "Pedidos, clientes y analíticas en un solo lugar. Sin cambiar de ventana."
                                }
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1, duration: 0.5 }}
                                    className="p-8 rounded-[2rem] bg-background border border-border/50 hover:border-primary/50 transition-colors shadow-sm hover:shadow-md"
                                >
                                    <div className="h-14 w-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mb-6">
                                        <feature.icon size={32} weight="duotone" />
                                    </div>
                                    <h3 className="text-xl font-bold font-display mb-3">{feature.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {feature.desc}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <footer className="py-10 text-center text-sm text-muted-foreground border-t">
                <p>© 2024 Chatbox Inc. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
}
