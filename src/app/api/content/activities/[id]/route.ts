import { NextResponse } from 'next/server';
import { deleteActivity, getActivities, saveActivity } from '@/lib/content';
import { requireAdmin } from '@/lib/auth';
import { imageFrom, saveImage, validateImage } from '@/lib/uploads';

// Multipart form: title, description, date, photo (optional — keeps the current one)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  const { id } = await params;
  const existing = getActivities().find(a => a.id === id);
  if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  const form = await request.formData();
  const title = String(form.get('title') ?? '').trim();
  const date = String(form.get('date') ?? '').trim();
  if (!title) return NextResponse.json({ success: false, error: 'សូមបញ្ចូលចំណងជើងសកម្មភាព' }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ success: false, error: 'កាលបរិច្ឆេទមិនត្រឹមត្រូវ' }, { status: 400 });

  const photo = imageFrom(form, 'photo');
  if (photo) {
    const err = validateImage(photo);
    if (err) return NextResponse.json({ success: false, error: err }, { status: 400 });
  }
  const activity = saveActivity({
    id,
    title,
    description: String(form.get('description') ?? '').trim(),
    date,
    photo: photo ? await saveImage(photo, 'activity') : existing.photo
  });
  return NextResponse.json({ success: true, activity });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  return NextResponse.json({ success: deleteActivity(id) });
}
