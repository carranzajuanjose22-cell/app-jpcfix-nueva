import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import FinancialSummary from './components/FinancialSummary';
import CollaborativeBoard from './components/CollaborativeBoard';
import TransactionHistory from './components/TransactionHistory';
import TransactionModal from './components/TransactionModal';
import WorksAndPayments from './components/WorksAndPayments';
import Clients from './components/Clients';
import { turso } from './components/turso';
import Login from './components/Login';
import UsersManagement from './components/UsersManagement';

interface Transaction {
  id: string;
  type: 'ingreso' | 'egreso';
  amount: number;
  concept: string;
  paymentMethod: 'efectivo' | 'transferencia';
  date: string;
}

export default function App() {
  // Recuperar la sesión del localStorage si existe
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!!currentUser);
  
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
        if (!isAuthenticated) return; // Evitar llamadas si no está autenticado

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
          // Si es un movimiento directo de caja, solo afecta a la caja
          if (t.concept.includes('[CAJA]')) {
            if (t.type === 'ingreso') calcCaja += t.amount;
            else calcCaja -= t.amount;
          } else {
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
  }, [isAuthenticated]); // Se vuelve a ejecutar cuando el usuario inicia sesión

  const handleNewTransaction = (transaction: {
    amount: number;
    concept: string;
    paymentMethod: 'efectivo' | 'transferencia';
    withRetention: boolean;
    isCaja?: boolean;
  }) => {
    let finalAmount = transaction.amount;
    let retentionAmount = 0;
    let finalConcept = transaction.concept;

    if (transaction.isCaja) {
      finalConcept = `[CAJA] ${finalConcept}`;
    } else if (modalType === 'ingreso' && transaction.withRetention) {
      retentionAmount = transaction.amount * 0.3;
      finalAmount = transaction.amount * 0.7;
      setCajaJpcfix(cajaJpcfix + retentionAmount);
    }

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: modalType,
      amount: finalAmount,
      concept: (modalType === 'ingreso' && transaction.withRetention && !transaction.isCaja)
        ? `${finalConcept} (con retención 30%)`
        : finalConcept,
      paymentMethod: transaction.paymentMethod,
      date: new Date().toISOString().split('T')[0],
    };

    setTransactions([newTransaction, ...transactions]);

    // Guardar en Turso
    turso.execute({
      sql: 'INSERT INTO transactions (id, type, amount, concept, paymentMethod, date) VALUES (?, ?, ?, ?, ?, ?)',
      args: [newTransaction.id, newTransaction.type, newTransaction.amount, newTransaction.concept, newTransaction.paymentMethod, newTransaction.date]
    }).catch(err => console.error('Error guardando en Turso:', err));

    // Actualizamos los saldos locales según la cuenta seleccionada
    if (transaction.isCaja) {
      if (modalType === 'ingreso') setCajaJpcfix(cajaJpcfix + finalAmount);
      else setCajaJpcfix(cajaJpcfix - finalAmount);
    } else {
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

  const handleLogin = (user: { username: string; role: string }) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
    setActiveView('tablero');
  };

  // Si no está autenticado, renderizamos solo el componente Login
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col-reverse md:flex-row h-screen bg-slate-950">
      <Sidebar activeView={activeView} onViewChange={setActiveView} userRole={currentUser?.role} onLogout={handleLogout} />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 pb-20 md:pb-8">
          {dbError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <h3 className="text-red-500 font-semibold mb-1">Problema de conexión con la Base de Datos</h3>
              <p className="text-slate-300 text-sm">{dbError}</p>
              <p className="text-slate-400 text-xs mt-2">Sugerencia: Si usas Brave, apaga los escudos. Desactiva temporalmente bloqueadores como uBlock/AdBlock.</p>
            </div>
          )}

          {activeView === 'tablero' && (
            <>
              <CollaborativeBoard currentUser={currentUser} />
            </>
          )}

          {activeView === 'finanzas' && currentUser?.role === 'admin' && (
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
            <Clients />
          )}

          {activeView === 'usuarios' && currentUser?.role === 'admin' && (
            <UsersManagement />
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
