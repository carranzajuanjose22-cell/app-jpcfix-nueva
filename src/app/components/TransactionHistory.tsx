import { TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'ingreso' | 'egreso';
  amount: number;
  concept: string;
  paymentMethod: 'efectivo' | 'transferencia';
  date: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  onNewIngreso: () => void;
  onNewEgreso: () => void;
}

export default function TransactionHistory({ transactions, onNewIngreso, onNewEgreso }: TransactionHistoryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Movimientos Recientes</h2>
        <div className="flex gap-3">
          <button
            onClick={onNewIngreso}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <TrendingUp size={18} />
            Nuevo Ingreso
          </button>
          <button
            onClick={onNewEgreso}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <TrendingDown size={18} />
            Nuevo Egreso
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {transactions.slice(0, 10).map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700"
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-2 rounded-lg ${
                  transaction.type === 'ingreso' ? 'bg-green-600/20' : 'bg-red-600/20'
                }`}
              >
                {transaction.type === 'ingreso' ? (
                  <TrendingUp className="text-green-500" size={20} />
                ) : (
                  <TrendingDown className="text-red-500" size={20} />
                )}
              </div>
              <div>
                <div className="text-white font-medium">{transaction.concept}</div>
                <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                  {transaction.paymentMethod === 'efectivo' ? (
                    <Wallet size={14} />
                  ) : (
                    <CreditCard size={14} />
                  )}
                  <span>{transaction.paymentMethod === 'efectivo' ? 'Efectivo' : 'Transferencia'}</span>
                  <span>•</span>
                  <span>{new Date(transaction.date).toLocaleDateString('es-AR')}</span>
                </div>
              </div>
            </div>
            <div
              className={`text-lg font-semibold ${
                transaction.type === 'ingreso' ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {transaction.type === 'ingreso' ? '+' : '-'} {formatCurrency(transaction.amount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
