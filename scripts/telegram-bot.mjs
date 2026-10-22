// Local Telegram bot runner: long-polls Telegram for new messages and forwards each
// one to the site's webhook route, so the bot works while the site is on localhost.
// Once the site is online, use Telegram's setWebhook instead and stop this script.
//
// Run (with `npm run dev` already running):  npm run bot

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const siteUrl = process.env.BOT_SITE_URL || 'http://localhost:3000';

if (!token || !secret) {
  console.error('Set TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET in .env.local');
  process.exit(1);
}

const api = (method, params = {}) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  }).then(res => res.json());

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Network hiccups at startup are retried; only a rejected token stops the bot
let me;
for (let attempt = 1; ; attempt++) {
  try {
    me = await api('getMe');
    break;
  } catch (error) {
    console.error(`Cannot reach Telegram (${error.cause?.code || error.message}); retrying in ${Math.min(60, attempt * 5)}s...`);
    await sleep(Math.min(60, attempt * 5) * 1000);
  }
}
if (!me.ok) {
  console.error('Bot token rejected by Telegram:', me.description);
  process.exit(1);
}
console.log(`🤖 @${me.result.username} is listening — forwarding to ${siteUrl}/api/telegram/webhook (Ctrl+C to stop)`);

// Every 10 minutes, let the site send any report that is due (weekly letters on Friday
// afternoon Cambodia time, course-end notices). The site decides; repeats are ignored.
async function checkScheduledReports() {
  try {
    const res = await fetch(`${siteUrl}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Scheduler-Secret': secret },
      body: JSON.stringify({ type: 'scheduled' })
    });
    const data = await res.json();
    if (data.weekly) console.log(`📊 weekly reports sent: ${data.weekly.courses} courses, ${data.weekly.messages} messages`);
    if (data.endNotices) console.log(`🎓 course-end notices sent: ${data.endNotices}`);
  } catch (error) {
    console.error('Scheduled report check failed:', error.message);
  }
}
checkScheduledReports();
setInterval(checkScheduledReports, 10 * 60_000);

let offset = 0;
for (;;) {
  try {
    const res = await api('getUpdates', { offset, timeout: 50, allowed_updates: ['message'] });
    if (!res.ok) {
      console.error('getUpdates failed:', res.description);
      await sleep(5000);
      continue;
    }

    for (const update of res.result) {
      offset = update.update_id + 1;
      const msg = update.message;
      const from = msg?.from?.username ? `@${msg.from.username}` : msg?.from?.first_name;
      console.log(`← ${msg?.chat?.type ?? '?'} ${from ?? ''}: ${msg?.text ?? msg?.caption ?? (msg?.photo ? '[photo]' : msg?.document ? `[file ${msg.document.file_name}]` : '')}`);

      const forward = await fetch(`${siteUrl}/api/telegram/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Telegram-Bot-Api-Secret-Token': secret },
        body: JSON.stringify(update)
      }).catch(err => ({ ok: false, status: err.message }));
      if (!forward.ok) console.error(`  ✗ site did not accept the update (${forward.status}) — is "npm run dev" running?`);
    }
  } catch (error) {
    console.error('Polling error:', error.message);
    await sleep(5000);
  }
}
