import { useState } from 'react';
import { X, Wallet, CreditCard, Briefcase, LayoutDashboard } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'ingreso' | 'egreso';
  onSubmit: (transaction: {
    amount: number;
    concept: string;
    paymentMethod: 'efectivo' | 'transferencia';
    withRetention: boolean;
    isCaja: boolean;
  }) => void;
}

export default function TransactionModal({ isOpen, onClose, type, onSubmit }: TransactionModalProps) {
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [withRetention, setWithRetention] = useState(false);
  const [account, setAccount] = useState<'general' | 'caja'>('general');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      amount: parseFloat(amount),
      concept,
      paymentMethod,
      withRetention: account === 'general' ? withRetention : false,
      isCaja: account === 'caja',
    });
    setAmount('');
    setConcept('');
    setPaymentMethod('efectivo');
    setWithRetention(false);
    setAccount('general');
    onClose();
  };

  const calculateDisplayAmount = () => {
    const baseAmount = parseFloat(amount) || 0;
    if (type === 'ingreso' && withRetention) {
      return baseAmount * 0.7;
    }
    return baseAmount;
  };

  const calculateRetentionAmount = () => {
    const baseAmount = parseFloat(amount) || 0;
    return baseAmount * 0.3;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            Nuevo {type === 'ingreso' ? 'Ingreso' : 'Egreso'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-3">Cuenta Destino / Origen</label>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <button
                type="button"
                onClick={() => setAccount('general')}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
                  account === 'general'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-500'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <LayoutDashboard size={20} />
                <span>General</span>
              </button>
              <button
                type="button"
                onClick={() => setAccount('caja')}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
                  account === 'caja'
                    ? 'bg-purple-600/20 border-purple-500 text-purple-500'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <Briefcase size={20} />
                <span>Caja JPCFIX</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Monto</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="$ 0"
              className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Concepto</label>
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Descripción del movimiento"
              className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-3">Método de Pago</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('efectivo')}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
                  paymentMethod === 'efectivo'
                    ? 'bg-green-600/20 border-green-500 text-green-500'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <Wallet size={20} />
                <span>Efectivo</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('transferencia')}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
                  paymentMethod === 'transferencia'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-500'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <CreditCard size={20} />
                <span>Transferencia</span>
              </button>
            </div>
          </div>

          {type === 'ingreso' && account === 'general' && (
            <div className="pt-4 border-t border-slate-700">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={withRetention}
                  onChange={(e) => setWithRetention(e.target.checked)}
                  className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-800"
                />
                <div className="flex-1">
                  <span className="text-white font-medium">Retención del 30%</span>
                  <p className="text-xs text-slate-400 mt-1">
                    Se guardará el 30% en Caja JPCFIX
                  </p>
                </div>
              </label>

              {withRetention && amount && (
                <div className="mt-4 p-3 bg-purple-600/10 border border-purple-500/30 rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Monto a registrar:</span>
                    <span className="text-white font-semibold">
                      ${calculateDisplayAmount().toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Retención (30%):</span>
                    <span className="text-purple-400 font-semibold">
                      ${calculateRetentionAmount().toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              type === 'ingreso'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            Registrar {type === 'ingreso' ? 'Ingreso' : 'Egreso'}
          </button>
        </form>
      </div>
    </div>
  );
}
