import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AuthFormShell } from '@/features/auth/components/auth-form-shell';
import { AuthPageLayout } from '@/features/auth/components/auth-page-layout';
import { useForgotPassword } from '@/features/auth/hooks';
import { forgotPasswordSchema } from '@/features/auth/schemas';
import { getApiErrorMessage } from '@/lib/api-error';

export const ForgotPasswordPage = () => {
  const { mutateAsync, isPending, error } = useForgotPassword();
  const form = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  return (
    <AuthPageLayout
      title="Password recovery designed to stay clear and low-friction."
      description="Submit the guest email address to begin the secure password reset flow."
    >
      <AuthFormShell
        eyebrow="Recovery"
        title="Forgot password?"
        description="Enter the email connected to your guest account and continue into recovery."
        footer={<Link to="/login" className="font-medium text-[var(--primary)]">Back to sign in</Link>}
      >
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            await mutateAsync(values);
          })}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">Email address</label>
            <input id="forgot-password-email" autoComplete="email" placeholder="guest@luxurystay.com" className="w-full rounded-[22px] border border-[var(--border)] bg-white px-4 py-3" {...form.register('email')} />
            <p className="text-sm text-rose-600">{form.formState.errors.email?.message}</p>
          </div>

          {error ? <p className="text-sm text-rose-600">{getApiErrorMessage(error, 'Unable to start password reset.')}</p> : null}

          <div className="rounded-[22px] border border-[var(--border)] bg-[var(--accent-soft)]/45 px-4 py-4 text-sm leading-7 text-[var(--muted-foreground)]">
            Recovery stays simple for guests while preserving account security.
          </div>

          <Button type="submit" className="w-full rounded-full py-3" disabled={isPending}>
            {isPending ? 'Submitting...' : 'Send reset instructions'}
          </Button>
        </form>
      </AuthFormShell>
    </AuthPageLayout>
  );
};
