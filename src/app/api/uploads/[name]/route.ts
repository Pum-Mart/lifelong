import fs from 'fs';
import path from 'path';
import { UPLOAD_DIR, UPLOAD_NAME_PATTERN } from '@/lib/uploads';

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  doc: 'application/msword',
  xls: 'application/vnd.ms-excel',
  ppt: 'application/vnd.ms-powerpoint',
  txt: 'text/plain; charset=utf-8'
};
const IMAGES = new Set(['jpg', 'png', 'webp']);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  // The strict pattern also rules out path traversal
  if (!UPLOAD_NAME_PATTERN.test(name)) {
    return new Response('Not found', { status: 404 });
  }

  const filePath = path.join(UPLOAD_DIR, name);
  if (!fs.existsSync(filePath)) {
    return new Response('Not found', { status: 404 });
  }

  const ext = name.split('.').pop() as string;
  return new Response(fs.readFileSync(filePath), {
    headers: {
      'Content-Type': CONTENT_TYPES[ext],
      'Cache-Control': 'public, max-age=31536000, immutable',
      // Documents download instead of opening inline; never sniff types
      ...(IMAGES.has(ext) ? {} : { 'Content-Disposition': `attachment; filename="${name}"` }),
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
