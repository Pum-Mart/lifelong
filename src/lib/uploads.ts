import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Uploaded photos live in data/uploads (not public/, which production only serves
// as it was at build time) and are served by /api/uploads/[name].
export const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');
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
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const name = `doc-${crypto.randomUUID()}.${DOCUMENT_EXTENSIONS[file.type]}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return `/api/uploads/${name}`;
}

export function validateImage(file: File): string | null {
  if (!EXTENSIONS[file.type]) return 'រូបភាពត្រូវជា JPG, PNG ឬ WEBP';
  if (file.size > MAX_UPLOAD_BYTES) return 'រូបភាពមិនត្រូវលើស 5MB';
  return null;
}

// Saves an already-validated image and returns its public URL.
export async function saveImage(file: File, prefix: string): Promise<string> {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const name = `${prefix}-${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return `/api/uploads/${name}`;
}

export function imageFrom(form: FormData, field: string): File | undefined {
  const value = form.get(field);
  return value instanceof File && value.size > 0 ? value : undefined;
}
