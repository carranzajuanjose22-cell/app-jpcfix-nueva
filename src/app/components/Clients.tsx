import { useState, useEffect } from 'react';
import { Users, Phone, MapPin, Plus, Trash2 } from 'lucide-react';
import { turso } from './turso';

interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // Cargar clientes desde Turso
  useEffect(() => {
    const fetchClients = async () => {
      try {
        await turso.execute(`
          CREATE TABLE IF NOT EXISTS clients (
            id TEXT PRIMARY KEY,
            name TEXT,
            phone TEXT,
            address TEXT
          );
        `);

        const { rows } = await turso.execute('SELECT * FROM clients ORDER BY name ASC');
        const loadedClients = rows.map((row: any) => ({
          id: String(row.id),
          name: String(row.name),
          phone: String(row.phone),
          address: String(row.address)
        }));
        setClients(loadedClients);
      } catch (error) {
        console.error('Error cargando clientes desde Turso:', error);
      }
    };
    fetchClients();
  }, []);

  // Agregar nuevo cliente
  const handleAddClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newClient: Client = {
      id: Date.now().toString(),
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
    };

    // Actualizamos UI y ordenamos alfabéticamente
    const updatedClients = [newClient, ...clients].sort((a, b) => a.name.localeCompare(b.name));
    setClients(updatedClients);
    setIsAdding(false);

    // Guardar en la nube
    try {
      await turso.execute({
        sql: 'INSERT INTO clients (id, name, phone, address) VALUES (?, ?, ?, ?)',
        args: [newClient.id, newClient.name, newClient.phone, newClient.address]
      });
    } catch (error) {
      console.error('Error guardando cliente en Turso:', error);
    }
  };

  // Eliminar cliente
  const handleDeleteClient = async (id: string) => {
    setClients(clients.filter(c => c.id !== id));
    try {
      await turso.execute({
        sql: 'DELETE FROM clients WHERE id = ?',
        args: [id]
      });
    } catch (error) {
      console.error('Error eliminando cliente en Turso:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="text-blue-500" size={24} />
          <h2 className="text-xl font-semibold text-white">Directorio de Clientes</h2>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddClient} className="bg-slate-800 rounded-xl p-6 border border-blue-500 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Nombre / Empresa</label>
              <input name="name" required placeholder="Ej: Juan Pérez" className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Teléfono</label>
              <input name="phone" required placeholder="Ej: 11 1234-5678" className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Dirección</label>
              <input name="address" placeholder="Ej: Av. Rivadavia 123" className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-blue-500 outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar Cliente</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <div key={client.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-slate-600 transition-colors group">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-lg text-white">{client.name}</h3>
              <button
                onClick={() => handleDeleteClient(client.id)}
                className="text-slate-500 hover:text-red-500 p-1 rounded hover:bg-slate-700 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                title="Eliminar cliente"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-slate-300">
                <Phone size={16} className="text-slate-500" />
                <span className="text-sm">{client.phone}</span>
              </div>
              {client.address && (
                <div className="flex items-start gap-3 text-slate-300">
                  <MapPin size={16} className="text-slate-500 shrink-0 mt-0.5" />
                  <span className="text-sm">{client.address}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {clients.length === 0 && !isAdding && (
          <div className="col-span-full text-center py-10 text-slate-500">
            No hay clientes registrados aún.
          </div>
        )}
      </div>
    </div>
  );
}