// Creates (or resets the password of) an admin account directly in data/database.json.
// Prints a temporary password — sign in with it and change it at /account.
//
// Usage: node scripts/create-admin.mjs <email> "<name>"

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const [email, name = 'Admin'] = process.argv.slice(2);
if (!email) {
  console.error('Usage: node scripts/create-admin.mjs <email> "<name>"');
  process.exit(1);
}

const dbFile = path.join(process.cwd(), 'data', 'database.json');
const db = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
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

fs.writeFileSync(dbFile, JSON.stringify(db, null, 2), 'utf-8');
console.log(`${existing ? 'Reset' : 'Created'} admin ${lower}  temporary password: ${password}`);
