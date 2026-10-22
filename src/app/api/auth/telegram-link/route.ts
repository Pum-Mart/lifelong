import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { updateUser } from '@/lib/db';
import { requireUser } from '@/lib/auth';

const BOT_USERNAME = 'lifelonglerning_bot';

// Returns a one-time t.me link; opening it and pressing Start links this account's Telegram
export async function POST() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const code = `LINK-${crypto.randomBytes(9).toString('base64url')}`;
  updateUser(auth.user.id, { telegramLinkCode: code });
  return NextResponse.json({ success: true, url: `https://t.me/${BOT_USERNAME}?start=${code}` });
}

// Unlinks Telegram
export async function DELETE() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  updateUser(auth.user.id, { telegramChatId: undefined, telegramLinkCode: undefined });
  return NextResponse.json({ success: true });
}
