import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AuthFormShell } from '@/features/auth/components/auth-form-shell';
import { AuthPageLayout } from '@/features/auth/components/auth-page-layout';
import { useLogin } from '@/features/auth/hooks';
import { loginSchema } from '@/features/auth/schemas';
import { getApiErrorMessage } from '@/lib/api-error';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const [showPassword, setShowPassword] = useState(false);
  const { mutateAsync, isPending, error } = useLogin((path) => {
    if (returnTo && returnTo.startsWith('/')) {
      navigate(returnTo);
    } else {
      navigate(path);
    }
  });
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <AuthPageLayout
      title="Guest access shaped for a premium stay."
      description="Sign in to review reservations, invoices, notifications, and guest services from one polished account."
    >
      <AuthFormShell
        eyebrow="Guest sign in"
        title="Welcome back"
        description="Use your email and password to continue into the guest account area."
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link to="/forgot-password" className="font-medium text-[var(--primary)]">
              Forgot password?
            </Link>
            <Link to={returnTo ? `/register?returnTo=${encodeURIComponent(returnTo)}` : "/register"} className="font-medium text-[var(--accent)]">
              Create guest account
            </Link>
          </div>
        }
      >
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            await mutateAsync(values);
          })}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground)]">Email address</label>
            <input
              id="login-email"
              autoComplete="email"
              placeholder="guest@luxurystay.com"
              className="w-full rounded-[22px] border border-[var(--border)] bg-white px-4 py-3"
              {...form.register('email')}
            />
            <p className="text-sm text-rose-600">{form.formState.errors.email?.message}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground)]">Password</label>
            <div className="flex items-center rounded-[22px] border border-[var(--border)] bg-white px-4">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full border-0 bg-transparent py-3 outline-none"
                {...form.register('password')}
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
            <p className="text-sm text-rose-600">{form.formState.errors.password?.message}</p>
          </div>

          {error ? <p className="text-sm text-rose-600">{getApiErrorMessage(error, 'Unable to sign in right now.')}</p> : null}

          <div className="rounded-[22px] border border-[var(--border)] bg-[var(--accent-soft)]/45 px-4 py-4 text-sm leading-7 text-[var(--muted-foreground)]">
            Reservations, invoices, and stay updates remain connected to this secure guest account after sign-in.
          </div>

          <Button type="submit" className="w-full rounded-full py-3" disabled={isPending}>
            {isPending ? 'Signing in...' : 'Continue to guest account'}
          </Button>
        </form>
      </AuthFormShell>
    </AuthPageLayout>
  );
};
