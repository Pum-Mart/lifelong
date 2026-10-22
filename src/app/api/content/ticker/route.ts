import { NextResponse } from 'next/server';
import { getTicker, saveTicker } from '@/lib/content';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  return NextResponse.json({ success: true, messages: getTicker() });
}

// Body: { messages: [{ text, href? }] } — replaces the whole list in order
export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  const body = await request.json();
  if (!Array.isArray(body.messages)) return NextResponse.json({ success: false, error: 'messages must be a list' }, { status: 400 });
  const messages: { text: string; href?: string }[] = [];
  for (const m of body.messages) {
    const text = String(m?.text ?? '').trim();
    if (!text) continue;
    const href = String(m?.href ?? '').trim();
    // Only same-site paths or http(s) links
    if (href && !href.startsWith('/') && !/^https?:\/\//.test(href)) {
      return NextResponse.json({ success: false, error: `តំណមិនត្រឹមត្រូវ៖ ${href}` }, { status: 400 });
    }
    messages.push({ text: text.slice(0, 300), href: href || undefined });
  }
  return NextResponse.json({ success: true, messages: saveTicker(messages) });
}
