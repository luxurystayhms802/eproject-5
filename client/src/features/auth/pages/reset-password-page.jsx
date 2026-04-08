import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AuthFormShell } from '@/features/auth/components/auth-form-shell';
import { AuthPageLayout } from '@/features/auth/components/auth-page-layout';
import { useResetPassword } from '@/features/auth/hooks';
import { resetPasswordSchema } from '@/features/auth/schemas';
import { getApiErrorMessage } from '@/lib/api-error';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { mutateAsync, isPending, error } = useResetPassword(navigate);
  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: params.get('token') ?? '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  return (
    <AuthPageLayout
      title="Choose a fresh password and return to your guest account."
      description="Set a new password through the secure recovery flow and return to your guest account."
    >
      <AuthFormShell
        eyebrow="Reset password"
        title="Set a new password"
        description="Provide the reset token and choose a strong new password that meets the account rules."
      >
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            await mutateAsync(values);
          })}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">Reset token</label>
            <input id="reset-token" placeholder="Paste your reset token" className="w-full rounded-[22px] border border-[var(--border)] bg-white px-4 py-3" {...form.register('token')} />
            <p className="text-sm text-rose-600">{form.formState.errors.token?.message}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">New password</label>
            <div className="flex items-center rounded-[22px] border border-[var(--border)] bg-white px-4">
              <input
                id="reset-new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Enter a strong new password"
                className="w-full border-0 bg-transparent py-3 outline-none"
                {...form.register('newPassword')}
              />
              <button
                type="button"
                className="text-[var(--muted-foreground)] transition hover:text-[var(--primary)]"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-sm text-rose-600">{form.formState.errors.newPassword?.message}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm password</label>
            <div className="flex items-center rounded-[22px] border border-[var(--border)] bg-white px-4">
              <input
                id="reset-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Confirm the new password"
                className="w-full border-0 bg-transparent py-3 outline-none"
                {...form.register('confirmPassword')}
              />
              <button
                type="button"
                className="text-[var(--muted-foreground)] transition hover:text-[var(--primary)]"
                onClick={() => setShowConfirmPassword((current) => !current)}
                aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-sm text-rose-600">{form.formState.errors.confirmPassword?.message}</p>
          </div>

          <p className="text-xs leading-6 text-[var(--muted-foreground)]">
            Your new password must include uppercase, lowercase, a number, and a special character.
          </p>
          <div className="rounded-[22px] border border-[var(--border)] bg-[var(--accent-soft)]/45 px-4 py-4 text-sm leading-7 text-[var(--muted-foreground)]">
            Once updated, the new password will be used across the guest website and account area.
          </div>

          {error ? <p className="text-sm text-rose-600">{getApiErrorMessage(error, 'Unable to reset the password.')}</p> : null}

          <Button type="submit" className="w-full rounded-full py-3" disabled={isPending}>
            {isPending ? 'Updating...' : 'Reset password'}
          </Button>
        </form>
      </AuthFormShell>
    </AuthPageLayout>
  );
};
