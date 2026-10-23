import { AsyncLocalStorage } from 'node:async_hooks';
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

// Where the site's data lives.
//
// Locally the database is data/database.json (see db.ts). On Vercel the file system is
// read-only, so when DATABASE_URL is set the same JSON document is kept in Postgres instead:
// one row, loaded once at the start of a request and saved once at the end if it changed.
// db.ts keeps working synchronously on that in-memory copy for the length of the request.
//
// Saves use optimistic locking: if another request saved first, this save is refused
// (409) rather than silently overwriting the other change.

export const usesPostgres = () => Boolean(process.env.DATABASE_URL);

export interface RequestStore {
  data: unknown; // the database document, or null when the table has no row yet
  version: number; // 0 = no row yet
  dirty: boolean;
}

const requestStore = new AsyncLocalStorage<RequestStore>();

export function currentStore(): RequestStore | undefined {
  return requestStore.getStore();
}

export class DatabaseConflictError extends Error {
  constructor() {
    super('The database was changed by another request; nothing was saved');
  }
}

const sql = () => neon(process.env.DATABASE_URL as string);

let tableReady: Promise<unknown> | null = null;
function ensureTable() {
  tableReady ??= sql()
    .query(
      `CREATE TABLE IF NOT EXISTS app_data (
         id integer PRIMARY KEY,
         data jsonb NOT NULL,
         version integer NOT NULL,
         updated_at timestamptz NOT NULL DEFAULT now()
       )`
    )
    .catch(error => {
      tableReady = null; // retry on the next request
      throw error;
    });
  return tableReady;
}

export async function loadDocument(): Promise<{ data: unknown; version: number }> {
  await ensureTable();
  const rows = (await sql().query('SELECT data, version FROM app_data WHERE id = 1')) as { data: unknown; version: number }[];
  return rows[0] ?? { data: null, version: 0 };
}

// Returns false when another request saved a newer version first
export async function saveDocument(data: unknown, version: number): Promise<boolean> {
  await ensureTable();
  const json = JSON.stringify(data);
  const rows = version === 0
    ? await sql().query('INSERT INTO app_data (id, data, version) VALUES (1, $1::jsonb, 1) ON CONFLICT (id) DO NOTHING RETURNING version', [json])
    : await sql().query(
        'UPDATE app_data SET data = $1::jsonb, version = version + 1, updated_at = now() WHERE id = 1 AND version = $2 RETURNING version',
        [json, version]
      );
  return (rows as unknown[]).length === 1;
}

// Runs fn with the database loaded for it, then saves any changes.
// Nested calls share the outer request's copy.
export async function runWithDatabase<T>(fn: () => Promise<T>): Promise<T> {
  if (!usesPostgres() || requestStore.getStore()) return fn();
  const store: RequestStore = { ...(await loadDocument()), dirty: false };
  const result = await requestStore.run(store, fn);
  if (store.dirty && !(await saveDocument(store.data, store.version))) throw new DatabaseConflictError();
  return result;
}

// Wraps a route handler: `export const GET = withDatabase(handleGET);`
export function withDatabase<A extends unknown[]>(handler: (...args: A) => Promise<Response>): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    try {
      return await runWithDatabase(() => handler(...args));
    } catch (error) {
      if (!(error instanceof DatabaseConflictError)) throw error;
      return NextResponse.json(
        { success: false, error: 'ប្រព័ន្ធកំពុងរវល់ សូមព្យាយាមម្តងទៀត (Please try again)' },
        { status: 409 }
      );
    }
  };
}
