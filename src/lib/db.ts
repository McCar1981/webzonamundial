import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'zonamundial.db');

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS registros (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL UNIQUE,
    creador TEXT,
    fecha TEXT NOT NULL,
    ip TEXT
  );
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_registros_email ON registros(email);
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_registros_nombre ON registros(nombre);
`);

export default db;
