import { useEffect, useState } from "react";
import axios from "../../lib/axios";
import { Dialog } from "@headlessui/react";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Select from "../form/Select";
import { Toaster, toast } from "react-hot-toast";

interface TicketModalProps {
    ticketId: number;
    onClose: () => void;
}

interface Submission {
    label: string;
    value: string | null;
}

interface TicketResponse {
    id: number;
    ticket_template_id: number;
    submission: Submission[];
    tecnico: string | null;
    status: string | null;
    serial: string | null;
    description: string | null;
    tipo_mantenimiento: string | null;
    created_at: string;
    updated_at: string;
}

interface Tecnico {
    id: number;
    name: string;
    email: string;
    profile_photo_url: string;
    created_at: string;
}

const TicketModal = ({ ticketId, onClose }: TicketModalProps) => {
    const [responses, setResponses] = useState<TicketResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [newResponse, setNewResponse] = useState("");
    const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showTecnicosList, setShowTecnicosList] = useState(false);
    const [formValues, setFormValues] = useState<Record<string, string>>({
        tecnico: "",
        status: "",
        serial: "",
        description: "",
        tipo_mantenimiento: ""
    });

    useEffect(() => {
        const fetchTecnicos = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get("/get-tecnicos", {
                    headers: {
                        "Authorization": token,
                    },
                });
                setTecnicos(response.data);
            } catch (error) {
                console.error("Error al cargar técnicos:", error);
                toast.error("Error al cargar la lista de técnicos");
            }
        };

        fetchTecnicos();
    }, []);

    useEffect(() => {
        const fetchResponses = async () => {
            try {
                const response = await axios.get(`/submissions/by-template/${ticketId}`);
                setResponses(response.data);
                if (response.data.length > 0) {
                    const lastResponse = response.data[response.data.length - 1];
                    setFormValues({
                        tecnico: lastResponse.tecnico || "",
                        status: lastResponse.status || "",
                        serial: lastResponse.serial || "",
                        description: lastResponse.description || "",
                        tipo_mantenimiento: lastResponse.tipo_mantenimiento || ""
                    });
                }
            } catch (error) {
                console.error("Error al cargar las respuestas:", error);
                toast.error("Error al cargar las respuestas del ticket");
            } finally {
                setLoading(false);
            }
        };
        fetchResponses();
    }, [ticketId]);

    const handleInputChange = (fieldId: string, value: string) => {
        setFormValues(prev => ({
            ...prev,
            [fieldId]: value
        }));
    };

    const handleTecnicoSearch = (value: string) => {
        setSearchTerm(value);
        setShowTecnicosList(true);
        handleInputChange("tecnico", value);
    };

    const handleTecnicoSelect = (tecnico: Tecnico) => {
        setFormValues(prev => ({
            ...prev,
            tecnico: tecnico.name
        }));
        setSearchTerm(tecnico.name);
        setShowTecnicosList(false);
    };

    const filteredTecnicos = tecnicos.filter(tecnico =>
        tecnico.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tecnico.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSendResponse = async () => {
        if (!newResponse.trim()) return;
        try {
            await axios.post(`/tickets/${ticketId}/responses`, {
                message: newResponse,
            });
            setNewResponse("");
            toast.success("Respuesta enviada correctamente");
            // Recargar las respuestas
            const response = await axios.get(`/submissions/by-template/${ticketId}`);
            setResponses(response.data);
        } catch (error) {
            console.error("Error al enviar respuesta:", error);
            toast.error("Error al enviar la respuesta");
        }
    };

    const handleUpdateTicket = async () => {
        try {
            await axios.patch(`/ticket-submissions/${ticketId}`, {
                tecnico: formValues["tecnico"],
                status: formValues["status"],
                serial: formValues["serial"],
                description: formValues["description"],
                tipo_mantenimiento: formValues["tipo_mantenimiento"]
            });
            toast.success("Ticket actualizado correctamente");
            // Recargar las respuestas
            const response = await axios.get(`/submissions/by-template/${ticketId}`);
            setResponses(response.data);
        } catch (error) {
            console.error("Error al actualizar el ticket:", error);
            toast.error("Error al actualizar el ticket");
        }
    };

    return (
        <>
            <Toaster position="top-right" />
            <Dialog open={true} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen px-4">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                    <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full z-10 p-6">
                        <Dialog.Title className="text-xl font-semibold mb-4">Gestión de Ticket #{ticketId}</Dialog.Title>
                        {loading ? (
                            <p>Cargando...</p>
                        ) : (
                            <div className="mt-4 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Campos específicos para la gestión */}
                                    <div className="space-y-2">
                                        <Label>Técnico Asignado</Label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => handleTecnicoSearch(e.target.value)}
                                                placeholder="Buscar técnico..."
                                                onFocus={() => setShowTecnicosList(true)}
                                                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                                            />
                                            {showTecnicosList && searchTerm && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                                    {filteredTecnicos.length > 0 ? (
                                                        filteredTecnicos.map((tecnico) => (
                                                            <div
                                                                key={tecnico.id}
                                                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                                onClick={() => handleTecnicoSelect(tecnico)}
                                                            >
                                                                <div className="font-medium">{tecnico.name}</div>
                                                                <div className="text-sm text-gray-500">{tecnico.email}</div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-4 py-2 text-gray-500">No se encontraron técnicos</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Estado</Label>
                                        <Select
                                            options={[
                                                { value: "Pendiente", label: "Pendiente" },
                                                { value: "En progreso", label: "En progreso" },
                                                { value: "Completado", label: "Completado" },
                                                { value: "Cancelado", label: "Cancelado" }
                                            ]}
                                            onChange={(value) => handleInputChange("status", value)}
                                            placeholder="Seleccione el estado"
                                            defaultValue={formValues["status"]}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Serial</Label>
                                        <Input
                                            type="text"
                                            value={formValues["serial"]}
                                            onChange={(e) => handleInputChange("serial", e.target.value)}
                                            placeholder="Ingrese el serial del equipo"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Tipo de Mantenimiento</Label>
                                        <Select
                                            options={[
                                                { value: "PREVENTIVO", label: "Preventivo" },
                                                { value: "CORRECTIVO", label: "Correctivo" },
                                                { value: "PREDICTIVO", label: "Predictivo" }
                                            ]}
                                            onChange={(value) => handleInputChange("tipo_mantenimiento", value)}
                                            placeholder="Seleccione el tipo de mantenimiento"
                                            defaultValue={formValues["tipo_mantenimiento"]}
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label>Descripción</Label>
                                        <textarea
                                            className="w-full border rounded p-2"
                                            value={formValues["description"]}
                                            onChange={(e) => handleInputChange("description", e.target.value)}
                                            placeholder="Ingrese la descripción del problema"
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <h4 className="font-semibold mb-2">Historial de Respuestas:</h4>
                                    {responses.length === 0 ? (
                                        <p className="text-gray-500">Aún no hay respuestas.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {responses.map((response) => (
                                                <div key={response.id} className="border rounded-lg p-4 bg-gray-50">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {response.submission.map((sub, index) => (
                                                            <div key={index} className="space-y-1">
                                                                <span className="text-sm font-medium text-gray-500">{sub.label}:</span>
                                                                <p className="text-sm">{sub.value || "No especificado"}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <span className="font-medium text-gray-500">Técnico:</span>
                                                                <p>{response.tecnico || "No asignado"}</p>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-gray-500">Estado:</span>
                                                                <p>{response.status || "No especificado"}</p>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-gray-500">Serial:</span>
                                                                <p>{response.serial || "No especificado"}</p>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-gray-500">Tipo de Mantenimiento:</span>
                                                                <p>{response.tipo_mantenimiento || "No especificado"}</p>
                                                            </div>
                                                        </div>
                                                        {response.description && (
                                                            <div className="mt-2">
                                                                <span className="font-medium text-gray-500">Descripción:</span>
                                                                <p className="text-sm">{response.description}</p>
                                                            </div>
                                                        )}
                                                        <div className="mt-2 text-xs text-gray-400">
                                                            {new Date(response.created_at).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4">
                                    <textarea
                                        className="w-full border rounded p-2"
                                        placeholder="Escribe una respuesta..."
                                        value={newResponse}
                                        onChange={(e) => setNewResponse(e.target.value)}
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button
                                            onClick={handleSendResponse}
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                        >
                                            Enviar Respuesta
                                        </button>
                                        <button
                                            onClick={handleUpdateTicket}
                                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                        >
                                            Actualizar Ticket
                                        </button>
                                    </div>
                                </div>
                            </div>
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
        </>
    );
};

export default TicketModal;
