import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { imageFrom, saveImage, validateImage } from '@/lib/uploads';

// Admin image upload (e.g. course cover). Multipart form: file. Returns { url }.
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const form = await request.formData();
  const file = imageFrom(form, 'file');
  if (!file) return NextResponse.json({ success: false, error: 'សូមជ្រើសរើសរូបភាព' }, { status: 400 });
  const err = validateImage(file);
  if (err) return NextResponse.json({ success: false, error: err }, { status: 400 });
  return NextResponse.json({ success: true, url: await saveImage(file, 'course') });
}
