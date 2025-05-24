import { useEffect, useState } from "react";
import axios from "../../lib/axios";
import { Dialog } from "@headlessui/react";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Select from "../form/Select";
import { Toaster, toast } from "react-hot-toast";
import DataTable from "../common/DataTable";

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

const StatusIndicator = ({ status }: { status: string | null }) => {
    const getStatusColor = (status: string | null) => {
        switch (status) {
            case "Pendiente":
                return "bg-yellow-500";
            case "En progreso":
                return "bg-blue-500";
            case "Completado":
                return "bg-green-500";
            case "Cancelado":
                return "bg-red-500";
            default:
                return "bg-gray-500";
        }
    };

    return (
        <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
            <span className="text-sm">{status || "No especificado"}</span>
        </div>
    );
};

const TicketModal = ({ ticketId, onClose }: TicketModalProps) => {
    const [responses, setResponses] = useState<TicketResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedResponse, setSelectedResponse] = useState<TicketResponse | null>(null);
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

    const handleUpdateTicket = async () => {
        if (!selectedResponse) return;
        try {
            await axios.patch(`/ticket-submissions/${selectedResponse.id}`, {
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
            setSelectedResponse(null);
        } catch (error) {
            console.error("Error al actualizar el ticket:", error);
            toast.error("Error al actualizar el ticket");
        }
    };

    const columns = [
        {
            header: "ID",
            accessor: "id" as keyof TicketResponse,
        },
        {
            header: "Estado",
            accessor: "status" as keyof TicketResponse,
            cellRenderer: (value: string | null) => <StatusIndicator status={value} />
        },
        {
            header: "Técnico",
            accessor: "tecnico" as keyof TicketResponse,
            cellRenderer: (value: string | null) => value || "No asignado"
        },
        {
            header: "Tipo Mantenimiento",
            accessor: "tipo_mantenimiento" as keyof TicketResponse,
            cellRenderer: (value: string | null) => value || "No especificado"
        },
        {
            header: "Fecha de creación",
            accessor: "created_at" as keyof TicketResponse,
            cellRenderer: (value: string) => new Date(value).toLocaleString()
        },
        {
            header: "Fecha de actualización",
            accessor: "updated_at" as keyof TicketResponse,
            cellRenderer: (value: string) => new Date(value).toLocaleString()
        }
    ];

    return (
        <>
            <Toaster position="top-right" />
            <Dialog open={true} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen px-4">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                    <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full z-10 p-6">
                        <Dialog.Title className="text-xl font-semibold mb-4">Formulario #{ticketId}</Dialog.Title>
                        {loading ? (
                            <p>Cargando...</p>
                        ) : (
                            <div className="mt-4 space-y-6">
                                {!selectedResponse ? (
                                    <DataTable
                                        columns={columns}
                                        data={responses}
                                        className="cursor-pointer"
                                        onRowClick={(row) => {
                                            setSelectedResponse(row);
                                            setFormValues({
                                                tecnico: row.tecnico || "",
                                                status: row.status || "",
                                                serial: row.serial || "",
                                                description: row.description || "",
                                                tipo_mantenimiento: row.tipo_mantenimiento || ""
                                            });
                                        }}
                                    />
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg font-semibold">Detalles del Ticket #{selectedResponse.id}</h3>
                                            <button
                                                onClick={() => setSelectedResponse(null)}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                Volver a la lista
                                            </button>
                                        </div>

                                        {/* Sección de información del formulario */}
                                        <div className="bg-gray-50 rounded-lg p-6 mb-6">
                                            <h4 className="text-lg font-semibold mb-4 text-gray-800">Respuesta del Formulario</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {selectedResponse.submission.map((item, index) => (
                                                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                                                        <p className="text-sm font-medium text-gray-500 mb-1">{item.label}</p>
                                                        <p className="text-base text-gray-800">{item.value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={handleUpdateTicket}
                                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                            >
                                                Actualizar Ticket
                                            </button>
                                        </div>
                                    </div>
                                )}
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
