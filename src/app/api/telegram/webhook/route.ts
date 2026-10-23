import { NextResponse } from 'next/server';
import { getRegistrationByCode, getUserByTelegramCode, markRegistrationVerified, updateUser } from '@/lib/db';
import { sendTelegramReply, registrationVerifiedMessage, escapeHtml } from '@/lib/telegram';
import { withDatabase } from '@/lib/store';

// Same alphabet as newRegistrationCode in db.ts
const CODE_PATTERN = /REG-[2-9A-HJ-NP-Z]{6}/i;

interface TelegramMessage {
  message_id: number;
  chat: { id: number; type: string };
  from?: { id: number; first_name?: string; username?: string };
  text?: string;
  caption?: string;
  photo?: unknown[];
  document?: { file_name?: string };
}

// Receives Telegram updates, either from Telegram itself (setWebhook, once the site is
// online) or from scripts/telegram-bot.mjs while running locally.
async function handlePOST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || request.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const update = await request.json();
    const msg: TelegramMessage | undefined = update.message;
    if (!msg) return NextResponse.json({ ok: true });

    // "/start LINK-..." from the account page links this chat to a website account
    const link = msg.text?.match(/^\/start\s+(LINK-[A-Za-z0-9_-]+)/)?.[1];
    if (link && msg.chat.type === 'private') {
      const account = getUserByTelegramCode(link);
      if (account) {
        updateUser(account.id, { telegramChatId: msg.chat.id, telegramLinkCode: undefined });
        await sendTelegramReply(
          msg.chat.id,
          msg.message_id,
          `✅ បានភ្ជាប់ Telegram ជាមួយគណនី <b>${escapeHtml(account.name)}</b> (${escapeHtml(account.email)})។\nអ្នកនឹងទទួលបានលិខិតជូនដំណឹង និងរបាយការណ៍ប្រចាំសប្តាហ៍នៅទីនេះ។`
        );
      } else {
        await sendTelegramReply(msg.chat.id, msg.message_id, '❌ តំណភ្ជាប់នេះផុតកំណត់ ឬមិនត្រឹមត្រូវ។ សូមចុច «ភ្ជាប់ Telegram» ម្តងទៀតនៅទំព័រគណនី។');
      }
      return NextResponse.json({ ok: true });
    }

    const text = [msg.text, msg.caption, msg.document?.file_name].filter(Boolean).join(' ');
    const code = text.match(CODE_PATTERN)?.[0].toUpperCase();
    const isPrivate = msg.chat.type === 'private';
    const reply = (html: string) => sendTelegramReply(msg.chat.id, msg.message_id, html);

    if (code) {
      const existing = getRegistrationByCode(code);
      if (!existing) {
        await reply(`❌ រកមិនឃើញលេខកូដ <b>${code}</b> ទេ។ សូមពិនិត្យលេខកូដលើសន្លឹកសាលាកបត្រម្តងទៀត។`);
        return NextResponse.json({ ok: true });
      }
      const who = msg.from?.username ? `@${msg.from.username}` : msg.from?.first_name || 'unknown';
      const verified = markRegistrationVerified(code, who)!;
      await reply(registrationVerifiedMessage(verified, Boolean(existing.verifiedAt)));
      return NextResponse.json({ ok: true });
    }

    if (msg.photo || msg.document) {
      // A card sent as a compressed photo loses its file name, so ask for the code
      await reply('📄 សូមសរសេរ <b>លេខកូដ</b> (ឧ. REG-ABC234) ដែលមាននៅលើសាលាកបត្រ ក្នុង caption ឬផ្ញើសន្លឹកនោះជា <b>File</b>។');
    } else if (isPrivate && msg.text?.startsWith('/start')) {
      await reply(
        `សួស្តី ${escapeHtml(msg.from?.first_name || '')}! 👋\nសូមស្វាគមន៍មកកាន់ Lifelong Learning Center។\n\nបន្ទាប់ពីចុះឈ្មោះលើគេហទំព័រ សូមផ្ញើសន្លឹក <b>សាលាកបត្រ</b> ឬ <b>លេខកូដ REG-...</b> មកទីនេះ ឬក្នុងក្រុម ដើម្បីផ្ទៀងផ្ទាត់។`
      );
    } else if (msg.text?.includes('សួស្តី')) {
      await reply(`សួស្តី ${escapeHtml(msg.from?.first_name || '')}! 😊 តើមានអ្វីឱ្យខ្ញុំជួយទេ?`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error handling Telegram update:', error);
    // 200 so Telegram does not retry a message we cannot process
    return NextResponse.json({ ok: true });
  }
}

export const POST = withDatabase(handlePOST);
