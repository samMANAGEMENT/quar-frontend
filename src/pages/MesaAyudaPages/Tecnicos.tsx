import { useEffect, useState } from "react";
import axios from "../../lib/axios";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import DataTable from "../../components/common/DataTable";
import Button from "../../components/ui/button/Button";
import { Plus, X, Pencil } from "lucide-react";
import moment from "moment";

// Configurar moment en español
moment.locale("es");

// Tipo de dato esperado para un técnico
interface Tecnico {
  id: number;
  name: string;
  email: string;
  profile_photo_url: string;
  created_at: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  id_user: number;
}

// Columnas para el DataTable
const columnasTecnicos = [
  {
    header: "ID",
    accessor: "id" as keyof Tecnico,
  },
  {
    header: "Nombre",
    accessor: "name" as keyof Tecnico,
  },
  {
    header: "Email",
    accessor: "email" as keyof Tecnico,
  },
  {
    header: "Fecha de Creación",
    accessor: "created_at" as keyof Tecnico,
    cellRenderer: (value: string) => moment(value).format("DD [de] MMMM [de] YYYY, h:mm a"),
  },
];

export default function Tecnicos() {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    id_user: Number(localStorage.getItem("id")) || 0,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleEditTecnico = (tecnico: Tecnico) => {
    setIsEditing(true);
    setFormData({
      name: tecnico.name,
      email: tecnico.email,
      password: "",
      password_confirmation: "",
      id_user: Number(localStorage.getItem("id")) || 0,
    });
    setIsModalOpen(true);
  };

  const columnasTecnicosConAcciones = [
    ...columnasTecnicos,
    {
      header: "Acciones",
      accessor: "id" as keyof Tecnico,
      cellRenderer: (_: number, row: Tecnico) => (
        <Button
          size="xs"
          variant="outline"
          onClick={() => handleEditTecnico(row)}
          className="text-blue-600 hover:text-blue-800"
        >
          <Pencil className="h-2 w-4" />
        </Button>
      ),
    },
  ];

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
      } catch (err: any) {    
        console.error("Error al obtener técnicos:", err);
        setError("No se pudieron cargar los técnicos.");
      } finally {
        setLoading(false);
      }
    };

    fetchTecnicos();
  }, []);

  const handleAgregarTecnico = () => {
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setFormData({
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
      id_user: Number(localStorage.getItem("id")) || 0,
    });
    setFormError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      const token = localStorage.getItem("token");
      if (isEditing) {
        // Lógica para actualizar técnico
        await axios.put(`/update-tecnico/${formData.id_user}`, formData, {
          headers: {
            "Authorization": token,
            "Content-Type": "application/json",
          },
        });
      } else {
        // Lógica para crear técnico
        await axios.post("/register", formData, {
          headers: {
            "Authorization": token,
            "Content-Type": "application/json",
          },
        });
      }

      // Recargar la lista de técnicos
      const response = await axios.get("/get-tecnicos", {
        headers: {
          "Authorization": token,
        },
      });
      setTecnicos(response.data);
      
      handleCloseModal();
    } catch (err: any) {
      console.error("Error al procesar técnico:", err);
      setFormError(err.response?.data?.message || "Error al procesar el técnico");
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Técnicos" />
      <div className="space-y-6">
        <ComponentCard title="Gestionar Técnicos">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end mb-4">
              <Button size="sm" onClick={handleAgregarTecnico} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Agregar Técnico
              </Button>
            </div>
            {loading ? (
              <span className="text-gray-500">Cargando técnicos...</span>
            ) : error ? (
              <span className="text-red-500">{error}</span>
            ) : (
              <DataTable columns={columnasTecnicosConAcciones} data={tecnicos} />
            )}
          </div>
        </ComponentCard>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center backdrop-blur-md bg-white/30 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {isEditing ? "Editar Técnico" : "Agregar Nuevo Técnico"}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Confirmar Contraseña</label>
                <input
                  type="password"
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required={!isEditing}
                />
              </div>

              {formError && (
                <div className="text-red-500 text-sm">{formError}</div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </Button>
                <Button size="sm">
                  {isEditing ? "Actualizar" : "Guardar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
