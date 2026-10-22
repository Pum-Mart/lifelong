'use client';

import React, { useState } from 'react';
import { Search, BadgePercent, Send } from 'lucide-react';
import { AccountRole, Instructor, SessionUser, StaffTitle } from '@/types';

interface Props {
  users: SessionUser[];
  instructors: Instructor[];
  currentUserId: string;
  onChanged: (message: string) => void;
  onError: (message: string) => void;
}

const ROLE_LABEL: Record<AccountRole, string> = { student: 'សិស្ស', teacher: 'គ្រូ', admin: 'Admin' };
const TITLE_LABEL: Record<StaffTitle, string> = { director: 'ប្រធានមជ្ឈមណ្ឌល', committee: 'គណៈកម្មការ' };

const selectClass = 'p-1.5 rounded-lg border border-slate-300 text-xs bg-white disabled:opacity-50';

export default function UsersManager({ users, instructors, currentUserId, onChanged, onError }: Props) {
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const rank: Record<AccountRole, number> = { admin: 0, teacher: 1, student: 2 };
  const shown = users
    .filter(u => !q || u.name.toLowerCase().includes(q) || u.email.includes(q))
    .sort((a, b) => rank[a.role] - rank[b.role] || b.createdAt.localeCompare(a.createdAt));

  const update = async (user: SessionUser, changes: Record<string, unknown>, confirmText: string | null, done: string) => {
    if (confirmText && !confirm(confirmText)) return;
    setBusyId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes)
      });
      const data = await res.json();
      if (data.success) onChanged(done);
      else onError(data.error || 'កែប្រែមិនបានទេ');
    } catch {
      onError('មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ');
    } finally {
      setBusyId(null);
    }
  };

  const changeRole = (user: SessionUser, role: AccountRole) => {
    if (role === 'teacher') {
      const instructorId = user.instructorId || instructors[0]?.id;
      if (!instructorId) return onError('សូមបន្ថែមប្រវត្តិរូបគ្រូជាមុនសិន');
      return update(user, { role, instructorId }, `កំណត់ ${user.name} ជាគ្រូ?`, `${user.name} ឥឡូវជាគ្រូ`);
    }
    const confirmText = role === 'admin'
      ? `ផ្តល់សិទ្ធិ Admin ទៅ ${user.name} (${user.email})? គាត់នឹងអាចកែតម្លៃ អនុម័តការបង់ប្រាក់ និងផ្តល់សិទ្ធិ Admin បន្ត។`
      : `ប្តូរ ${user.name} ទៅជាសិស្ស?`;
    return update(user, { role }, confirmText, `${user.name} ឥឡូវជា${ROLE_LABEL[role]}`);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5 font-siemreap">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">គណនី តួនាទី និងសិទ្ធិ</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            កំណត់ <strong>គ្រូ</strong> (ភ្ជាប់នឹងប្រវត្តិរូបគ្រូ ដើម្បីកត់វត្តមានវគ្គរបស់ខ្លួន) <strong>Admin</strong> និង<strong>ប្រធានមជ្ឈមណ្ឌល / គណៈកម្មការ</strong> (ទទួលរបាយការណ៍ប្រចាំសប្តាហ៍)។
            ម្ចាស់គេហទំព័រ (ADMIN_EMAILS) មិនអាចដកសិទ្ធិបានទេ។
          </p>
        </div>
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ស្វែងរកឈ្មោះ ឬអ៊ីមែល"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider">
              <th className="pb-3 font-semibold">ឈ្មោះ / អ៊ីមែល</th>
              <th className="pb-3 font-semibold">តួនាទី</th>
              <th className="pb-3 font-semibold">មុខងារមជ្ឈមណ្ឌល</th>
              <th className="pb-3 font-semibold">សមាជិក</th>
              <th className="pb-3 font-semibold text-right">Telegram</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map(user => {
              const isSelf = user.id === currentUserId;
              const busy = busyId === user.id;
              const roleLocked = user.isOwner || isSelf;
              return (
                <tr key={user.id} className="align-top">
                  <td className="py-3 pr-4">
                    <div className="font-semibold text-slate-900">{user.name}{isSelf && <span className="text-slate-400 font-normal"> (អ្នក)</span>}</div>
                    <div className="text-[11px] text-slate-500">{user.email}</div>
                  </td>
                  <td className="py-3 pr-4 space-y-1.5">
                    {roleLocked ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                        {user.isOwner ? 'ម្ចាស់ / Admin' : ROLE_LABEL[user.role]}
                      </span>
                    ) : (
                      <select value={user.role} disabled={busy} onChange={e => changeRole(user, e.target.value as AccountRole)} className={selectClass} aria-label={`តួនាទី ${user.name}`}>
                        {(Object.keys(ROLE_LABEL) as AccountRole[]).map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                      </select>
                    )}
                    {user.role === 'teacher' && (
                      <select
                        value={user.instructorId || ''}
                        disabled={busy}
                        onChange={e => update(user, { role: 'teacher', instructorId: e.target.value }, null, `បានភ្ជាប់ ${user.name} ទៅប្រវត្តិរូបគ្រូ`)}
                        className={`${selectClass} block max-w-[12rem]`}
                        aria-label={`ប្រវត្តិរូបគ្រូ ${user.name}`}
                      >
                        {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <select
                      value={user.staffTitle || ''}
                      disabled={busy}
                      onChange={e => update(user, { staffTitle: e.target.value || null }, null, `បានកែមុខងាររបស់ ${user.name}`)}
                      className={selectClass}
                      aria-label={`មុខងារ ${user.name}`}
                    >
                      <option value="">—</option>
                      {(Object.keys(TITLE_LABEL) as StaffTitle[]).map(t => <option key={t} value={t}>{TITLE_LABEL[t]}</option>)}
                    </select>
                  </td>
                  <td className="py-3 pr-4">
                    <button
                      disabled={busy}
                      onClick={() =>
                        update(
                          user,
                          { isMember: !user.isMember },
                          user.isMember ? `ដកសមាជិកភាពពី ${user.name}?` : `ផ្តល់សមាជិកភាព (-10%) ទៅ ${user.name}?`,
                          user.isMember ? `បានដកសមាជិកភាពពី ${user.name}` : `${user.name} ឥឡូវជាសមាជិក`
                        )
                      }
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-bold disabled:opacity-50 ${user.isMember ? 'bg-emerald-100 text-emerald-800' : 'border border-slate-300 text-slate-500 hover:bg-slate-50'}`}
                    >
                      <BadgePercent className="w-3.5 h-3.5" /> {user.isMember ? '-10%' : 'ធ្វើជាសមាជិក'}
                    </button>
                  </td>
                  <td className="py-3 text-right">
                    {user.telegramLinked ? (
                      <span className="inline-flex items-center gap-1 text-sky-700 font-bold"><Send className="w-3.5 h-3.5" /> បានភ្ជាប់</span>
                    ) : (
                      <span className="text-slate-400">មិនទាន់</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {shown.length === 0 && <p className="text-sm text-slate-400 py-6 text-center">រកមិនឃើញគណនី</p>}
      </div>
    </div>
  );
}
