import type { Payment, Registration } from '@/types';

const TELEGRAM_API = 'https://api.telegram.org';

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Calls any Bot API method with a JSON body. Never throws.
async function callTelegram(method: string, body: Record<string, unknown>): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('Telegram not configured: set TELEGRAM_BOT_TOKEN in .env.local');
    return false;
  }
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      console.error(`Telegram ${method} failed:`, res.status, await res.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Telegram ${method} error:`, error);
    return false;
  }
}

// Sends an HTML-formatted message to the store's notification chat.
// Never throws: a Telegram outage must not break checkout.
export async function sendTelegramMessage(html: string): Promise<boolean> {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) {
    console.warn('Telegram not configured: set TELEGRAM_CHAT_ID in .env.local');
    return false;
  }
  return callTelegram('sendMessage', { chat_id: chatId, text: html, parse_mode: 'HTML', disable_web_page_preview: true });
}

// Sends a photo (e.g. a bank transfer receipt) with an HTML caption. Never throws.
export async function sendTelegramPhoto(photo: Blob, filename: string, captionHtml: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn('Telegram not configured: set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env.local');
    return false;
  }

  try {
    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('caption', captionHtml);
    form.append('parse_mode', 'HTML');
    form.append('photo', photo, filename);
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendPhoto`, { method: 'POST', body: form });
    if (!res.ok) {
      console.error('Telegram sendPhoto failed:', res.status, await res.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('Telegram sendPhoto error:', error);
    return false;
  }
}

export function notifyPaymentSubmitted(payment: Payment, receipt?: { file: Blob; filename: string }) {
  const html = [
    '💳 <b>ការបង់ប្រាក់ថ្មី — រង់ចាំផ្ទៀងផ្ទាត់</b>',
    `<b>លេខ:</b> ${payment.id}`,
    `<b>សិស្ស:</b> ${escapeHtml(payment.studentName)} (${escapeHtml(payment.studentEmail)})`,
    `<b>វគ្គ (${payment.items.length}):</b>`,
    ...payment.items.map(i => `• ${escapeHtml(i.courseTitle)} — $${i.price}`),
    ...(payment.memberDiscountAmount ? [`<b>សមាជិក:</b> -$${payment.memberDiscountAmount}`] : []),
    ...(payment.couponCode ? [`<b>កូដបញ្ចុះតម្លៃ:</b> ${payment.couponCode} (-$${payment.discountAmount})`] : []),
    `<b>សរុប:</b> $${payment.total.toFixed(2)} (${payment.totalKhr.toLocaleString('en-US')} ៛)`,
    `<b>បង់ជា:</b> ${payment.payCurrency === 'KHR' ? `រៀល — ${payment.totalKhr.toLocaleString('en-US')} ៛` : `ដុល្លារ — $${payment.total.toFixed(2)}`}`,
    `<b>វិធីបង់:</b> ${escapeHtml(payment.bankName)}`,
    `<b>អ្នកផ្ទេរ:</b> ${escapeHtml(payment.payerName)} • ${escapeHtml(payment.payerPhone)}`,
    ...(payment.transactionRef ? [`<b>លេខប្រតិបត្តិការ:</b> ${escapeHtml(payment.transactionRef)}`] : []),
    '',
    'ពិនិត្យ និងអនុម័តនៅ /admin'
  ].join('\n');

  // Photo captions are limited to 1024 characters; fall back to a text message if longer
  if (receipt && html.length <= 1024) {
    return sendTelegramPhoto(receipt.file, receipt.filename, html);
  }
  return sendTelegramMessage(html);
}

export function notifyPaymentReviewed(payment: Payment) {
  const approved = payment.status === 'approved';
  return sendTelegramMessage(
    [
      approved ? '✅ <b>បានអនុម័តការបង់ប្រាក់</b>' : '❌ <b>បានបដិសេធការបង់ប្រាក់</b>',
      `<b>លេខ:</b> ${payment.id}`,
      `<b>សិស្ស:</b> ${escapeHtml(payment.studentName)}`,
      `<b>សរុប:</b> $${payment.total}`
    ].join('\n')
  );
}

export function notifyNewRegistration(registration: Registration) {
  return sendTelegramMessage(
    [
      '📝 <b>ការចុះឈ្មោះចូលរៀនថ្មី</b>',
      `<b>លេខកូដ:</b> ${registration.code}`,
      `<b>ឈ្មោះ:</b> ${escapeHtml(registration.fullNameKh)} (${escapeHtml(registration.fullNameEn)})`,
      `<b>វគ្គ:</b> ${escapeHtml(registration.courseTitle)}`,
      `<b>ទូរស័ព្ទ:</b> ${escapeHtml(registration.phone)}`
    ].join('\n')
  );
}

// Sends a plain-text title + body to any chat (e.g. a user who linked their Telegram)
export function sendTelegramTo(chatId: number | string, title: string, body: string) {
  return callTelegram('sendMessage', {
    chat_id: chatId,
    text: `<b>${escapeHtml(title)}</b>\n\n${escapeHtml(body)}`,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  });
}

// Replies in the chat where a registration card was posted
export function sendTelegramReply(chatId: number, replyToMessageId: number, html: string) {
  return callTelegram('sendMessage', {
    chat_id: chatId,
    text: html,
    parse_mode: 'HTML',
    reply_parameters: { message_id: replyToMessageId, allow_sending_without_reply: true }
  });
}

export function registrationVerifiedMessage(registration: Registration, alreadyVerified: boolean): string {
  return [
    '🎉🎊 <b>សូមអបអរសាទរ!</b> 🎊🎉',
    '',
    `<b>${escapeHtml(registration.fullNameKh)}</b> បានបំពេញបែបបទជោគជ័យ ✅`,
    `វគ្គ «<b>${escapeHtml(registration.courseTitle)}</b>» នឹងដំណើរការតាមការកំណត់។`,
    '',
    'សូមរក្សាសន្លឹកសាលាកបត្រ និងឧស្សាហ៍ពិនិត្យតេលេក្រាមនេះ ដើម្បីបានព័ត៌មានទាន់ហេតុការណ៍ផ្សេងៗ។',
    'សូមអរគុណ 🙏',
    '',
    `<i>លេខកូដ ${registration.code}${alreadyVerified ? ' • បានផ្ទៀងផ្ទាត់រួចហើយពីមុន' : ''}</i>`
  ].join('\n');
}

export function notifyNewOrder(order: { studentName: string; studentEmail: string; courseTitle: string; amount: number }) {
  return sendTelegramMessage(
    [
      '🛒 <b>New course order</b>',
      `<b>Course:</b> ${escapeHtml(order.courseTitle)}`,
      `<b>Amount:</b> $${order.amount}`,
      `<b>Student:</b> ${escapeHtml(order.studentName)} (${escapeHtml(order.studentEmail)})`
    ].join('\n')
  );
}

export function notifyEventRsvp(event: { title: string; date: string; time: string; seatsBooked: number; seatsTotal: number }) {
  return sendTelegramMessage(
    [
      '📅 <b>New workshop RSVP</b>',
      `<b>Event:</b> ${escapeHtml(event.title)}`,
      `<b>When:</b> ${escapeHtml(event.date)} ${escapeHtml(event.time)}`,
      `<b>Seats:</b> ${event.seatsBooked}/${event.seatsTotal}`
    ].join('\n')
  );
}
