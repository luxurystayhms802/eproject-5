import { useEffect, useState } from 'react';
import { KeyRound, Mail, ShieldCheck, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/app/store/auth-store';
import { AdminImageUploader } from '@/features/admin/components/admin-image-uploader';
import { adminInputClassName, adminLabelClassName, adminLabelTextClassName } from '@/features/admin/config';
import { useMyProfile, useUpdateMe } from '@/features/auth/hooks';

const createInitialForm = (user) => ({
  firstName: user?.firstName ?? '',
  lastName: user?.lastName ?? '',
  email: user?.email ?? '',
  phone: user?.phone ?? '',
  avatarUrl: user?.avatarUrl ?? null,
  password: '',
});

const validateProfileForm = (form) => {
  if (!form.firstName.trim()) return 'First name is required';
  if (!form.lastName.trim()) return 'Last name is required';
  if (!form.email.trim()) return 'Email address is required';
  if (!form.phone.trim()) return 'Phone number is required';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(form.email)) return 'Please provide a valid email address';

  const phoneRegex = /^[0-9+\-\s()]{5,20}$/;
  if (!phoneRegex.test(form.phone.trim())) return 'Please provide a valid phone number';

  if (form.password && form.password.length < 6) {
    return 'Password must be at least 6 characters long';
  }

  return null;
};

export const StaffProfilePage = () => {
  const authUser = useAuthStore((state) => state.user);
  const profileQuery = useMyProfile();
  const updateMe = useUpdateMe();
  const [form, setForm] = useState(createInitialForm(authUser));

  useEffect(() => {
    if (profileQuery.data) {
      setForm(createInitialForm(profileQuery.data));
    }
  }, [profileQuery.data]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = validateProfileForm(form);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    try {
      await updateMe.mutateAsync({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        avatarUrl: form.avatarUrl || null,
        ...(form.password.trim() ? { password: form.password.trim() } : {}),
      });

      setForm((current) => ({ ...current, password: '' }));
    } catch {
      // Mutation hook already shows a toast.
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Manage your personal identity, profile image, contact details, and password from a secure self-service control page."
        action={
          <Button type="submit" form="staff-profile-form" variant="secondary" disabled={updateMe.isPending}>
            {updateMe.isPending ? 'Saving...' : 'Save profile'}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Role" value={authUser?.role?.replace('_', ' ') ?? 'staff'} description="Current authenticated identity controlling this portal." icon={ShieldCheck} />
        <StatsCard title="Contact" value={form.email || 'n/a'} description="Email identity tied to the current account." icon={Mail} />
        <StatsCard title="Profile" value={form.firstName ? 'Ready' : 'Pending'} description="Whether the account profile contains usable identity information." icon={UserCog} />
        <StatsCard title="Security" value="Active" description="Password changes are hashed and saved through the secure user update flow." icon={KeyRound} />
      </div>

      <form id="staff-profile-form" className="grid gap-6 xl:grid-cols-[0.85fr,1.15fr]" onSubmit={handleSubmit}>
        <Card className="space-y-5">
          <div>
            <h2 className="text-[28px] text-[var(--primary)] [font-family:var(--font-display)]">Profile image</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Upload an avatar that is stored securely and displayed across your workflows.</p>
          </div>

          <AdminImageUploader
            label="Avatar"
            folder="avatars"
            multiple={false}
            value={form.avatarUrl ? [form.avatarUrl] : []}
            onChange={(images) => setForm((current) => ({ ...current, avatarUrl: images[0] ?? null }))}
            helperText="The uploaded image will be visible on your portal header and action logs."
          />
        </Card>

        <Card className="space-y-5">
          <div>
            <h2 className="text-[28px] text-[var(--primary)] [font-family:var(--font-display)]">Identity & security</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Refine your name, email, phone, and optionally rotate the account password.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className={adminLabelClassName}>
              <span className={adminLabelTextClassName}>First name</span>
              <input className={adminInputClassName} value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} />
            </label>
            <label className={adminLabelClassName}>
              <span className={adminLabelTextClassName}>Last name</span>
              <input className={adminInputClassName} value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} />
            </label>
            <label className={adminLabelClassName}>
              <span className={adminLabelTextClassName}>Email</span>
              <input type="email" className={adminInputClassName} value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label className={adminLabelClassName}>
              <span className={adminLabelTextClassName}>Phone</span>
              <input className={adminInputClassName} value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            </label>
            <label className={`${adminLabelClassName} md:col-span-2`}>
              <span className={adminLabelTextClassName}>New password (optional)</span>
              <input
                type="password"
                className={adminInputClassName}
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Leave blank to keep the current password"
              />
            </label>
          </div>
        </Card>
      </form>
    </div>
  );
};
