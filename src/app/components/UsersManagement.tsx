import { useState, useEffect } from 'react';
import { Shield, Plus, Trash2 } from 'lucide-react';
import { turso } from './turso';

interface User {
  id: string;
  username: string;
  role: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { rows } = await turso.execute('SELECT * FROM users ORDER BY username ASC');
        const loadedUsers = rows.map((row: any) => ({
          id: String(row.id),
          username: String(row.username),
          role: String(row.role || 'user') // Fallback por seguridad
        }));
        setUsers(loadedUsers);
      } catch (error) {
        console.error('Error cargando usuarios:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string;

    try {
      await turso.execute({
        sql: 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        args: [username, password, role]
      });
      
      // Consultamos de nuevo para obtener el ID real insertado por SQLite
      const { rows } = await turso.execute({
        sql: 'SELECT * FROM users WHERE username = ?',
        args: [username]
      });

      if (rows.length > 0) {
        const newUser: User = {
          id: String(rows[0].id),
          username: String(rows[0].username),
          role: String(rows[0].role),
        };
        setUsers([...users, newUser].sort((a, b) => a.username.localeCompare(b.username)));
        setIsAdding(false);
      }
    } catch (error: any) {
      console.error('Error guardando usuario:', error);
      setError('No se pudo guardar. Es posible que el nombre de usuario ya exista.');
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar al usuario "${username}"?`)) return;
    
    try {
      await turso.execute({
        sql: 'DELETE FROM users WHERE id = ?',
        args: [id]
      });
      setUsers(users.filter(u => u.id !== id));
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      alert('Hubo un error al intentar eliminar el usuario.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Shield className="text-purple-500" size={24} />
          <h2 className="text-xl font-semibold text-white">Gestión de Usuarios</h2>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
          <Plus size={20} /> Nuevo Usuario
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddUser} className="bg-slate-800 rounded-xl p-6 border border-purple-500 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div><label className="block text-sm text-slate-400 mb-2">Nombre de Pila</label><input name="username" required placeholder="Ej: juan" className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-purple-500 outline-none" /></div>
            <div><label className="block text-sm text-slate-400 mb-2">Contraseña</label><input name="password" type="password" required placeholder="Contraseña" className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-purple-500 outline-none" /></div>
            <div><label className="block text-sm text-slate-400 mb-2">Rol / Permisos</label><select name="role" className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-purple-500 outline-none"><option value="admin">Administrador (Todos los permisos)</option><option value="user">Técnico Limitado</option></select></div>
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Guardar Usuario</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <div key={user.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-slate-600 transition-colors group"><div className="flex items-start justify-between mb-2"><h3 className="font-semibold text-lg text-white capitalize">{user.username}</h3><button onClick={() => handleDeleteUser(user.id, user.username)} className="text-slate-500 hover:text-red-500 p-1 rounded hover:bg-slate-700 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all" title="Eliminar usuario"><Trash2 size={18} /></button></div><div className="space-y-2 mt-4"><div className="flex items-center gap-2"><span className={`px-2 py-1 text-xs rounded-full font-medium ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>{user.role === 'admin' ? 'Administrador' : 'Técnico'}</span></div></div></div>
        ))}
      </div>
    </div>
  );
}