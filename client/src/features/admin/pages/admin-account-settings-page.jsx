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
import { validateAccountSettingsForm } from '@/features/admin/form-utils';
import { useAdminUpdateUser, useAdminUser } from '@/features/admin/hooks';

const createInitialForm = (user) => ({
  firstName: user?.firstName ?? '',
  lastName: user?.lastName ?? '',
  email: user?.email ?? '',
  phone: user?.phone ?? '',
  avatarUrl: user?.avatarUrl ?? null,
  password: '',
});

export const AdminAccountSettingsPage = () => {
  const authUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const userQuery = useAdminUser(authUser?.id);
  const updateUser = useAdminUpdateUser();
  const [form, setForm] = useState(createInitialForm(authUser));

  useEffect(() => {
    if (userQuery.data) {
      setForm(createInitialForm(userQuery.data));
    }
  }, [userQuery.data]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = validateAccountSettingsForm(form);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    try {
      const updated = await updateUser.mutateAsync({
        userId: authUser.id,
        payload: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          avatarUrl: form.avatarUrl || null,
          ...(form.password.trim() ? { password: form.password.trim() } : {}),
        },
      });

      setUser({
        ...(authUser ?? {}),
        ...updated,
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
        description="Manage your personal admin identity, profile image, contact details, and password from a secure self-service control page."
        action={
          <Button type="submit" form="admin-account-form" variant="secondary" disabled={updateUser.isPending}>
            {updateUser.isPending ? 'Saving...' : 'Save profile'}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Role" value={authUser?.role ?? 'admin'} description="Current authenticated identity controlling the admin dashboard." icon={ShieldCheck} />
        <StatsCard title="Contact" value={form.email || 'n/a'} description="Email identity tied to the current administrator account." icon={Mail} />
        <StatsCard title="Profile" value={form.firstName ? 'Ready' : 'Pending'} description="Whether the account profile contains usable identity information." icon={UserCog} />
        <StatsCard title="Security" value="Active" description="Password changes are hashed and saved through the secure user update flow." icon={KeyRound} />
      </div>

      <form id="admin-account-form" className="grid gap-6 xl:grid-cols-[0.85fr,1.15fr]" onSubmit={handleSubmit}>
        <Card className="space-y-5">
          <div>
            <h2 className="text-[28px] text-[var(--primary)] [font-family:var(--font-display)]">Profile image</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Upload an admin avatar that is stored through the existing Cloudinary-backed image flow.</p>
          </div>

          <AdminImageUploader
            label="Admin avatar"
            folder="avatars"
            multiple={false}
            value={form.avatarUrl ? [form.avatarUrl] : []}
            onChange={(images) => setForm((current) => ({ ...current, avatarUrl: images[0] ?? null }))}
            helperText="The uploaded image is stored remotely and the resulting URL is saved in the user record."
          />
        </Card>

        <Card className="space-y-5">
          <div>
            <h2 className="text-[28px] text-[var(--primary)] [font-family:var(--font-display)]">Identity & security</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Refine your admin name, email, phone, and optionally rotate the account password.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className={adminLabelClassName}>
              <span className={adminLabelTextClassName}>First name</span>
              <input
                className={adminInputClassName}
                value={form.firstName}
                onChange={(event) => {
                  const val = event.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                  setForm((current) => ({ ...current, firstName: val }));
                }}
              />
            </label>
            <label className={adminLabelClassName}>
              <span className={adminLabelTextClassName}>Last name</span>
              <input
                className={adminInputClassName}
                value={form.lastName}
                onChange={(event) => {
                  const val = event.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                  setForm((current) => ({ ...current, lastName: val }));
                }}
              />
            </label>
            <label className={adminLabelClassName}>
              <span className={adminLabelTextClassName}>Email</span>
              <input type="email" className={adminInputClassName} value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label className={adminLabelClassName}>
              <span className={adminLabelTextClassName}>Phone</span>
              <input
                className={adminInputClassName}
                value={form.phone}
                onChange={(event) => {
                  const val = event.target.value.replace(/[^0-9+]/g, '');
                  setForm((current) => ({ ...current, phone: val }));
                }}
              />
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
