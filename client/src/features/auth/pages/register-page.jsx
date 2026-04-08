import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AuthFormShell } from '@/features/auth/components/auth-form-shell';
import { AuthPageLayout } from '@/features/auth/components/auth-page-layout';
import { useRegister } from '@/features/auth/hooks';
import { registerSchema } from '@/features/auth/schemas';
import { getApiErrorMessage } from '@/lib/api-error';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { mutateAsync, isPending, error } = useRegister((path) => {
    if (returnTo && returnTo.startsWith('/')) {
      navigate(returnTo);
    } else {
      navigate(path);
    }
  });
  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  return (
    <AuthPageLayout
      title="Create a guest account with the same polish as the stay itself."
      description="Create a guest account for reservations, invoices, service requests, and post-stay access."
    >
      <AuthFormShell
        eyebrow="Guest registration"
        title="Join LuxuryStay"
        description="Create a secure guest account in a few steps with strong password and contact validation."
        footer={<Link to={returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login"} className="font-medium text-[var(--primary)]">Already have an account? Sign in</Link>}
      >
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={form.handleSubmit(async (values) => {
            await mutateAsync(values);
          })}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">First name</label>
            <input
              id="register-first-name"
              autoComplete="given-name"
              placeholder="First name"
              className="w-full rounded-[22px] border border-[var(--border)] bg-white px-4 py-3"
              {...form.register('firstName', {
                onChange: (e) => {
                  e.target.value = e.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                },
              })}
            />
            <p className="text-sm text-rose-600">{form.formState.errors.firstName?.message}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Last name</label>
            <input
              id="register-last-name"
              autoComplete="family-name"
              placeholder="Last name"
              className="w-full rounded-[22px] border border-[var(--border)] bg-white px-4 py-3"
              {...form.register('lastName', {
                onChange: (e) => {
                  e.target.value = e.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                },
              })}
            />
            <p className="text-sm text-rose-600">{form.formState.errors.lastName?.message}</p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Email address</label>
            <input id="register-email" autoComplete="email" placeholder="guest@luxurystay.com" className="w-full rounded-[22px] border border-[var(--border)] bg-white px-4 py-3" {...form.register('email')} />
            <p className="text-sm text-rose-600">{form.formState.errors.email?.message}</p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Phone number</label>
            <input
              id="register-phone"
              autoComplete="tel"
              placeholder="+92 300 1234567"
              className="w-full rounded-[22px] border border-[var(--border)] bg-white px-4 py-3"
              {...form.register('phone', {
                onChange: (e) => {
                  e.target.value = e.target.value.replace(/[^0-9+]/g, '');
                },
              })}
            />
            <p className="text-sm text-rose-600">{form.formState.errors.phone?.message}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <div className="flex items-center rounded-[22px] border border-[var(--border)] bg-white px-4">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Create a strong password"
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm password</label>
            <div className="flex items-center rounded-[22px] border border-[var(--border)] bg-white px-4">
              <input
                id="register-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Confirm your password"
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
          <p className="md:col-span-2 text-xs leading-6 text-[var(--muted-foreground)]">
            Use at least 8 characters including uppercase, lowercase, a number, and a special character.
          </p>
          <div className="md:col-span-2 rounded-[22px] border border-[var(--border)] bg-[var(--accent-soft)]/45 px-4 py-4 text-sm leading-7 text-[var(--muted-foreground)]">
            This account will keep your reservations, invoices, stay updates, and guest service requests in one elegant place.
          </div>
          {error ? <p className="md:col-span-2 text-sm text-rose-600">{getApiErrorMessage(error, 'Unable to create the guest account.')}</p> : null}
          <Button type="submit" variant="secondary" className="md:col-span-2 rounded-full py-3" disabled={isPending}>
            {isPending ? 'Creating account...' : 'Create guest account'}
          </Button>
        </form>
      </AuthFormShell>
    </AuthPageLayout>
  );
};
