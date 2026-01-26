import { useState, useMemo } from "react";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@clerk/clerk-react";
import { Id } from "@convex/_generated/dataModel";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useHeaderContent } from "@/hooks/use-header";
import { SegmentedControl } from "@/components/ui/segmented-control";

// Componentes Refactorizados
import { ContactListPanel } from "@/components/chat/ContactListPanel";
import { ConversationPanel } from "@/components/chat/ConversationPanel";
import { ContactPanel } from "@/components/chat/ContactPanel";

const FILTROS = ['Todos', 'Agente iA', 'Urgente', 'Humano', 'No leídos', 'Archivados'];

export default function ChatsPage() {
    const { userId } = useAuth();
    const [selectedContactId, setSelectedContactId] = useState<Id<"clientes"> | null>(null);
    const [showInfoPanel, setShowInfoPanel] = useState(true);
    const [activeFiltro, setActiveFiltro] = useState('Todos');
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTagIds, setSelectedTagIds] = useState<Id<"etiquetas">[]>([]);

    // 1. Obtener Comercio
    const comercio = useQuery(api.comercios.getByUserId, userId ? { userId } : "skip");

    // 2. Obtener Lista de Clientes con Paginación (Optimizado)
    const {
        results: contactsRaw,
        status: contactsStatus,
        loadMore
    } = usePaginatedQuery(
        api.clientesPaginated.listPaginated,
        comercio ? { comercio_id: comercio._id } : "skip",
        { initialNumItems: 50 }
    );

    // 3. Obtener todas las etiquetas metadata
    const allTags = useQuery(api.etiquetas.listByComercio,
        comercio ? { comercio_id: comercio._id } : "skip"
    );

    // 4. Obtener Mensajes del Cliente Seleccionado
    const messages = useQuery(api.mensajes.list,
        selectedContactId ? { cliente_id: selectedContactId } : "skip"
    );

    // 5. Obtener Detalle del Cliente Seleccionado (Panel Derecho)
    const clientDetail = useQuery(api.clientes.getClienteDetail,
        selectedContactId ? { cliente_id: selectedContactId } : "skip"
    );

    // Mutations
    const sendMessageMutation = useMutation(api.mensajes.send);
    const markAsRead = useMutation(api.clientes.marcarComoLeido);
    const updateClientMutation = useMutation(api.clientes.update);

    // Lógica de Filtrado y Contadores
    const { filteredContacts, counts } = useMemo(() => {
        if (!contactsRaw) return { filteredContacts: [], counts: {} as any };

        const countsValues = {
            'Todos': 0,
            'Agente iA': 0,
            'Urgente': 0,
            'Humano': 0,
            'No leídos': 0,
            'Archivados': 0
        };

        const processed = contactsRaw.map(c => {
            const isUnread = !c.asistente_activo && c.ultimo_mensaje_es_dueno === false && c.tiene_mensajes_sin_leer;

            // Actualizar contadores (solo para no archivados, excepto el filtro Archivados)
            if (!c.archivado) {
                countsValues['Todos']++;
                if (c.asistente_activo) countsValues['Agente iA']++;
                if (c.requiere_atencion_humana) countsValues['Urgente']++;
                if (!c.asistente_activo) countsValues['Humano']++;
                if (isUnread) countsValues['No leídos']++;
            } else {
                countsValues['Archivados']++;
            }

            return { ...c, isUnread };
        });

        let filtered = processed.filter(c =>
        (c.nombre_usuario?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.telefono.includes(searchQuery))
        );

        // Filtrar por etiquetas seleccionadas
        if (selectedTagIds.length > 0) {
            filtered = filtered.filter(c =>
                selectedTagIds.every(tagId => c.etiquetas_ids?.includes(tagId))
            );
        }

        if (activeFiltro === 'Archivados') {
            filtered = filtered.filter(c => c.archivado);
        } else {
            filtered = filtered.filter(c => !c.archivado);
            if (activeFiltro === 'Agente iA') filtered = filtered.filter(c => c.asistente_activo);
            if (activeFiltro === 'Urgente') filtered = filtered.filter(c => c.requiere_atencion_humana);
            if (activeFiltro === 'Humano') filtered = filtered.filter(c => !c.asistente_activo);
            if (activeFiltro === 'No leídos') filtered = filtered.filter(c => c.isUnread);
        }

        return { filteredContacts: filtered, counts: countsValues };
    }, [contactsRaw, activeFiltro, searchQuery, selectedTagIds]);

    // Memoizar contenido del Header para evitar bucle infinito de re-renders
    const headerCenter = useMemo(() => {
        const filterOptions = FILTROS.map(filtro => ({
            value: filtro,
            label: filtro,
            count: counts[filtro as keyof typeof counts] || 0
        }));

        return (
            <SegmentedControl
                options={filterOptions}
                value={activeFiltro}
                onValueChange={setActiveFiltro}
            />
        );
    }, [counts, activeFiltro]);

    // Inyectar contenido en el Header
    useHeaderContent({
        center: headerCenter,
    });

    const formatTime = (isoString?: string) => {
        if (!isoString) return "";
        try {
            const date = new Date(isoString);
            const now = new Date();

            if (date.toDateString() === now.toDateString()) {
                return format(date, "HH:mm", { locale: es });
            }
            return format(date, "d MMM, HH:mm", { locale: es });
        } catch (e) {
            return "";
        }
    };

    const handleSelectContact = (id: Id<"clientes">) => {
        setSelectedContactId(id);
        markAsRead({ id });
    };

    const handleSendMessage = async (text: string, imageIds?: string[]) => {
        if (!comercio || !selectedContactId) return;

        try {
            await sendMessageMutation({
                comercio_id: comercio._id,
                cliente_id: selectedContactId,
                contenido: text,
                es_ia: false,
                es_dueno: true,
                imagenes: imageIds && imageIds.length > 0 ? imageIds : undefined,
            });

            await updateClientMutation({
                id: selectedContactId,
                updates: { requiere_atencion_humana: false }
            });
        } catch (error) {
            console.error("Error al enviar mensaje:", error);
        }
    };

    const handleUpdateClient = async (id: Id<"clientes">, updates: any) => {
        try {
            await updateClientMutation({ id, updates });
        } catch (error) {
            console.error("Error al actualizar cliente:", error);
        }
    };

    const selectedContact = contactsRaw?.find(c => c._id === selectedContactId);

    return (
        <div className="flex h-[calc(100vh-140px)] gap-4 w-full overflow-x-auto">
            <ContactListPanel
                contacts={filteredContacts}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedTagIds={selectedTagIds}
                onToggleTag={(id: Id<"etiquetas">) => {
                    setSelectedTagIds(prev =>
                        prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
                    );
                }}
                selectedContactId={selectedContactId}
                onSelectContact={handleSelectContact}
                allTags={allTags}
                formatTime={formatTime}
                loading={contactsStatus !== "LoadingFirstPage" && !contactsRaw}
                loadMore={loadMore}
                canLoadMore={contactsStatus === "CanLoadMore"}
            />

            <ConversationPanel
                selectedContact={selectedContact}
                messages={messages}
                onSendMessage={handleSendMessage}
                onToggleInfoPanel={() => setShowInfoPanel(!showInfoPanel)}
                onUpdateClient={handleUpdateClient}
                formatTime={formatTime}
                availableTags={allTags}
                comercioId={comercio?._id}
            />

            {showInfoPanel && selectedContactId && (
                <ContactPanel
                    selectedContact={selectedContact}
                    clientDetail={clientDetail}
                    onClose={() => setShowInfoPanel(false)}
                    formatTime={formatTime}
                />
            )}
        </div>
    );
}
