'use client';

import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Download, Send, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { Registration } from '@/types';

const WIDTH = 1600;
const HEIGHT = 1000;
const BOT_URL = 'https://t.me/lifelonglerning_bot';
const GROUP_URL = process.env.NEXT_PUBLIC_TELEGRAM_GROUP_URL || '';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Splits text into lines that fit maxWidth. Khmer has no spaces between words, so
// fall back to breaking between characters when a single "word" is too long.
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const ch of Array.from(text)) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      const lastSpace = line.lastIndexOf(' ');
      if (lastSpace > 0) {
        lines.push(line.slice(0, lastSpace));
        line = line.slice(lastSpace + 1) + ch;
      } else {
        lines.push(line);
        line = ch;
      }
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function drawCard(canvas: HTMLCanvasElement, r: Registration) {
  await Promise.all([document.fonts.load('40px Moul'), document.fonts.load('30px Siemreap')]);
  const ctx = canvas.getContext('2d')!;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  // Background and frame
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.strokeStyle = '#047857';
  ctx.lineWidth = 12;
  ctx.strokeRect(24, 24, WIDTH - 48, HEIGHT - 48);

  // Header band
  const band = ctx.createLinearGradient(0, 0, WIDTH, 0);
  band.addColorStop(0, '#064e3b');
  band.addColorStop(1, '#0f766e');
  ctx.fillStyle = band;
  ctx.fillRect(36, 36, WIDTH - 72, 170);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fbbf24';
  ctx.font = '46px Moul';
  ctx.fillText('មជ្ឈមណ្ឌលសិក្សាពេញមួយជីវិត', WIDTH / 2, 112);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px Siemreap, sans-serif';
  ctx.fillText('LIFELONG LEARNING CENTER', WIDTH / 2, 172);

  // Title
  ctx.fillStyle = '#0f172a';
  ctx.font = '44px Moul';
  ctx.fillText('សាលាកបត្រចុះឈ្មោះចូលរៀន', WIDTH / 2, 290);

  // 4x6 photo, cropped to 2:3
  const photoX = 90, photoY = 340, photoW = 320, photoH = 480;
  try {
    const img = await loadImage(r.photo);
    const target = photoW / photoH;
    let sw = img.width, sh = img.height, sx = 0, sy = 0;
    if (sw / sh > target) {
      sw = sh * target;
      sx = (img.width - sw) / 2;
    } else {
      sh = sw / target;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
  } catch {
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(photoX, photoY, photoW, photoH);
  }
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.strokeRect(photoX, photoY, photoW, photoH);

  // Details
  ctx.textAlign = 'left';
  const labelX = 470, valueX = 790, maxValueW = WIDTH - valueX - 90;
  let y = 375;
  const rows: [string, string][] = [
    ['ឈ្មោះ', r.fullNameKh],
    ['Name', r.fullNameEn.toUpperCase()],
    ['ភេទ', r.gender],
    ['ថ្ងៃខែឆ្នាំកំណើត', new Date(r.dateOfBirth).toLocaleDateString('en-GB')],
    ['លេខទូរស័ព្ទ', r.phone],
    ['វគ្គសិក្សា', r.courseTitle],
    ['រយៈពេល', r.courseDuration],
    ['គ្រូបង្រៀន', r.instructorName || '—'],
    ['ថ្ងៃចុះឈ្មោះ', new Date(r.createdAt).toLocaleDateString('en-GB')]
  ];
  for (const [label, value] of rows) {
    ctx.fillStyle = '#64748b';
    ctx.font = '28px Siemreap, sans-serif';
    ctx.fillText(label, labelX, y);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 30px Siemreap, sans-serif';
    // Only the course title may wrap; more lines would run into the footer
    const lines = wrapText(ctx, value, maxValueW).slice(0, label === 'វគ្គសិក្សា' ? 2 : 1);
    lines.forEach((line, i) => ctx.fillText(line, valueX, y + i * 42));
    y += 52 + (lines.length - 1) * 42;
  }

  // Code box
  ctx.fillStyle = '#ecfdf5';
  ctx.fillRect(90, 850, 320, 100);
  ctx.strokeStyle = '#047857';
  ctx.lineWidth = 3;
  ctx.strokeRect(90, 850, 320, 100);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#047857';
  ctx.font = '22px Siemreap, sans-serif';
  ctx.fillText('លេខកូដ', 250, 882);
  ctx.font = 'bold 40px monospace';
  ctx.fillText(r.code, 250, 932);

  // Footer instructions
  ctx.textAlign = 'left';
  ctx.fillStyle = '#475569';
  ctx.font = '24px Siemreap, sans-serif';
  ctx.fillText('សូមផ្ញើសាលាកបត្រនេះ (ជា File) ទៅក្រុម Telegram ដើម្បីផ្ទៀងផ្ទាត់។', 470, 900);
  ctx.fillText(`Telegram: @lifelonglerning_bot • លេខកូដ ${r.code}`, 470, 940);
}

export default function RegistrationCard({ registration, onRefresh }: { registration: Registration; onRefresh: () => Promise<void> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(false);
  const verified = Boolean(registration.verifiedAt);

  useEffect(() => {
    let cancelled = false;
    if (canvasRef.current) {
      drawCard(canvasRef.current, registration).then(() => {
        if (!cancelled) setReady(true);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [registration]);

  // Celebrate once Telegram has verified the card
  useEffect(() => {
    if (verified) {
      try {
        confetti({ particleCount: 160, spread: 100, origin: { y: 0.5 } });
      } catch (e) {
        console.error(e);
      }
    }
  }, [verified]);

  // While waiting for the Telegram check, poll for the result
  useEffect(() => {
    if (verified) return;
    const timer = setInterval(() => {
      onRefresh();
    }, 8000);
    return () => clearInterval(timer);
  }, [verified, onRefresh]);

  const download = () => {
    canvasRef.current?.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // The code in the file name lets the Telegram bot verify a card sent as a File
      a.download = `${registration.code}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const check = async () => {
    setChecking(true);
    await onRefresh();
    setChecking(false);
  };

  return (
    <div className="space-y-6">
      {verified ? (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-400 text-white shadow-xl text-center space-y-2">
          <div className="text-3xl">🎉🎊</div>
          <h2 className="font-moul text-xl leading-relaxed">សូមអបអរសាទរ!</h2>
          <p className="text-sm sm:text-base leading-relaxed">
            <strong>{registration.fullNameKh}</strong> បានបំពេញបែបបទជោគជ័យ ✅ វគ្គនេះនឹងដំណើរការតាមការកំណត់។
          </p>
          <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
            សូមរក្សាសន្លឹកសាលាកបត្រ និងឧស្សាហ៍ពិនិត្យតេលេក្រាម ដើម្បីបានព័ត៌មានទាន់ហេតុការណ៍ផ្សេងៗ។ សូមអរគុណ។
          </p>
        </div>
      ) : (
        <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 space-y-3">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <Clock className="w-5 h-5" /> ជំហានចុងក្រោយ៖ ផ្ញើសាលាកបត្រទៅ Telegram
          </div>
          <ol className="list-decimal pl-5 space-y-1 text-sm text-amber-900 leading-relaxed">
            <li>ចុច <strong>ទាញយកសាលាកបត្រ</strong> ខាងក្រោម</li>
            <li>បើកក្រុម Telegram ហើយផ្ញើរូបនោះជា <strong>File</strong> (ឬផ្ញើជារូបថត ហើយសរសេរលេខកូដ <strong className="font-mono">{registration.code}</strong> ក្នុង caption)</li>
            <li>Bot នឹងពិនិត្យ ហើយឆ្លើយតបសារអបអរសាទរ។ ទំព័រនេះនឹងផ្លាស់ប្តូរដោយស្វ័យប្រវត្តិ</li>
          </ol>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded-2xl shadow-lg border border-slate-200 bg-white"
        style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}
        aria-label={`សាលាកបត្រ ${registration.code}`}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={download}
          disabled={!ready}
          className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> ទាញយកសាលាកបត្រ
        </button>
        <a
          href={GROUP_URL || BOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow"
        >
          <Send className="w-4 h-4" /> {GROUP_URL ? 'បើកក្រុម Telegram' : 'បើក Telegram Bot'}
        </a>
        {!verified && (
          <button
            onClick={check}
            disabled={checking}
            className="py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} /> ពិនិត្យស្ថានភាព
          </button>
        )}
      </div>

      {verified && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-semibold">
          <CheckCircle2 className="w-4 h-4" /> បានផ្ទៀងផ្ទាត់ក្នុង Telegram {registration.verifiedBy ? `ដោយ ${registration.verifiedBy}` : ''}
        </p>
      )}
    </div>
  );
}
