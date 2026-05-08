import { Wallet, CreditCard, Briefcase } from 'lucide-react';

interface FinancialSummaryProps {
  efectivo: number;
  transferencia: number;
  cajaJpcfix: number;
}

export default function FinancialSummary({ efectivo, transferencia, cajaJpcfix }: FinancialSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-400 text-sm">Saldo en Efectivo</span>
          <Wallet className="text-green-500" size={24} />
        </div>
        <div className="text-3xl font-bold text-white">{formatCurrency(efectivo)}</div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-400 text-sm">Saldo en Transferencia</span>
          <CreditCard className="text-blue-500" size={24} />
        </div>
        <div className="text-3xl font-bold text-white">{formatCurrency(transferencia)}</div>
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
