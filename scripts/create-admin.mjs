// Creates (or resets the password of) an admin account directly in the database:
// data/database.json locally, or the online Postgres database when DATABASE_URL is set.
// Prints a temporary password — sign in with it and change it at /account.
//
// Usage: node scripts/create-admin.mjs <email> "<name>"
//        node --env-file=.env.vercel scripts/create-admin.mjs <email> "<name>"   (live site)

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { neon } from '@neondatabase/serverless';

const [email, name = 'Admin'] = process.argv.slice(2);
if (!email) {
  console.error('Usage: node scripts/create-admin.mjs <email> "<name>"');
  process.exit(1);
}

const dbFile = path.join(process.cwd(), 'data', 'database.json');
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
let version = 0;
let db;
if (sql) {
  const [row] = await sql.query('SELECT data, version FROM app_data WHERE id = 1');
  if (!row) {
    console.error('The online database is empty. Run scripts/migrate-to-postgres.mjs first.');
    process.exit(1);
  }
  ({ data: db, version } = row);
} else {
  db = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
}
db.users = db.users || [];

// Same format as hashPassword in src/lib/auth.ts
const password = crypto.randomBytes(9).toString('base64url');
const salt = crypto.randomBytes(16).toString('hex');
const passwordHash = `scrypt:${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;

const lower = email.trim().toLowerCase();
const existing = db.users.find(u => u.email === lower);
if (existing) {
  existing.passwordHash = passwordHash;
  existing.role = 'admin';
  existing.sessionVersion = (existing.sessionVersion || 1) + 1;
} else {
  db.users.push({
    id: `user-${crypto.randomUUID()}`,
    name,
    email: lower,
    passwordHash,
    role: 'admin',
    isMember: true,
    memberSince: new Date().toISOString(),
    sessionVersion: 1,
    createdAt: new Date().toISOString()
  });
}

if (sql) {
  // Same optimistic lock as the site, so a save made meanwhile is not overwritten
  const saved = await sql.query(
    'UPDATE app_data SET data = $1::jsonb, version = version + 1, updated_at = now() WHERE id = 1 AND version = $2 RETURNING version',
    [JSON.stringify(db), version]
  );
  if (saved.length !== 1) {
    console.error('The database changed while this ran. Nothing was saved; please run it again.');
    process.exit(1);
  }
} else {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2), 'utf-8');
}
console.log(`${existing ? 'Reset' : 'Created'} admin ${lower}  temporary password: ${password}`);
