import { NextResponse } from 'next/server';
import { deleteAnnouncement, getAnnouncements, saveAnnouncement } from '@/lib/content';
import { requireAdmin } from '@/lib/auth';
import { imageFrom, saveImage, validateImage } from '@/lib/uploads';
import { withDatabase } from '@/lib/store';

// Multipart form: title, body, published, image (optional), removeImage ('true')
async function handlePUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  const { id } = await params;
  const existing = getAnnouncements(true).find(a => a.id === id);
  if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  const form = await request.formData();
  const title = String(form.get('title') ?? '').trim();
  const body = String(form.get('body') ?? '').trim();
  if (!title || !body) return NextResponse.json({ success: false, error: 'សូមបញ្ចូលចំណងជើង និងខ្លឹមសារ' }, { status: 400 });

  const image = imageFrom(form, 'image');
  if (image) {
    const err = validateImage(image);
    if (err) return NextResponse.json({ success: false, error: err }, { status: 400 });
  }
  const announcement = saveAnnouncement({
    id,
    title,
    body,
    published: String(form.get('published')) !== 'false',
    image: image ? await saveImage(image, 'announcement') : String(form.get('removeImage')) === 'true' ? undefined : existing.image
  });
  return NextResponse.json({ success: true, announcement });
}

async function handleDELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  return NextResponse.json({ success: deleteAnnouncement(id) });
}

export const PUT = withDatabase(handlePUT);
export const DELETE = withDatabase(handleDELETE);
