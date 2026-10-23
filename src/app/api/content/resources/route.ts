import { NextResponse } from 'next/server';
import { getResources, saveResource } from '@/lib/content';
import { requireAdmin } from '@/lib/auth';
import { imageFrom, saveDocument, validateDocument } from '@/lib/uploads';
import { ResourceType } from '@/types';
import { withDatabase } from '@/lib/store';

const RESOURCE_TYPES: ResourceType[] = ['guides', 'curricula', 'toolkits', 'publications', 'teaching'];

async function handleGET() {
  return NextResponse.json({ success: true, resources: getResources() });
}

// Multipart form: title, type, category, description, file (PDF/Word/Excel/PowerPoint/TXT/image)
async function handlePOST(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  const form = await request.formData();
  const title = String(form.get('title') ?? '').trim();
  const type = String(form.get('type') ?? '') as ResourceType;
  if (!title) return NextResponse.json({ success: false, error: 'សូមបញ្ចូលចំណងជើងឯកសារ' }, { status: 400 });
  if (!RESOURCE_TYPES.includes(type)) return NextResponse.json({ success: false, error: 'សូមជ្រើសរើសប្រភេទឯកសារ' }, { status: 400 });

  const file = imageFrom(form, 'file');
  if (!file) return NextResponse.json({ success: false, error: 'សូមភ្ជាប់ឯកសារ' }, { status: 400 });
  const err = validateDocument(file);
  if (err) return NextResponse.json({ success: false, error: err }, { status: 400 });

  const resource = saveResource({
    title,
    type,
    category: String(form.get('category') ?? '').trim(),
    description: String(form.get('description') ?? '').trim(),
    file: { url: await saveDocument(file), name: file.name, mime: file.type, size: file.size }
  });
  return NextResponse.json({ success: true, resource });
}

export const GET = withDatabase(handleGET);
export const POST = withDatabase(handlePOST);
