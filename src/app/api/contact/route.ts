import { NextResponse } from 'next/server';
import { addMessage, getMessages } from '@/lib/content';
import { getUsers } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { deliver } from '@/lib/reports';
import { escapeHtml, sendTelegramMessage } from '@/lib/telegram';
import { withDatabase } from '@/lib/store';

// Simple per-IP limit so the public form cannot flood Telegram
const recent = new Map<string, number[]>();
const LIMIT = 5;
const WINDOW_MS = 10 * 60_000;

function allowed(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter(t => now - t < WINDOW_MS);
  if (hits.length >= LIMIT) return false;
  hits.push(now);
  recent.set(ip, hits);
  return true;
}

// Body: { kind: 'contact' | 'volunteer', name, contact, subject?, message }
async function handlePOST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  if (!allowed(ip)) {
    return NextResponse.json({ success: false, error: 'អ្នកបានផ្ញើសារច្រើនពេក។ សូមរង់ចាំបន្តិច។' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const kind = body.kind === 'volunteer' ? 'volunteer' : 'contact';
  const name = String(body.name ?? '').trim().slice(0, 100);
  const contact = String(body.contact ?? '').trim().slice(0, 100);
  const subject = String(body.subject ?? '').trim().slice(0, 100);
  const message = String(body.message ?? '').trim().slice(0, 2000);
  if (!name || !contact) return NextResponse.json({ success: false, error: 'សូមបញ្ចូលឈ្មោះ និងលេខទូរស័ព្ទ/អ៊ីមែល' }, { status: 400 });
  if (kind === 'contact' && !message) return NextResponse.json({ success: false, error: 'សូមសរសេរសារ' }, { status: 400 });

  const saved = addMessage({ kind, name, contact, subject: subject || undefined, message });

  const title = kind === 'volunteer' ? '🙋 ការចុះឈ្មោះជាអ្នកស្ម័គ្រចិត្ត' : '✉️ សារថ្មីពីទម្រង់ទំនាក់ទំនង';
  const text = [`ឈ្មោះ៖ ${name}`, `ទំនាក់ទំនង៖ ${contact}`, ...(subject ? [`ប្រធានបទ៖ ${subject}`] : []), ...(message ? ['', message] : [])].join('\n');
  await sendTelegramMessage(`<b>${escapeHtml(title)}</b>\n\n${escapeHtml(text)}`);
  await deliver(getUsers().filter(u => u.role === 'admin'), title, text);

  return NextResponse.json({ success: true, id: saved.id });
}

async function handleGET() {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  return NextResponse.json({ success: true, messages: getMessages() });
}

export const POST = withDatabase(handlePOST);
export const GET = withDatabase(handleGET);
