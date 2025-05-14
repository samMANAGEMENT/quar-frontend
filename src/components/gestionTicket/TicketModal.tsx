import { useEffect, useState } from "react";
import axios from "../../lib/axios";
import { Dialog } from "@headlessui/react";

interface TicketModalProps {
    ticketId: number;
    onClose: () => void;
}

interface TicketDetail {
    id: number;
    title: string;
    description: string;
    status: string;
    responses: { id: number; message: string; created_at: string }[];
}

const TicketModal = ({ ticketId, onClose }: TicketModalProps) => {
    const [ticket, setTicket] = useState<TicketDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [newResponse, setNewResponse] = useState("");

    useEffect(() => {
        const fetchTicketDetails = async () => {
            try {
                const response = await axios.get(`/tickets/${ticketId}`);
                setTicket(response.data);
            } catch (error) {
                console.error("Error al cargar el ticket:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTicketDetails();
    }, [ticketId]);

    const handleSendResponse = async () => {
        if (!newResponse.trim()) return;
        try {
            await axios.post(`/tickets/${ticketId}/responses`, {
                message: newResponse,
            });
            // Refrescar respuestas
            setTicket((prev) =>
                prev ? { ...prev, responses: [...prev.responses, { id: Date.now(), message: newResponse, created_at: new Date().toISOString() }] } : prev
            );
            setNewResponse("");
        } catch (error) {
            console.error("Error al enviar respuesta:", error);
        }
    };

    return (
        <Dialog open={true} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-black opacity-30" />
                <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full z-10 p-6">
                    <Dialog.Title className="text-xl font-semibold">Gestión de Ticket #{ticketId}</Dialog.Title>
                    {loading ? (
                        <p>Cargando...</p>
                    ) : ticket ? (
                        <div className="mt-4 space-y-4">
                            <p className="text-gray-700"><strong>Título:</strong> {ticket.title}</p>
                            <p className="text-gray-600"><strong>Descripción:</strong> {ticket.description}</p>
                            <p className="text-sm">
                                <strong>Estado:</strong>{" "}
                                <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">{ticket.status}</span>
                            </p>

                            <div className="mt-4">
                                <h4 className="font-semibold mb-2">Respuestas:</h4>
                                {ticket.responses.length === 0 ? (
                                    <p className="text-gray-500">Aún no hay respuestas.</p>
                                ) : (
                                    <ul className="space-y-2 max-h-40 overflow-y-auto">
                                        {ticket.responses.map((resp) => (
                                            <li key={resp.id} className="border p-2 rounded text-sm">
                                                {resp.message}
                                                <div className="text-xs text-gray-400">
                                                    {new Date(resp.created_at).toLocaleString()}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="mt-4">
                                <textarea
                                    className="w-full border rounded p-2"
                                    placeholder="Escribe una respuesta..."
                                    value={newResponse}
                                    onChange={(e) => setNewResponse(e.target.value)}
                                />
                                <button
                                    onClick={handleSendResponse}
                                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Enviar Respuesta
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p>No se encontró el ticket.</p>
                    )}

                    <button
                        onClick={onClose}
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
                    >
                        ×
                    </button>
                </div>
            </div>
        </Dialog>
    );
};

export default TicketModal;
