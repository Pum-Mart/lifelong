'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Certificate } from '@/types';
import DropLogo from '@/components/DropLogo';
import { 
  Award, 
  Printer, 
  Share2, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Calendar, 
  FileCheck,
  QrCode
} from 'lucide-react';

interface Access {
  isOwner: boolean;
  isApprover: boolean;
  canDownload: boolean;
  downloadsLeft: number | null;
  perGrant: number;
  pendingRequest: boolean;
  lastRejected: { reviewNote?: string; reviewedBy?: string } | null;
  neverGranted: boolean; // free-study certificate not yet handed over
}

// Printing only works through this button: globals.css hides the certificate when printing
// unless <html> carries .print-allowed, which is set after the server counts the download.
function DownloadControls({ certId, access, onChange }: { certId: string; access: Access | null; onChange: (a: Access) => void }) {
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  if (!access || (!access.isOwner && !access.isApprover)) {
    return <span className="text-[11px] text-slate-400">ទិដ្ឋភាពផ្ទៀងផ្ទាត់ • មានតែម្ចាស់ទើបទាញយកបាន</span>;
  }

  const download = async () => {
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch(`/api/certificates/${certId}/download`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) {
        setMessage(data.error || 'ទាញយកមិនបានទេ');
        return;
      }
      if (data.downloadsLeft !== null) onChange({ ...access, downloadsLeft: data.downloadsLeft, canDownload: data.downloadsLeft > 0 });
      const html = document.documentElement;
      html.classList.add('print-allowed');
      window.addEventListener('afterprint', () => html.classList.remove('print-allowed'), { once: true });
      window.print();
    } finally {
      setBusy(false);
    }
  };

  const sendRequest = async () => {
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch(`/api/certificates/${certId}/download-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (data.success) {
        onChange({ ...access, pendingRequest: true });
        setShowForm(false);
      } else {
        setMessage(data.error || 'បញ្ជូនមិនបានទេ');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {access.canDownload ? (
        <button onClick={download} disabled={busy} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow transition disabled:opacity-50">
          <Printer className="w-4 h-4" />
          <span>ទាញយក / បោះពុម្ព PDF{access.downloadsLeft !== null && ` (នៅសល់ ${access.downloadsLeft}/${access.perGrant} ដង)`}</span>
        </button>
      ) : access.pendingRequest ? (
        <span className="px-3 py-2 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold">សំណើទាញយកកំពុងរង់ចាំការអនុម័ត</span>
      ) : (
        <button onClick={() => setShowForm(s => !s)} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs">
          {access.neverGranted ? 'ស្នើសុំទទួលវិញ្ញាបនបត្រ' : 'ស្នើសុំទាញយកម្តងទៀត'}
        </button>
      )}
      {access.lastRejected && !access.canDownload && !access.pendingRequest && (
        <span className="text-[11px] text-red-600">សំណើមុនត្រូវបានបដិសេធ{access.lastRejected.reviewNote ? `៖ ${access.lastRejected.reviewNote}` : ''}</span>
      )}
      {showForm && (
        <div className="w-full sm:w-80 space-y-2">
          <p className="text-[11px] text-slate-500">
            {access.neverGranted
              ? 'វិញ្ញាបនបត្រផ្នែកឥតបង់ថ្លៃ ត្រូវប្រគល់ដោយការអនុញ្ញាតពីប្រធានមជ្ឈមណ្ឌល គណៈកម្មការ ឬ Admin។ សូមសរសេរសំណើ។'
              : `អ្នកបានទាញយកគ្រប់ ${access.perGrant} ដងហើយ។ សូមសរសេរមូលហេតុ ដើម្បីស្នើសុំប្រធានមជ្ឈមណ្ឌល គណៈកម្មការ ឬ Admin។`}
          </p>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder={access.neverGranted ? 'ឧ. សូមស្នើសុំទទួលវិញ្ញាបនបត្រ ដើម្បីដាក់ពាក្យការងារ...' : 'ឧ. បាត់ឯកសារដែលបានបោះពុម្ព...'} className="w-full p-2 rounded-xl border border-slate-300 text-xs" />
          <button onClick={sendRequest} disabled={busy} className="w-full px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-50">បញ្ជូនសំណើ</button>
        </div>
      )}
      {message && <span role="alert" className="text-[11px] text-red-600">{message}</span>}
    </div>
  );
}

function CertificateContent() {
  const params = useParams();
  const certId = params?.id as string;
  const [cert, setCert] = useState<Certificate | null>(null);
  const [access, setAccess] = useState<Access | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCert() {
      try {
        setLoading(true);
        const res = await fetch(`/api/certificates/${certId}`);
        const data = await res.json();
        if (data.success) {
          setCert(data.certificate);
          setAccess(data.access);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (certId) loadCert();
  }, [certId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 text-sm">កំពុងផ្ទៀងផ្ទាត់វិញ្ញាបនបត្រ...</p>
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Certificate Not Found</h2>
        <p className="text-slate-500 text-sm">The requested credential record could not be found or has expired.</p>
        <Link href="/" className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 space-y-8">
      {/* Top Toolbar (Hidden when printing) */}
      <div className="no-print max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/my-learning"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Official Credential</span>
            </div>
            <div className="text-xs text-slate-500">
              លេខរៀង: <strong className="font-mono text-slate-700">{cert.certificateCode}</strong>
            </div>
          </div>
        </div>

        <DownloadControls certId={cert.id} access={access} onChange={setAccess} />
      </div>

      {/* Official Certificate Canvas */}
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-14 rounded-3xl shadow-2xl border-8 border-double border-emerald-900/80 certificate-card relative overflow-hidden">
        {/* Subtle Watermark */}
        <div className="absolute inset-0 opacity-[0.03] flex items-center justify-center pointer-events-none">
          <Award className="w-[500px] h-[500px] text-emerald-950" />
        </div>

        {/* Ornate Corner Accents */}
        <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-amber-600" />
        <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-amber-600" />
        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-amber-600" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-amber-600" />

        <div className="relative text-center space-y-8 py-4">
          {/* Header Seal */}
          <div className="space-y-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-800 to-indigo-950 text-amber-400 flex items-center justify-center mx-auto shadow-md border-2 border-amber-500">
              <Award className="w-9 h-9" />
            </div>
            <div className="text-xs font-bold tracking-[0.25em] text-emerald-900 uppercase">
              មជ្ឈមណ្ឌលសិក្សាពេញមួយជីវិត • Lifelong Learning Center
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 tracking-tight">
              Certificate of Academic Mastery
            </h1>
            <p className="text-xs font-medium text-slate-500 tracking-wide uppercase">
              Lifelong Learning & Professional Advancement
            </p>
            <p className="text-sm font-bold text-emerald-900">លេខរៀង៖ <span className="font-mono">{cert.certificateCode}</span></p>
          </div>

          {/* Recipient */}
          <div className="space-y-2 pt-2">
            <p className="text-xs text-slate-500 italic">This is proudly conferred upon</p>
            <h2 className="text-3xl sm:text-5xl font-serif font-extrabold text-emerald-950 tracking-tight underline decoration-amber-400/50 decoration-2 underline-offset-8">
              {cert.studentName}
            </h2>
            <p className="text-xs text-slate-500 max-w-lg mx-auto pt-4 leading-relaxed">
              for outstanding dedication, active participation, and the exemplary completion of the accredited curriculum in:
            </p>
          </div>

          {/* Course Name */}
          <div className="py-2">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 max-w-xl mx-auto">
              {cert.courseTitle}
            </h3>
            {cert.ceus && (
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                {cert.ceus} Continuing Education Units (CEUs)
                {/* Paid-course certificates deliberately carry no score */}
                {cert.grade && <> • ពិន្ទុ: {cert.grade}</>}
              </span>
            )}
          </div>

          {/* Signatures & Seal Bar */}
          {/* Seal and the single signature of the centre director */}
          <div className="pt-10 grid grid-cols-1 sm:grid-cols-2 gap-8 items-end border-t border-slate-200 text-xs">
            <div className="flex flex-col items-center space-y-1">
              <DropLogo width={64} alt="" />
              <span className="text-[10px] text-slate-400 font-mono">ចេញថ្ងៃ {cert.issueDate}</span>
            </div>

            <div className="space-y-1 text-center">
              <div className="text-[11px] text-slate-500">ប្រធានមជ្ឈមណ្ឌល</div>
              <div className="font-serif italic text-base text-slate-800 font-semibold min-h-8 flex items-end justify-center">
                {cert.signedBy || ''}
              </div>
              <div className="border-t border-slate-400 pt-1 font-bold text-slate-700">
                ប្រធានមជ្ឈមណ្ឌលសិក្សាពេញមួយជីវិត (Center Director)
              </div>
            </div>
          </div>

          {/* Verification Footer */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2 border-t border-slate-100">
            <div>
              លេខរៀងវិញ្ញាបនបត្រ (Certificate No.): <strong className="font-mono text-slate-700">{cert.certificateCode}</strong>
              {cert.certificateCode.startsWith('Lllcf-') && <span className="ml-1">• ផ្នែកឥតបង់ថ្លៃ</span>}
              {cert.certificateCode.startsWith('Lllc-') && <span className="ml-1">• ផ្នែកបង់ថ្លៃ</span>}
            </div>
            <div>
              Status: <span className="text-emerald-700 font-bold">Active & Permanently Verifiable</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CertificatePage() {
  return (
    <React.Suspense fallback={<div className="max-w-4xl mx-auto py-24 text-center text-slate-500">Loading certificate record...</div>}>
      <CertificateContent />
    </React.Suspense>
  );
}
