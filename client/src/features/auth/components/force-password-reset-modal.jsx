import { useState } from 'react';
import { useAuthStore } from '@/app/store/auth-store';
import { useUpdateMe } from '@/features/auth/hooks';
import { Lock, AlertCircle, KeyRound, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ForcePasswordResetModal() {
  const user = useAuthStore((state) => state.user);
  const updateMeMutation = useUpdateMe();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);

  if (!user || !user.forcePasswordReset) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }

    updateMeMutation.mutate({ password });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-md max-h-full overflow-y-auto rounded-2xl bg-white shadow-2xl flex flex-col">
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-neutral-900/10 z-10" />

        {/* Header Ribbon */}
        <div className="shrink-0 bg-rose-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Lock className="h-5 w-5" />
            <h2 className="text-sm font-semibold tracking-wide uppercase">Security Required</h2>
          </div>
          <h1 className="text-lg font-bold tracking-tighter text-white">LuxuryStay</h1>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <KeyRound className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-neutral-900">Set New Password</h3>
            <p className="mt-2 text-sm text-neutral-500">
              Welcome, <span className="font-semibold text-neutral-900">{user.firstName}</span>! Before accessing your portal, you must update your temporary password to a secure one.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">New Password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border-0 bg-neutral-100 px-4 py-3.5 text-sm ring-1 ring-inset ring-neutral-200 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-rose-600 transition-all"
                  placeholder="At least 8 characters"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Confirm Password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border-0 bg-neutral-100 px-4 py-3.5 text-sm ring-1 ring-inset ring-neutral-200 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-rose-600 transition-all"
                  placeholder="Type new password again"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 rounded-xl bg-orange-50 p-4 text-orange-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-4 text-blue-800">
               <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
               <p className="text-[13px] leading-relaxed">
                 Updating your password will securely log out any other active sessions. You will be able to access your dashboard immediately after.
               </p>
            </div>

            <Button
              type="submit"
              disabled={updateMeMutation.isPending || !password || !confirmPassword}
              className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-sm font-medium transition-all focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {updateMeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating security...
                </>
              ) : (
                'Secure Account & Continue'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
