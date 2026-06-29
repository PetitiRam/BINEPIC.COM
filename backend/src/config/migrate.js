import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Runs every schema*.sql file in this folder, in filename order, so each
// phase can ship its own migration file (schema.sql, schema_phase2.sql, ...)
async function migrate() {
  const files = fs.readdirSync(__dirname)
    .filter((f) => f.startsWith('schema') && f.endsWith('.sql'))
    .sort();

  console.log('Running JEDIDA Marketplace schema migration...');
  try {
    for (const file of files) {
      console.log(`  → applying ${file}`);
      const sql = fs.readFileSync(path.join(__dirname, file), 'utf-8');
      await pool.query(sql);
    }
    console.log('✔ Migration complete.');
  } catch (err) {
    console.error('✘ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
