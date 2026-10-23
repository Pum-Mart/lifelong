// One-time copy of the local data to the online storage used on Vercel:
//   data/database.json -> Postgres (DATABASE_URL), table app_data, row id 1
//   data/uploads/*     -> Vercel Blob (BLOB_READ_WRITE_TOKEN), private, as uploads/<name>
//
// Usage (env file holding the two values from Vercel, e.g. from `vercel env pull .env.vercel`):
//   node --env-file=.env.vercel scripts/migrate-to-postgres.mjs
//   node --env-file=.env.vercel scripts/migrate-to-postgres.mjs --replace   (overwrite online data)
//
// Refuses to overwrite data already online unless --replace is given.

import fs from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';
import { put } from '@vercel/blob';

const replace = process.argv.includes('--replace');
const { DATABASE_URL, BLOB_READ_WRITE_TOKEN } = process.env;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set. Run with --env-file=<file with the Vercel values>.');
  process.exit(1);
}

const dbFile = path.join(process.cwd(), 'data', 'database.json');
const data = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
const sql = neon(DATABASE_URL);

await sql.query(`CREATE TABLE IF NOT EXISTS app_data (
  id integer PRIMARY KEY,
  data jsonb NOT NULL,
  version integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
)`);
const [existing] = await sql.query('SELECT version, jsonb_array_length(data->\'users\') AS users FROM app_data WHERE id = 1');
if (existing && !replace) {
  console.error(`The online database already has data (version ${existing.version}, ${existing.users} accounts). Nothing changed.`);
  console.error('Run again with --replace to overwrite it with data/database.json.');
  process.exit(1);
}

const json = JSON.stringify(data);
if (existing) {
  await sql.query('UPDATE app_data SET data = $1::jsonb, version = version + 1, updated_at = now() WHERE id = 1', [json]);
} else {
  await sql.query('INSERT INTO app_data (id, data, version) VALUES (1, $1::jsonb, 1)', [json]);
}
console.log(`Database copied: ${data.users?.length ?? 0} accounts, ${data.courses?.length ?? 0} courses, ${data.enrollments?.length ?? 0} enrollments.`);

const uploadDir = path.join(process.cwd(), 'data', 'uploads');
const files = fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir).filter(f => /^[a-z0-9-]+\.[a-z]+$/.test(f)) : [];
if (files.length && !BLOB_READ_WRITE_TOKEN) {
  console.warn(`BLOB_READ_WRITE_TOKEN is not set: ${files.length} uploaded files were NOT copied.`);
} else {
  for (const name of files) {
    await put(`uploads/${name}`, fs.readFileSync(path.join(uploadDir, name)), { access: 'private', addRandomSuffix: false, allowOverwrite: true });
  }
  console.log(`Uploads copied: ${files.length} files.`);
}
