import { useState, useEffect } from 'react';
import { Wrench, AlertCircle, CheckCircle2, Clock, Plus } from 'lucide-react';
import { turso } from './turso';

interface Work {
  id: string;
  client: string;
  type: string;
  status: 'en-progreso' | 'finalizado' | 'pendiente';
  amount?: number;
}

interface WorksAndPaymentsProps {
  onMarkAsPaid: (workId: string) => void;
}

export default function WorksAndPayments({ onMarkAsPaid }: WorksAndPaymentsProps) {
  const [pendingWorks, setPendingWorks] = useState<Work[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Work[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // Turso se encarga de todo el SQL automáticamente
  useEffect(() => {
    const fetchWorks = async () => {
      try {
        await turso.execute(`
          CREATE TABLE IF NOT EXISTS works (
            id TEXT PRIMARY KEY,
            client TEXT,
            type TEXT,
            status TEXT,
            amount REAL
          );
        `);

        const { rows } = await turso.execute('SELECT * FROM works ORDER BY id DESC');
        const loadedWorks = rows.map((row: any) => ({
          id: String(row.id),
          client: String(row.client),
          type: String(row.type),
          status: row.status as Work['status'],
          amount: row.amount ? Number(row.amount) : undefined
        }));

        setPendingWorks(loadedWorks.filter(w => w.status !== 'finalizado'));
        setPendingPayments(loadedWorks.filter(w => w.status === 'finalizado'));
      } catch (error) {
        console.error('Error cargando trabajos desde Turso:', error);
      }
    };
    fetchWorks();
  }, []);

  const handleAddWork = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newWork: Work = {
      id: Date.now().toString(),
      client: formData.get('client') as string,
      type: formData.get('type') as string,
      status: formData.get('status') as Work['status'],
      amount: Number(formData.get('amount')) || 0,
    };

    if (newWork.status === 'finalizado') {
      setPendingPayments([newWork, ...pendingPayments]);
    } else {
      setPendingWorks([newWork, ...pendingWorks]);
    }
    setIsAdding(false);

    // Guardar en Turso sin tocar panel externo
    try {
      await turso.execute({
        sql: 'INSERT INTO works (id, client, type, status, amount) VALUES (?, ?, ?, ?, ?)',
        args: [newWork.id, newWork.client, newWork.type, newWork.status, newWork.amount]
      });
    } catch (error) {
      console.error('Error guardando trabajo en Turso:', error);
    }
  };

  const handlePaymentClick = async (workId: string) => {
    onMarkAsPaid(workId);
    setPendingPayments(pendingPayments.filter(w => w.id !== workId));
    
    try {
      await turso.execute({
        sql: 'DELETE FROM works WHERE id = ?',
        args: [workId]
      });
    } catch (error) {
      console.error('Error eliminando trabajo en Turso:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en-progreso':
        return 'text-blue-500 bg-blue-600/20';
      case 'pendiente':
        return 'text-yellow-500 bg-yellow-600/20';
      case 'finalizado':
        return 'text-green-500 bg-green-600/20';
      default:
        return 'text-slate-500 bg-slate-600/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'en-progreso':
        return <Clock size={16} />;
      case 'pendiente':
        return <AlertCircle size={16} />;
      case 'finalizado':
        return <CheckCircle2 size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Registrar Trabajo
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddWork} className="bg-slate-800 rounded-xl p-6 border border-blue-500 shadow-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Cliente</label>
              <input name="client" required placeholder="Nombre del cliente" className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Tipo de Trabajo</label>
              <input name="type" required placeholder="Ej: Reparación PC" className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Estado</label>
              <select name="status" className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-blue-500 outline-none">
                <option value="pendiente">Pendiente</option>
                <option value="en-progreso">En Progreso</option>
                <option value="finalizado">Finalizado (Cobro Pendiente)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Presupuesto ($)</label>
              <input name="amount" type="number" placeholder="Ej: 25000" className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-blue-500 outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-2 mb-6">
            <Wrench className="text-blue-500" size={24} />
            <h2 className="text-xl font-semibold text-white">Trabajos Pendientes</h2>
          </div>
          <div className="space-y-3">
            {pendingWorks.map((work) => (
              <div
                key={work.id}
                className="p-4 bg-slate-900 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-white font-medium">{work.client}</div>
                    <div className="text-sm text-slate-400 mt-1">{work.type}</div>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${getStatusColor(work.status)}`}>
                    {getStatusIcon(work.status)}
                    <span>{work.status === 'en-progreso' ? 'En Progreso' : 'Pendiente'}</span>
                  </div>
                </div>
              </div>
            ))}
            {pendingWorks.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-sm">No hay trabajos pendientes.</div>
            )}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle className="text-red-500" size={24} />
            <h2 className="text-xl font-semibold text-white">Cobros Pendientes</h2>
          </div>
          <div className="space-y-3">
            {pendingPayments.map((work) => (
              <div
                key={work.id}
                className="p-4 bg-slate-900 rounded-lg border-l-4 border-red-500"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="text-white font-medium">{work.client}</div>
                    <div className="text-sm text-slate-400 mt-1">{work.type}</div>
                    <div className="text-lg font-semibold text-green-500 mt-2">
                      {formatCurrency(work.amount || 0)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handlePaymentClick(work.id)}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Marcar como Cobrado
                </button>
              </div>
            ))}
            {pendingPayments.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-sm">No hay cobros pendientes.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
