import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-slate-400">កំពុងផ្ទុក...</div>}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
