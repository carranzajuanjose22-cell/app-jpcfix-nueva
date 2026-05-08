import { LayoutDashboard, DollarSign, Wrench, Users } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const menuItems = [
    { id: 'tablero', label: 'Tablero', icon: LayoutDashboard },
    { id: 'finanzas', label: 'Finanzas', icon: DollarSign },
    { id: 'trabajos', label: 'Trabajos', icon: Wrench },
    { id: 'clientes', label: 'Clientes', icon: Users },
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 h-screen flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white">JPCFIX</h1>
        <p className="text-sm text-slate-400 mt-1">Servicio Técnico</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeView === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
