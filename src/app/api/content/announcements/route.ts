import { NextResponse } from 'next/server';
import { getAnnouncements, saveAnnouncement } from '@/lib/content';
import { getSessionUser, requireAdmin } from '@/lib/auth';
import { imageFrom, saveImage, validateImage } from '@/lib/uploads';
import { withDatabase } from '@/lib/store';

// Published announcements; admins get drafts too with ?all=1
async function handleGET(request: Request) {
  const all = new URL(request.url).searchParams.get('all') === '1';
  const user = all ? await getSessionUser() : null;
  return NextResponse.json({ success: true, announcements: getAnnouncements(Boolean(user && user.role === 'admin')) });
}

// Multipart form: title, body, published ('true'/'false'), image (optional)
async function handlePOST(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

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
    title,
    body,
    published: String(form.get('published')) !== 'false',
    image: image ? await saveImage(image, 'announcement') : undefined
  });
  return NextResponse.json({ success: true, announcement });
}

export const GET = withDatabase(handleGET);
export const POST = withDatabase(handlePOST);
