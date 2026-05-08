import { useState, useEffect } from 'react';
import { Plus, Clock, AlertCircle, User, Trash2 } from 'lucide-react';
import { turso } from './turso';

interface Note {
  id: string;
  title: string;
  description: string;
  author: string;
  date: string;
  urgent: boolean;
}

export default function CollaborativeBoard() {
  const [notes, setNotes] = useState<Note[]>([]);

  const [isAdding, setIsAdding] = useState(false);

  // Traer las notas de Turso al cargar el componente
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        await turso.execute(`
          CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            title TEXT,
            description TEXT,
            author TEXT,
            date TEXT,
            urgent INTEGER
          );
        `);

        const { rows } = await turso.execute('SELECT * FROM notes ORDER BY date DESC');
        const loadedNotes = rows.map((row: any) => ({
          id: String(row.id),
          title: String(row.title),
          description: String(row.description),
          author: String(row.author),
          date: String(row.date),
          urgent: Boolean(row.urgent) // Turso guarda los booleanos como 1 o 0
        }));
        setNotes(loadedNotes);
      } catch (error) {
        console.error('Error cargando notas desde Turso:', error);
      }
    };
    fetchNotes();
  }, []);

  // Guardar nueva nota en la BD
  const handleSaveNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newNote: Note = {
      id: Date.now().toString(),
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      author: 'Yo', // Aquí más adelante podemos poner el usuario actual
      date: new Date().toISOString().split('T')[0],
      urgent: formData.get('urgent') === 'on',
    };

    // Actualizamos la interfaz inmediatamente (optimista)
    setNotes([newNote, ...notes]);
    setIsAdding(false);

    // Enviamos a la nube
    try {
      await turso.execute({
        sql: 'INSERT INTO notes (id, title, description, author, date, urgent) VALUES (?, ?, ?, ?, ?, ?)',
        args: [newNote.id, newNote.title, newNote.description, newNote.author, newNote.date, newNote.urgent ? 1 : 0]
      });
    } catch (error) {
      console.error('Error guardando nota en Turso:', error);
    }
  };

  // Eliminar nota de la BD
  const handleDeleteNote = async (id: string) => {
    // 1. Actualizamos la interfaz primero para que se sienta instantáneo
    setNotes(notes.filter(note => note.id !== id));
    
    // 2. Ejecutamos el borrado en Turso
    try {
      await turso.execute({
        sql: 'DELETE FROM notes WHERE id = ?',
        args: [id]
      });
    } catch (error) {
      console.error('Error eliminando nota en Turso:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Tablero Colaborativo</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Nueva Nota
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSaveNote} className="bg-slate-800 rounded-lg p-4 border border-blue-500 shadow-lg shadow-blue-500/10">
          <input name="title" placeholder="Título de la nota" required className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg mb-3 border border-slate-700 focus:border-blue-500 focus:outline-none" />
          <textarea name="description" placeholder="Descripción de la tarea..." required className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg mb-3 border border-slate-700 focus:border-blue-500 focus:outline-none" rows={2}></textarea>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
              <input type="checkbox" name="urgent" className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-800" />
              Marcar como Urgente
            </label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancelar</button>
              <button type="submit" className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Guardar Nota</button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className={`bg-slate-800 rounded-lg p-4 border-l-4 ${
              note.urgent ? 'border-red-500' : 'border-slate-700'
            } hover:bg-slate-750 transition-colors cursor-pointer`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-white">{note.title}</h3>
              <div className="flex items-center gap-2">
                {note.urgent && <AlertCircle className="text-red-500" size={20} />}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                  className="text-slate-500 hover:text-red-500 transition-colors p-1 rounded hover:bg-slate-700"
                  title="Eliminar nota"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-3">{note.description}</p>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <User size={14} />
                <span>{note.author}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{new Date(note.date).toLocaleDateString('es-AR')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
