import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { get, put } from '@vercel/blob';

// Uploaded files are served by /api/uploads/[name]. Locally they live in data/uploads (not
// public/, which production only serves as it was at build time). On Vercel, whose file system
// is read-only, they are kept in a private Vercel Blob store when BLOB_READ_WRITE_TOKEN is set.
export const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');
const usesBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const blobPath = (name: string) => `uploads/${name}`;

async function storeUpload(name: string, file: File) {
  if (usesBlob()) {
    await put(blobPath(name), file, { access: 'private', addRandomSuffix: false, contentType: file.type });
    return;
  }
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
}

// The stored bytes, or null when there is no such upload. `name` must already be validated.
export async function readUpload(name: string): Promise<Uint8Array | null> {
  if (usesBlob()) {
    const result = await get(blobPath(name), { access: 'private' }).catch(() => null);
    if (!result || result.statusCode !== 200) return null;
    return new Uint8Array(await new Response(result.stream).arrayBuffer());
  }
  const filePath = path.join(UPLOAD_DIR, name);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath) : null;
}
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

export const UPLOAD_NAME_PATTERN = /^[a-z0-9-]+\.(jpg|png|webp|pdf|docx|xlsx|pptx|doc|xls|ppt|txt)$/;

// Library documents (images are also accepted)
export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;
const DOCUMENT_EXTENSIONS: Record<string, string> = {
  ...EXTENSIONS,
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/msword': 'doc',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.ms-powerpoint': 'ppt',
  'text/plain': 'txt'
};

export function validateDocument(file: File): string | null {
  if (!DOCUMENT_EXTENSIONS[file.type]) return 'ឯកសារត្រូវជា PDF, Word, Excel, PowerPoint, TXT ឬរូបភាព';
  if (file.size > MAX_DOCUMENT_BYTES) return 'ឯកសារមិនត្រូវលើស 15MB';
  return null;
}

export async function saveDocument(file: File): Promise<string> {
  const name = `doc-${crypto.randomUUID()}.${DOCUMENT_EXTENSIONS[file.type]}`;
  await storeUpload(name, file);
  return `/api/uploads/${name}`;
}

export function validateImage(file: File): string | null {
  if (!EXTENSIONS[file.type]) return 'រូបភាពត្រូវជា JPG, PNG ឬ WEBP';
  if (file.size > MAX_UPLOAD_BYTES) return 'រូបភាពមិនត្រូវលើស 5MB';
  return null;
}

// Saves an already-validated image and returns its public URL.
export async function saveImage(file: File, prefix: string): Promise<string> {
  const name = `${prefix}-${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
  await storeUpload(name, file);
  return `/api/uploads/${name}`;
}

export function imageFrom(form: FormData, field: string): File | undefined {
  const value = form.get(field);
  return value instanceof File && value.size > 0 ? value : undefined;
}
