import { NextResponse } from 'next/server';
import { deleteResource, getResources, saveResource } from '@/lib/content';
import { requireAdmin } from '@/lib/auth';
import { imageFrom, saveDocument, validateDocument } from '@/lib/uploads';
import { ResourceType } from '@/types';

const TYPES: ResourceType[] = ['guides', 'curricula', 'toolkits', 'publications', 'teaching'];

// Multipart form: title, type, category, description, file (optional — keeps the current one)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  const { id } = await params;
  const existing = getResources().find(r => r.id === id);
  if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  const form = await request.formData();
  const title = String(form.get('title') ?? '').trim();
  const type = String(form.get('type') ?? '') as ResourceType;
  if (!title) return NextResponse.json({ success: false, error: 'សូមបញ្ចូលចំណងជើងឯកសារ' }, { status: 400 });
  if (!TYPES.includes(type)) return NextResponse.json({ success: false, error: 'សូមជ្រើសរើសប្រភេទឯកសារ' }, { status: 400 });

  const file = imageFrom(form, 'file');
  if (file) {
    const err = validateDocument(file);
    if (err) return NextResponse.json({ success: false, error: err }, { status: 400 });
  }
  const resource = saveResource({
    id,
    title,
    type,
    category: String(form.get('category') ?? '').trim(),
    description: String(form.get('description') ?? '').trim(),
    // A newly uploaded file replaces a generated course guide
    file: file ? { url: await saveDocument(file), name: file.name, mime: file.type, size: file.size } : existing.file,
    courseId: file ? undefined : existing.courseId
  });
  return NextResponse.json({ success: true, resource });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  return NextResponse.json({ success: deleteResource(id) });
}
