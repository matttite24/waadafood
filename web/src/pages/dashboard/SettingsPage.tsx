"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { AiSettings } from "@/components/settings/AiSettings";
import { BusinessHoursSettings } from "@/components/settings/BusinessHoursSettings";
import { PaymentsSettings } from "@/components/settings/PaymentsSettings";
import { CreditsSettings } from "@/components/settings/CreditsSettings";
import { TagsSettings } from "@/components/settings/TagsSettings";
import { AutomatedMessagesSettings } from "@/components/settings/AutomatedMessagesSettings";
import { MenuImagesSettings } from "@/components/settings/MenuImagesSettings";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
    Storefront,
    Robot,
    Clock,
    ChatText,
    CaretRight,
    CreditCard,
    Lightning,
    Tag,
    Notepad,
    User
} from "@phosphor-icons/react";

type SettingTab = "account" | "general" | "horarios" | "pagos" | "carta" | "ai" | "creditos" | "mensajes" | "etiquetas";

interface SettingItem {
    id: string;
    title: string;
    subtitle: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
}

interface SettingGroup {
    title: string;
    items: SettingItem[];
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingTab>("general");

    const settingsGroups: SettingGroup[] = [
        {
            title: "CUENTA",
            items: [
                {
                    id: "account",
                    title: "Mi Cuenta",
                    subtitle: "Perfil y preferencias",
                    icon: User,
                    iconBg: "bg-blue-100",
                    iconColor: "text-blue-600"
                },
            ]
        },
        {
            title: "GENERAL",
            items: [
                {
                    id: "general",
                    title: "Información",
                    subtitle: "Datos básicos y ubicación",
                    icon: Storefront,
                    iconBg: "bg-emerald-100",
                    iconColor: "text-emerald-600"
                },
                {
                    id: "horarios",
                    title: "Horario",
                    subtitle: "Atención al público",
                    icon: Clock,
                    iconBg: "bg-emerald-100",
                    iconColor: "text-emerald-600"
                },
                {
                    id: "pagos",
                    title: "Pagos",
                    subtitle: "Métodos aceptados",
                    icon: CreditCard,
                    iconBg: "bg-emerald-100",
                    iconColor: "text-emerald-600"
                },
                {
                    id: "carta",
                    title: "Carta y Tiempos",
                    subtitle: "Imágenes y tiempos de espera",
                    icon: Notepad,
                    iconBg: "bg-emerald-100",
                    iconColor: "text-emerald-600"
                },
            ]
        },
        {
            title: "CHAT",
            items: [
                {
                    id: "ai",
                    title: "Asistente IA",
                    subtitle: "Bot y personalidad",
                    icon: Robot,
                    iconBg: "bg-emerald-100",
                    iconColor: "text-emerald-600"
                },
                {
                    id: "creditos",
                    title: "Créditos IA",
                    subtitle: "Mensajes disponibles",
                    icon: Lightning,
                    iconBg: "bg-amber-100",
                    iconColor: "text-amber-600"
                },
                {
                    id: "mensajes",
                    title: "Mensajes",
                    subtitle: "Respuestas rápidas",
                    icon: ChatText,
                    iconBg: "bg-pink-100",
                    iconColor: "text-pink-600"
                },
                {
                    id: "etiquetas",
                    title: "Etiquetas",
                    subtitle: "Organización de clientes",
                    icon: Tag,
                    iconBg: "bg-emerald-100",
                    iconColor: "text-emerald-600"
                },
            ]
        }
    ];

    return (
        <div className="h-full flex overflow-hidden bg-background rounded-3xl border border-border/50 shadow-sm">
            {/* Lista de Ajustes */}
            <aside className="w-96 border-r border-border/10 bg-background flex flex-col shrink-0">
                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-8">
                        {settingsGroups.map((group) => (
                            <div key={group.title} className="space-y-2">
                                <h3 className="text-xs font-bold text-primary tracking-wider px-4">
                                    {group.title}
                                </h3>
                                <div className="space-y-1">
                                    {group.items.map((item) => (
                                        <Button
                                            key={item.id}
                                            variant="ghost"
                                            onClick={() => setActiveTab(item.id as SettingTab)}
                                            className={cn(
                                                "w-full flex items-center gap-4 p-4 h-auto justify-start rounded-2xl",
                                                activeTab === item.id && "bg-muted/50"
                                            )}
                                        >
                                            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0", item.iconBg)}>
                                                <item.icon size={28} weight="bold" className={item.iconColor} />
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <h4 className="font-bold text-base text-foreground">
                                                    {item.title}
                                                </h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {item.subtitle}
                                                </p>
                                            </div>
                                            <CaretRight
                                                size={20}
                                                weight="bold"
                                                className="text-muted-foreground/40 shrink-0"
                                            />
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </aside>

            {/* Area de Contenido */}
            <main className="flex-1 overflow-y-auto min-w-0 bg-background scrollbar-thin scrollbar-thumb-muted-foreground/10 scrollbar-track-transparent">
                <div className="max-w-4xl mx-auto p-12">
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {activeTab === "account" && <AccountSettings />}
                        {activeTab === "general" && <GeneralSettings />}
                        {activeTab === "horarios" && <BusinessHoursSettings />}
                        {activeTab === "pagos" && <PaymentsSettings />}
                        {activeTab === "carta" && <MenuImagesSettings />}
                        {activeTab === "ai" && <AiSettings />}
                        {activeTab === "creditos" && <CreditsSettings />}
                        {activeTab === "etiquetas" && <TagsSettings />}
                        {activeTab === "mensajes" && <AutomatedMessagesSettings />}
                    </div>
                </div>
            </main>
        </div>
    );
}
