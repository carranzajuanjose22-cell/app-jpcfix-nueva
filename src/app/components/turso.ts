import { createClient } from '@libsql/client/web';

// Función de seguridad para eliminar comillas accidentales
const stripQuotes = (str: string) => str.replace(/^["'](.*)["']$/, '$1');

// Limpiamos las variables y eliminamos posibles espacios en blanco
const envUrl = stripQuotes((import.meta.env.VITE_TURSO_DATABASE_URL || '').trim());
const envToken = stripQuotes((import.meta.env.VITE_TURSO_AUTH_TOKEN || '').trim());

// Forzamos el uso de HTTPS. Es el protocolo más estable para redes móviles (4G/5G) 
// ya que algunas operadoras bloquean las conexiones por WebSockets.
const forceHttps = (url: string) => url.replace('libsql://', 'https://').replace('wss://', 'https://');
const parsedEnvUrl = envUrl ? forceHttps(envUrl) : '';

// Usamos las credenciales directas como respaldo para descartar problemas con el .env
const url = parsedEnvUrl || "https://jpcfix-app-juanjokpodela3ra.aws-us-east-1.turso.io";
const authToken = envToken || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzgyMTExODcsImlkIjoiMDE5ZTA1OWItMTUwMS03NzAzLThmYmItMTI4ZGVlYzFiNDQ4IiwicmlkIjoiZGVjNGQ3ZjMtZjdjMi00Y2ExLTljYTktZDVlZjdlODAxNWI1In0.fOwr9arDF4UmjYQiwmpkY-at98_faRILLdu44Nujgj5pEk1cQ2Zr9yqacljN8Mdz7J4PupZuQiUmdgJcg4J4Bg";

console.log("Intentando conectar a Turso URL:", url);

// Exportamos el cliente
export const turso = createClient({
  url: url,
  authToken: authToken,
});