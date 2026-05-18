import { Wallet, CreditCard, Briefcase, CheckCheck } from 'lucide-react';

interface FinancialSummaryProps {
  efectivo: number;
  transferencia: number;
  cajaJpcfix: number;
  onLiquidate?: (method: 'efectivo' | 'transferencia', amount: number) => void;
}

export default function FinancialSummary({ efectivo, transferencia, cajaJpcfix, onLiquidate }: FinancialSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleLiquidate = (method: 'efectivo' | 'transferencia', amount: number) => {
    if (window.confirm(`¿Estás seguro que deseas liquidar el saldo de ${formatCurrency(amount)} en ${method}? Esto registrará un egreso y dejará el saldo en 0.`)) {
      onLiquidate?.(method, amount);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-400 text-sm">Saldo en Efectivo</span>
          <Wallet className="text-green-500" size={24} />
        </div>
        <div className="flex items-end justify-between">
          <div className="text-3xl font-bold text-white">{formatCurrency(efectivo)}</div>
          {efectivo > 0 && (
            <button
              onClick={() => handleLiquidate('efectivo', efectivo)}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
              title="Liquidar saldo en efectivo"
            >
              <CheckCheck size={16} />
              Liquidar
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-400 text-sm">Saldo en Transferencia</span>
          <CreditCard className="text-blue-500" size={24} />
        </div>
        <div className="flex items-end justify-between">
          <div className="text-3xl font-bold text-white">{formatCurrency(transferencia)}</div>
          {transferencia > 0 && (
            <button
              onClick={() => handleLiquidate('transferencia', transferencia)}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
              title="Liquidar saldo en transferencia"
            >
              <CheckCheck size={16} />
              Liquidar
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-purple-500">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-400 text-sm">Caja JPCFIX</span>
          <Briefcase className="text-purple-500" size={24} />
        </div>
        <div className="text-3xl font-bold text-white">{formatCurrency(cajaJpcfix)}</div>
      </div>
    </div>
  );
}
