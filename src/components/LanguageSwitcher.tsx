'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Globe, Check } from 'lucide-react';

// Whole-site translation through Google Website Translator. The page is written in Khmer;
// picking another language sets Google's `googtrans` cookie and reloads. Google's script is
// only loaded once a non-Khmer language is chosen, so Khmer visitors send nothing to Google.
export const LANGUAGES = [
  { code: 'km', label: 'ខ្មែរ' },
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: '中文' },
  { code: 'fr', label: 'Français' },
  { code: 'th', label: 'ไทย' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'lo', label: 'ລາວ' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ru', label: 'Русский' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ar', label: 'العربية' }
];

function currentLanguage(): string {
  const match = document.cookie.match(/(?:^|;\s*)googtrans=\/[^/]+\/([^;]+)/);
  return match ? decodeURIComponent(match[1]) : 'km';
}

function setLanguage(code: string) {
  const expire = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
  const host = window.location.hostname;
  // Google reads the cookie on both the host and its parent domain, so clear/set both
  for (const domain of ['', `; domain=${host}`, `; domain=.${host.split('.').slice(-2).join('.')}`]) {
    document.cookie = `googtrans=; path=/${domain}; ${expire}`;
    if (code !== 'km') document.cookie = `googtrans=/km/${code}; path=/${domain}`;
  }
  window.location.reload();
}

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: { translate: { TranslateElement: new (options: object, elementId: string) => unknown } };
  }
}

// `mounted` comes from the Navbar so the first render matches the server HTML
export default function LanguageSwitcher({ mounted }: { mounted: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const lang = mounted ? currentLanguage() : 'km';
  const active = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  // Load Google's translator only when a translation is active
  useEffect(() => {
    if (!mounted || currentLanguage() === 'km' || document.getElementById('google-translate-script')) return;
    window.googleTranslateElementInit = () => {
      if (window.google) new window.google.translate.TranslateElement({ pageLanguage: 'km', autoDisplay: false }, 'google_translate_element');
    };
    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);
  }, [mounted]);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative notranslate" translate="no">
      <div id="google_translate_element" className="hidden" />
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs bg-emerald-900 hover:bg-emerald-800 text-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-700 transition"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="ប្តូរភាសា / Change language"
      >
        <Globe className="w-3.5 h-3.5 text-amber-300" />
        <span className="font-medium">{active.label}</span>
      </button>
      {open && (
        <ul role="listbox" className="absolute right-0 mt-1 w-44 max-h-80 overflow-y-auto bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-800 p-1.5 z-50">
          {LANGUAGES.map(l => (
            <li key={l.code}>
              <button
                role="option"
                aria-selected={l.code === lang}
                onClick={() => (l.code === lang ? setOpen(false) : setLanguage(l.code))}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs ${l.code === lang ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-slate-50'}`}
              >
                {l.label}
                {l.code === lang && <Check className="w-3.5 h-3.5" />}
              </button>
            </li>
          ))}
          <li className="px-3 pt-2 pb-1 text-[10px] text-slate-400 border-t border-slate-100 mt-1">Translated by Google</li>
        </ul>
      )}
    </div>
  );
}
