import { NextResponse } from 'next/server';
import { getActivities, saveActivity } from '@/lib/content';
import { requireAdmin } from '@/lib/auth';
import { imageFrom, saveImage, validateImage } from '@/lib/uploads';
import { withDatabase } from '@/lib/store';

async function handleGET() {
  return NextResponse.json({ success: true, activities: getActivities() });
}

// Multipart form: title, description, date (YYYY-MM-DD), photo (required)
async function handlePOST(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  const form = await request.formData();
  const title = String(form.get('title') ?? '').trim();
  const date = String(form.get('date') ?? '').trim();
  if (!title) return NextResponse.json({ success: false, error: 'សូមបញ្ចូលចំណងជើងសកម្មភាព' }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ success: false, error: 'កាលបរិច្ឆេទមិនត្រឹមត្រូវ' }, { status: 400 });

  const photo = imageFrom(form, 'photo');
  if (!photo) return NextResponse.json({ success: false, error: 'សូមភ្ជាប់រូបថតសកម្មភាព' }, { status: 400 });
  const err = validateImage(photo);
  if (err) return NextResponse.json({ success: false, error: err }, { status: 400 });

  const activity = saveActivity({
    title,
    description: String(form.get('description') ?? '').trim(),
    date,
    photo: await saveImage(photo, 'activity')
  });
  return NextResponse.json({ success: true, activity });
}

export const GET = withDatabase(handleGET);
export const POST = withDatabase(handlePOST);
