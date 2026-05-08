import { useState } from 'react';
import { turso } from './turso'; // Importar la instancia de Turso

interface LoginProps {
  onLogin: (user: { username: string; role: string }) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState(''); // Nuevo estado para el usuario
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Para feedback visual

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username || !password) {
      setError('Por favor, ingresa usuario y contraseña.');
      setIsLoading(false);
      return;
    }

    try {
      // NOTA DE SEGURIDAD: ¡Esto es solo para el ejemplo!
      // Nunca debes guardar contraseñas en texto plano en una base de datos.
      // Investiga sobre "hashing" de contraseñas (ej. con bcrypt) para una implementación real.

      // 1. Asegurarse de que la tabla de usuarios exista (opcional, bueno para el primer uso)
      await turso.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL
        );
      `);

      try {
        // Intentar agregar la columna 'role' para preparar el terreno a futuros permisos.
        await turso.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
      } catch (e) {
        // Si la columna ya existe, SQLite arrojará un error que podemos ignorar con seguridad.
      }

      // 1.5 Insertar los dos usuarios principales con rol de 'admin' si no existen.
      // Cambia "juan" y "pedro" (y sus contraseñas) por los nombres de pila reales de ustedes.
      await turso.execute({
        sql: 'INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)',
        args: ['juanjo', 'juanjo123', 'admin'],
      });
      await turso.execute({
        sql: 'INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)',
        args: ['mateo', 'mateo123', 'admin'],
      });

      // 2. Buscar al usuario en la base de datos
      const { rows } = await turso.execute({
        sql: 'SELECT * FROM users WHERE username = ? AND password = ?',
        args: [username, password],
      });

      if (rows.length > 0) {
        // Usuario y contraseña correctos
        const user = rows[0];
        onLogin({
          username: String(user.username),
          role: String(user.role || 'user'),
        });
      } else {
        // Credenciales incorrectas
        setError('Usuario o contraseña incorrectos.');
      }
    } catch (err) {
      console.error('Error de base de datos durante el login:', err);
      setError('Hubo un problema al intentar iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-950">
      <div className="bg-slate-900 p-8 rounded-xl shadow-lg border border-slate-800 w-full max-w-md">
        <div className="flex justify-center mb-2"> 
          {/* Logo de JPCFix en la pantalla de inicio de sesión, ajustado a un tamaño válido de Tailwind (h-32) */}
          <img src="/jpcfix-logo.png" alt="Logo JPCFix" className="h-32 w-auto" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Iniciar Sesión
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-slate-400 mb-2 text-sm">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="Ingresa tu usuario"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-2 text-sm">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="Ingresa tu contraseña"
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}