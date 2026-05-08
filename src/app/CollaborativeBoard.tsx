import { useState, useEffect } from 'react';
import { turso } from './turso';
import { MessageSquarePlus, Trash2, User } from 'lucide-react';

interface Note {
  id: string;
  content: string;
  author: string;
}

interface CollaborativeBoardProps {
  currentUser: { username: string; role: string } | null;
}

export default function CollaborativeBoard({ currentUser }: CollaborativeBoardProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const setupAndFetchNotes = async () => {
      try {
        // 1. Asegurar que la tabla exista con la nueva columna 'author'
        await turso.execute(`
          CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            content TEXT,
            author TEXT
          );
        `);
        // Cargar notas existentes
        const { rows } = await turso.execute('SELECT * FROM notes ORDER BY id DESC');
        const loadedNotes = rows.map((row: any) => ({
          id: String(row.id),
          content: String(row.content),
          author: String(row.author || 'Anónimo'), // Fallback por si hay notas antiguas
        }));
        setNotes(loadedNotes);
      } catch (error) {
        console.error("Error al inicializar o cargar las notas:", error);
      }
    };
    setupAndFetchNotes();
  }, []);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !currentUser) return;

    setIsLoading(true);
    const noteToAdd: Note = {
      id: Date.now().toString(),
      content: newNoteContent.trim(),
      author: currentUser.username,
    };

    try {
      await turso.execute({
        sql: 'INSERT INTO notes (id, content, author) VALUES (?, ?, ?)',
        args: [noteToAdd.id, noteToAdd.content, noteToAdd.author],
      });
      setNotes([noteToAdd, ...notes]);
      setNewNoteContent('');
    } catch (error) {
      console.error("Error al guardar la nota:", error);
      alert("No se pudo guardar la nota.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta nota?")) return;

    try {
      await turso.execute({
        sql: 'DELETE FROM notes WHERE id = ?',
        args: [noteId],
      });
      setNotes(notes.filter(note => note.id !== noteId));
    } catch (error) {
      console.error("Error al eliminar la nota:", error);
      alert("No se pudo eliminar la nota.");
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-white mb-4">Tablero de Notas</h2>
      <form onSubmit={handleAddNote} className="flex items-center gap-3 mb-6">
        <input type="text" value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} placeholder="Escribe una nueva nota o recordatorio..." className="flex-grow bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" disabled={isLoading} />
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold p-2 rounded-lg transition-colors disabled:bg-blue-800" disabled={isLoading || !newNoteContent.trim()}><MessageSquarePlus size={20} /></button>
      </form>
      <div className="space-y-4">
        {notes.map(note => (
          <div key={note.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 group">
            <p className="text-slate-200 whitespace-pre-wrap">{note.content}</p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
              <div className="flex items-center gap-2 text-xs text-slate-400"> 
                <User size={14} />
                <span className="font-medium capitalize">{note.author}</span></div>
              {(currentUser?.role === 'admin' || currentUser?.username === note.author) && (<button onClick={() => handleDeleteNote(note.id)} className="text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Eliminar nota"><Trash2 size={16} /></button>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}