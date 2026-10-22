'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogIn } from 'lucide-react';

// Shown in place of a page that needs a signed-in user
export default function LoginRequired({ message = 'សូមចូលគណនីជាមុនសិន ដើម្បីមើលទំព័រនេះ' }: { message?: string }) {
  const pathname = usePathname();
  const next = encodeURIComponent(pathname || '/');
  return (
    <div className="max-w-md mx-auto py-24 px-4 text-center space-y-5 font-siemreap">
      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
        <LogIn className="w-8 h-8" />
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href={`/login?next=${next}`} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm">
          ចូលគណនី
        </Link>
        <Link href={`/signup?next=${next}`} className="px-6 py-2.5 rounded-xl border border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-bold text-sm">
          ចុះឈ្មោះជាសមាជិក (-១០%)
        </Link>
      </div>
    </div>
  );
}
