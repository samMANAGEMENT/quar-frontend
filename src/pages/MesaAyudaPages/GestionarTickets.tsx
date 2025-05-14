import { useEffect, useState } from "react";
import axios from "../../lib/axios";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { HiClipboardList, HiPencilAlt, HiExternalLink } from "react-icons/hi";
import TicketModal from "../../components/gestionTicket/TicketModal";

interface Ticket {
  id: number;
  title: string;
  created_at: string;
  status: string;
}

const GestionarTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [editingTicketId, setEditingTicketId] = useState<number | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await axios.get("/templates");
        setTickets(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error al obtener los tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  return (
    <div>
      <PageBreadcrumb pageTitle="Gestión de Tickets" />
      <div className="flex flex-wrap gap-6">
        {loading ? (
          <p>Cargando tickets...</p>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicketId(ticket.id)}
              className="relative cursor-pointer w-full sm:w-[250px] bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col items-center text-center border border-gray-200"
            >
              {/* Icono de editar */}
              <HiPencilAlt
                className="absolute top-2 right-2 text-yellow-500 hover:text-yellow-600 text-xl cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingTicketId(ticket.id);
                }}
              />

              <a
                href={`https://service.quar.com.co/ver-ticket?id=${ticket.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-2 left-2"
                onClick={(e) => e.stopPropagation()}
              >
                <HiExternalLink className="text-green-500 hover:text-green-600 text-xl" />
              </a>

              <HiClipboardList className="text-blue-400 text-6xl mb-4 hover:text-blue-600" />
              <h3 className="text-xl font-semibold">Ticket #{ticket.id}</h3>
              <p className="text-gray-500 mt-1 text-sm">{ticket.title}</p>
              <span className={`mt-2 px-3 py-1 rounded-full text-sm ${ticket.status === 'abierto' ? 'bg-green-100 text-green-800' :
                  ticket.status === 'cerrado' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                }`}>
                {ticket.status}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Aquí puedes agregar los modales de detalle y edición cuando los necesites */}
      {selectedTicketId && (
        <div>
          <TicketModal
            ticketId={selectedTicketId}
            onClose={() => setSelectedTicketId(null)}
          />
        </div>
      )}

      {editingTicketId && (
        <div>
          {/* Implementar TicketEditor */}
        </div>
      )}
    </div>
  );
};

export default GestionarTickets;
