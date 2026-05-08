import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import FinancialSummary from './components/FinancialSummary';
import CollaborativeBoard from './components/CollaborativeBoard';
import TransactionHistory from './components/TransactionHistory';
import TransactionModal from './components/TransactionModal';
import WorksAndPayments from './components/WorksAndPayments';
import { turso } from './components/turso';

interface Transaction {
  id: string;
  type: 'ingreso' | 'egreso';
  amount: number;
  concept: string;
  paymentMethod: 'efectivo' | 'transferencia';
  date: string;
}

export default function App() {
  const [activeView, setActiveView] = useState('tablero');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'ingreso' | 'egreso'>('ingreso');

  const [saldoEfectivo, setSaldoEfectivo] = useState(0);
  const [saldoTransferencia, setSaldoTransferencia] = useState(0);
  const [cajaJpcfix, setCajaJpcfix] = useState(0);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);

  // Cargar datos desde Turso al montar el componente
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // 1. Nos aseguramos de que la tabla exista en Turso antes de intentar leerla
        await turso.execute(`
          CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            type TEXT,
            amount REAL,
            concept TEXT,
            paymentMethod TEXT,
            date TEXT
          );
        `);

        // 2. Traemos los datos
        const { rows } = await turso.execute('SELECT * FROM transactions ORDER BY date DESC');
        
        const loadedTransactions = rows.map((row: any) => ({
          id: String(row.id),
          type: row.type as 'ingreso' | 'egreso',
          amount: Number(row.amount),
          concept: String(row.concept),
          paymentMethod: row.paymentMethod as 'efectivo' | 'transferencia',
          date: String(row.date),
        }));

        setTransactions(loadedTransactions);

        // Recalcular saldos en base a las transacciones cargadas
        let calcEfectivo = 0;
        let calcTransferencia = 0;
        let calcCaja = 0;

        loadedTransactions.forEach(t => {
          if (t.type === 'ingreso') {
            if (t.paymentMethod === 'efectivo') calcEfectivo += t.amount;
            else calcTransferencia += t.amount;
            
            if (t.concept.includes('(con retención 30%)')) {
               calcCaja += (t.amount / 0.7) * 0.3;
            }
          } else {
            if (t.paymentMethod === 'efectivo') calcEfectivo -= t.amount;
            else calcTransferencia -= t.amount;
          }
        });

        setSaldoEfectivo(calcEfectivo);
        setSaldoTransferencia(calcTransferencia);
        setCajaJpcfix(calcCaja);

        setDbError(null);
        console.log('Datos de Turso cargados correctamente.');
      } catch (error: any) {
        setDbError(error.message || 'Error de conexión con la base de datos (NetworkError)');
        console.error('Error al obtener datos de Turso:', error);
      }
    };

    fetchTransactions();
  }, []);

  const handleNewTransaction = (transaction: {
    amount: number;
    concept: string;
    paymentMethod: 'efectivo' | 'transferencia';
    withRetention: boolean;
  }) => {
    let finalAmount = transaction.amount;
    let retentionAmount = 0;

    if (modalType === 'ingreso' && transaction.withRetention) {
      retentionAmount = transaction.amount * 0.3;
      finalAmount = transaction.amount * 0.7;
      setCajaJpcfix(cajaJpcfix + retentionAmount);
    }

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: modalType,
      amount: finalAmount,
      concept: transaction.withRetention
        ? `${transaction.concept} (con retención 30%)`
        : transaction.concept,
      paymentMethod: transaction.paymentMethod,
      date: new Date().toISOString().split('T')[0],
    };

    setTransactions([newTransaction, ...transactions]);

    // Guardar en Turso
    turso.execute({
      sql: 'INSERT INTO transactions (id, type, amount, concept, paymentMethod, date) VALUES (?, ?, ?, ?, ?, ?)',
      args: [newTransaction.id, newTransaction.type, newTransaction.amount, newTransaction.concept, newTransaction.paymentMethod, newTransaction.date]
    }).catch(err => console.error('Error guardando en Turso:', err));

    if (modalType === 'ingreso') {
      if (transaction.paymentMethod === 'efectivo') {
        setSaldoEfectivo(saldoEfectivo + finalAmount);
      } else {
        setSaldoTransferencia(saldoTransferencia + finalAmount);
      }
    } else {
      if (transaction.paymentMethod === 'efectivo') {
        setSaldoEfectivo(saldoEfectivo - finalAmount);
      } else {
        setSaldoTransferencia(saldoTransferencia - finalAmount);
      }
    }
  };

  const handleMarkAsPaid = (workId: string) => {
    console.log('Marcar como cobrado:', workId);
    setActiveView('finanzas');
    setModalType('ingreso');
    setModalOpen(true);
  };

  const openIngresoModal = () => {
    setModalType('ingreso');
    setModalOpen(true);
  };

  const openEgresoModal = () => {
    setModalType('egreso');
    setModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {dbError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <h3 className="text-red-500 font-semibold mb-1">Problema de conexión con la Base de Datos</h3>
              <p className="text-slate-300 text-sm">{dbError}</p>
              <p className="text-slate-400 text-xs mt-2">Sugerencia: Si usas Brave, apaga los escudos. Desactiva temporalmente bloqueadores como uBlock/AdBlock.</p>
            </div>
          )}

          {activeView === 'tablero' && (
            <>
              <FinancialSummary
                efectivo={saldoEfectivo}
                transferencia={saldoTransferencia}
                cajaJpcfix={cajaJpcfix}
              />
              <CollaborativeBoard />
            </>
          )}

          {activeView === 'finanzas' && (
            <>
              <FinancialSummary
                efectivo={saldoEfectivo}
                transferencia={saldoTransferencia}
                cajaJpcfix={cajaJpcfix}
              />
              <TransactionHistory
                transactions={transactions}
                onNewIngreso={openIngresoModal}
                onNewEgreso={openEgresoModal}
              />
            </>
          )}

          {activeView === 'trabajos' && (
            <WorksAndPayments onMarkAsPaid={handleMarkAsPaid} />
          )}

          {activeView === 'clientes' && (
            <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
              <h2 className="text-2xl font-semibold text-white mb-4">Módulo de Clientes</h2>
              <p className="text-slate-400">
                Esta sección estará disponible próximamente. Aquí podrás gestionar la información de tus clientes.
              </p>
            </div>
          )}
        </div>
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
        onSubmit={handleNewTransaction}
      />
    </div>
  );
}
