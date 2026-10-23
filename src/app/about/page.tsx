import { Suspense } from 'react';
import { io } from 'next/cache';
import { Info, CheckCircle, BookOpen, Briefcase, Sparkles, Sprout, Award, ShieldCheck, Building2, Users, Camera } from 'lucide-react';
import { getActivities } from '@/lib/content';
import { runWithDatabase } from '@/lib/store';
import ActivitySlideshow from '@/components/ActivitySlideshow';

export const metadata = { title: 'អំពីមជ្ឈមណ្ឌល | Plllc - Lifelong Learning Center' };

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12 font-siemreap">
      {/* Teaching activities, newest first, changing every 5 seconds */}
      <section className="space-y-4">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
          <Camera className="w-3.5 h-3.5" />
          <span>សកម្មភាពបង្ហាត់បង្រៀន</span>
        </div>
        <Suspense fallback={<div className="aspect-[16/7] rounded-3xl bg-slate-200 animate-pulse" />}>
          <Slides />
        </Suspense>
      </section>

        {/* ======================================================== */}
        {/* 02 ABOUT LLLC: MISSION, SERVICES, POLICY, INFO           */}
        {/* ======================================================== */}
        <section className="space-y-8">
          <div className="border-b border-slate-200 pb-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
              <Info className="w-3.5 h-3.5" />
              <span>អំពីមជ្ឈមណ្ឌលសិក្សាពេញមួយជីវិត (About LLLc)</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-moul text-slate-900 mt-2 leading-relaxed">
              ចក្ខុវិស័យ បេសកកម្ម និងគោលនយោបាយជាតិ
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              ស្វែងយល់អំពីគោលបំណង សេវាកម្មចម្បង និងក្របខ័ណ្ឌគោលនយោបាយស្តីពីការសិក្សាពេញមួយជីវិតនៅកម្ពុជា។
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Mission & Vision */}
            <div className="bg-gradient-to-br from-emerald-950 to-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="inline-block px-3 py-1 rounded-full bg-emerald-800 text-emerald-200 text-xs font-bold">
                  បេសកកម្មរបស់យើង (Our Mission)
                </div>
                <h3 className="text-lg sm:text-xl font-moul leading-relaxed text-amber-300">
                  គ្មាននរណាម្នាក់ត្រូវបានទុកចោលក្រៅការរៀនសូត្រឡើយ
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  មជ្ឈមណ្ឌលសិក្សាពេញមួយជីវិត LIFELONG LEARNING CENTER មានបេសកកម្មលើកកម្ពស់បរិយាបន្ន និងសមធម៌ក្នុងការអប់រំ 
                  ដោយផ្តល់ឱកាសឱ្យប្រជាពលរដ្ឋកម្ពុជាគ្រប់វ័យ—ចាប់ពីយុវជន មនុស្សពេញវ័យ រហូតដល់មនុស្សវ័យចំណាស់—អាចអភិវឌ្ឍសមត្ថភាព 
                  ជំនាញវិជ្ជាជីវៈ និងចំណេះដឹងឌីជីថល ដើម្បីបង្កើនជីវភាពគ្រួសារ និងរួមចំណែកដល់សង្គមជាតិ។
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>សមធម៌ និងបរិយាបន្ន</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>ការរៀនបត់បែនតាមតម្រូវការ</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>ការទទួលស្គាល់សមត្ថភាព</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>ផ្សារភ្ជាប់ទៅទីផ្សារការងារ</span>
                </div>
              </div>
            </div>

            {/* Core Services */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md">
                  សេវាកម្មចម្បង (Core Services)
                </span>
                <h3 className="text-lg font-moul text-slate-900 mt-2 leading-relaxed">
                  សេវាកម្មអប់រំ និងអភិវឌ្ឍជំនាញសហគមន៍
                </h3>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0"><BookOpen className="w-4 h-4" /></div>
                  <div>
                    <h4 className="font-bold text-slate-900">អក្ខរកម្មមុខងារ & ការអប់រំមូលដ្ឋាន</h4>
                    <p className="text-slate-500 mt-0.5">កម្មវិធីអក្ខរកម្មសម្រាប់មនុស្សពេញវ័យដែលខកខានការរៀនសូត្រពីកុមារ និងការគិតលេខក្នុងជីវភាពប្រចាំថ្ងៃ។</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0"><Briefcase className="w-4 h-4" /></div>
                  <div>
                    <h4 className="font-bold text-slate-900">ការបណ្តុះបណ្តាលជំនាញវិជ្ជាជីវៈ & សហគ្រិនភាព</h4>
                    <p className="text-slate-500 mt-0.5">វគ្គបណ្តុះបណ្តាលខ្លីៗលើការដំឡើងសូឡា ការកែច្នៃម្ហូបអាហារ ការគ្រប់គ្រងហិរញ្ញវត្ថុ និងការលក់អនឡាញ។</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0"><Sparkles className="w-4 h-4" /></div>
                  <div>
                    <h4 className="font-bold text-slate-900">បរិយាបន្នឌីជីថល & បញ្ញាសិប្បនិម្មិត AI</h4>
                    <p className="text-slate-500 mt-0.5">ការបង្រៀនប្រើស្មាតហ្វូន ធនាគារ KHQR និង AI ChatGPT ដល់មនុស្សចាស់ដោយយកចិត្តទុកដាក់ខ្ពស់។</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-lime-100 text-lime-700 flex items-center justify-center shrink-0"><Sprout className="w-4 h-4" /></div>
                  <div>
                    <h4 className="font-bold text-slate-900">កសិកម្មឆ្លាតវៃ & ជំនាញបៃតង</h4>
                    <p className="text-slate-500 mt-0.5">បច្ចេកវិទ្យាដំណក់ទឹក ថាមពលពន្លឺព្រះអាទិត្យបូមទឹក និងការដាំដុះបន្លែសរីរាង្គទប់ទល់នឹងបម្រែបម្រួលអាកាសធាតុ។</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0"><Award className="w-4 h-4" /></div>
                  <div>
                    <h4 className="font-bold text-slate-900">ការទទួលស្គាល់ការសិក្សាពីមុន (RPL Certification)</h4>
                    <p className="text-slate-500 mt-0.5">ការវាយតម្លៃ និងចេញវិញ្ញាបនបត្រជូនអ្នកដែលមានបទពិសោធន៍ការងារជាក់ស្តែងតែគ្មានសញ្ញាបត្រផ្លូវការ។</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Policy & Centre Info Banner */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-2">
              <div className="text-amber-400 font-bold uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>គោលនយោបាយជាតិ (Policy)</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                អនុលោមតាម <strong>គោលនយោបាយជាតិស្តីពីការសិក្សាពេញមួយជីវិត</strong> របស់ក្រសួងអប់រំ យុវជន និងកីឡា និងគោលដៅអភិវឌ្ឍន៍ប្រកបដោយចីរភាព <strong>UNESCO SDG 4</strong>។
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-teal-400 font-bold uppercase flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                <span>បណ្តាញមជ្ឈមណ្ឌល (Centre Footprint)</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                ទីស្នាក់ការកណ្តាលនៅភ្នំពេញ និងមណ្ឌលរណបសហគមន៍នៅខេត្តបាត់ដំបង សៀមរាប កំពង់ចាម និងកំពត គ្របដណ្តប់អ្នកសិក្សាជាង ៥,០០០ នាក់។
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>ការគ្រប់គ្រង (Governance)</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                ដឹកនាំដោយក្រុមប្រឹក្សាគរុកោសល្យ និងសាស្រ្តាចារ្យដែលមានបទពិសោធន៍ខ្ពស់ក្នុងការអប់រំមនុស្សពេញវ័យ និងការអភិវឌ្ឍសហគមន៍។
              </p>
            </div>
          </div>
        </section>

    </div>
  );
}

async function Slides() {
  // Activities are added from /admin/content, so read them per request
  await io();
  return <ActivitySlideshow activities={await runWithDatabase(async () => getActivities())} />;
}