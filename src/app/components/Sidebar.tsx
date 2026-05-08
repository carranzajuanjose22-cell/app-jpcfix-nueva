import { LayoutDashboard, DollarSign, Wrench, Users, Shield, LogOut } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  userRole?: string;
  onLogout?: () => void;
}

export default function Sidebar({ activeView, onViewChange, userRole, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'tablero', label: 'Tablero', icon: LayoutDashboard },
    ...(userRole === 'admin' ? [{ id: 'finanzas', label: 'Finanzas', icon: DollarSign }] : []),
    { id: 'trabajos', label: 'Trabajos', icon: Wrench },
    { id: 'clientes', label: 'Clientes', icon: Users },
    ...(userRole === 'admin' ? [{ id: 'usuarios', label: 'Usuarios', icon: Shield }] : []),
  ];

  return (
    <div className="w-full md:w-64 bg-slate-900 md:border-r border-t md:border-t-0 border-slate-800 md:h-screen flex md:flex-col z-10">
      <div className="hidden md:block p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white">JPCFIX</h1>
        <p className="text-sm text-slate-400 mt-1">Servicio Técnico</p>
      </div>

      <nav className="flex-1 flex md:flex-col justify-around md:justify-start p-1 md:p-4 md:space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-2 md:px-4 py-2 rounded-lg transition-all text-center md:text-left md:w-full ${
                activeView === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs md:text-base">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="hidden md:block p-6 mt-auto border-t border-slate-800">
        <button onClick={onLogout} className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors w-full">
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
