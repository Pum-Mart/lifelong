import { ShieldCheck } from 'lucide-react';
import { CONTACT } from '@/lib/contact';

export const metadata = { title: 'គោលការណ៍ | Plllc - Lifelong Learning Center' };

// Plain-language policies describing what the site actually does. Review with the centre
// before publishing.
const SECTIONS = [
  {
    id: 'privacy',
    title: 'គោលការណ៍ឯកជនភាព',
    points: [
      'យើងប្រមូលតែព័ត៌មានចាំបាច់៖ ឈ្មោះ អ៊ីមែល លេខទូរស័ព្ទ រូបថត ៤x៦ (ពេលចុះឈ្មោះចូលរៀន) ព័ត៌មានការបង់ប្រាក់ និងលទ្ធផលសិក្សា។',
      'ព័ត៌មានទាំងនេះប្រើសម្រាប់គ្រប់គ្រងការសិក្សា ចេញវិញ្ញាបនបត្រ និងផ្ញើលិខិតជូនដំណឹងប៉ុណ្ណោះ។',
      'មានតែបុគ្គលិកដែលពាក់ព័ន្ធ (គ្រូនៃវគ្គ ប្រធានមជ្ឈមណ្ឌល គណៈកម្មការ និង Admin) ទេដែលមើលព័ត៌មានរបស់អ្នកបាន។',
      'ពាក្យសម្ងាត់ត្រូវបានរក្សាទុកជាទម្រង់កូដ (hash) ដែលគ្មាននរណាអានបានទេ។',
      'បើអ្នកភ្ជាប់ Telegram លិខិតជូនដំណឹងនឹងផ្ញើទៅ Telegram របស់អ្នកផងដែរ។ អ្នកអាចផ្តាច់បានគ្រប់ពេលនៅទំព័រគណនី។',
      'ការប្តូរភាសាប្រើ Google Translate ដែលផ្ញើអត្ថបទទំព័រទៅ Google តែពេលអ្នកជ្រើសភាសាផ្សេងពីខ្មែរប៉ុណ្ណោះ។'
    ]
  },
  {
    id: 'terms',
    title: 'លក្ខខណ្ឌប្រើប្រាស់',
    points: [
      'គណនីមួយសម្រាប់មនុស្សម្នាក់។ សូមរក្សាពាក្យសម្ងាត់ជាការសម្ងាត់។',
      'វគ្គបង់ថ្លៃបើកឱ្យរៀន បន្ទាប់ពីការបង់ប្រាក់ត្រូវបានផ្ទៀងផ្ទាត់។',
      'តេស្ត កិច្ចការផ្ទះ និងប្រឡង ត្រូវធ្វើដោយខ្លួនឯង។ ប្រឡងបាន ២ ដងក្នុងមួយលើក ការប្រឡងលើកថ្មីត្រូវមានការអនុញ្ញាត។',
      'វិញ្ញាបនបត្រចេញដោយការអនុម័តពីប្រធានមជ្ឈមណ្ឌល គណៈកម្មការ ឬ Admin ហើយមានលេខរៀងសម្រាប់ផ្ទៀងផ្ទាត់។',
      'មេរៀន និងឯកសារសម្រាប់ការសិក្សាផ្ទាល់ខ្លួន មិនត្រូវចែកចាយបន្តដើម្បីរកប្រាក់ទេ។'
    ]
  },
  {
    id: 'inclusion',
    title: 'សេចក្តីថ្លែងការណ៍បរិយាបន្ន',
    points: [
      'មជ្ឈមណ្ឌលស្វាគមន៍អ្នកសិក្សាគ្រប់វ័យ គ្រប់ភេទ និងគ្រប់កម្រិតការអប់រំ។',
      'គេហទំព័រមានប៊ូតុងពង្រីកអក្សរ (A / A+ / A++) សម្រាប់អ្នកមើលមិនសូវច្បាស់ និងមនុស្សចាស់។',
      'វគ្គឥតគិតថ្លៃ និងការបញ្ចុះតម្លៃសមាជិក ១០% ជួយឱ្យមនុស្សគ្រប់គ្នាអាចចូលរៀនបាន។',
      'ប្រសិនបើអ្នកត្រូវការជំនួយពិសេសក្នុងការចូលរៀន សូមទាក់ទងមកយើង។'
    ]
  }
];

export default function PoliciesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8 font-siemreap">
      <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
        <ShieldCheck className="w-3.5 h-3.5" /> គោលការណ៍ និងលក្ខខណ្ឌ
      </div>
      {SECTIONS.map(s => (
        <section key={s.id} id={s.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-3 scroll-mt-28">
          <h2 className="font-moul text-lg text-slate-900 leading-relaxed">{s.title}</h2>
          <ul className="list-disc pl-6 space-y-2 text-sm text-slate-700 leading-relaxed">
            {s.points.map(p => <li key={p}>{p}</li>)}
          </ul>
        </section>
      ))}
      <p className="text-sm text-slate-600">សំណួរ៖ {CONTACT.phones.join(' / ')} • Telegram @lifelonglerning_bot</p>
    </div>
  );
}
