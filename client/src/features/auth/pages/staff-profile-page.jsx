import { useEffect, useState } from 'react';
import { KeyRound, Mail, ShieldCheck, UserCog, Eye, EyeOff } from 'lucide-react';
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

  return null;
};

export const StaffProfilePage = () => {
  const authUser = useAuthStore((state) => state.user);
  const profileQuery = useMyProfile();
  const updateMe = useUpdateMe();
  const [form, setForm] = useState(createInitialForm(authUser));
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [focusStates, setFocusStates] = useState({ showCurrent: false, showNew: false, showConfirm: false, isCurrentFoc: false, isNewFoc: false, isConfirmFoc: false });
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (!passwordForm.currentPassword) return toast.error('Current password is required');
    if (passwordForm.newPassword.length < 6) return toast.error('New password must be at least 6 characters long');
    if (passwordForm.newPassword === passwordForm.currentPassword) return toast.error('New password cannot be the same as your current password');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('New passwords do not match');

    setIsPasswordSaving(true);
    try {
      await updateMe.mutateAsync({
        currentPassword: passwordForm.currentPassword.trim(),
        password: passwordForm.newPassword.trim(),
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated successfully');
    } catch {
      // hook handles error
    } finally {
      setIsPasswordSaving(false);
    }
  };

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

    setIsProfileSaving(true);
    try {
      await updateMe.mutateAsync({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        avatarUrl: form.avatarUrl || null,
        ...(form.password?.trim() ? { password: form.password.trim() } : {}),
      });

      setForm((current) => ({ ...current, password: '' }));
    } catch {
      // Mutation hook already shows a toast.
    } finally {
      setIsProfileSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Manage your personal identity, profile image, contact details, and password from a secure self-service control page."
        action={
          <Button type="submit" form="staff-profile-form" disabled={isProfileSaving || updateMe.isPending}>
            {isProfileSaving ? 'Saving...' : 'Save profile'}
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
          </div>
        </Card>
      </form>

      <div className="space-y-6" onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit(e)} >
        <Card className="space-y-5">
          <div>
            <h2 className="text-[28px] text-[var(--primary)] [font-family:var(--font-display)]">Security & Password</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Rotate your account password securely.</p>
          </div>

          <div className="grid gap-4">
            {/* HONEYPOT: Trap Chrome Autofill off-screen */}
            <div style={{ position: 'absolute', top: 0, left: '-9999px', opacity: 0 }} aria-hidden="true" tabIndex={-1}>
               <input type="text" name="email" autoComplete="username" defaultValue={authUser?.email || ''} tabIndex={-1} />
               <input type="password" name="password" autoComplete="current-password" tabIndex={-1} />
               <input type="password" name="new-password" autoComplete="new-password" tabIndex={-1} />
            </div>
            
            <label className={adminLabelClassName}>
              <span className={adminLabelTextClassName}>Current password</span>
              <div className="relative">
                <input
                  type={focusStates.showCurrent ? 'text' : (focusStates.isCurrentFoc || passwordForm.currentPassword.length > 0 ? 'password' : 'text')}
                  autoComplete="new-password"
                  name="current-password-field"
                  onFocus={() => setFocusStates(s => ({ ...s, isCurrentFoc: true }))}
                  onBlur={() => setFocusStates(s => ({ ...s, isCurrentFoc: false }))}
                  className={adminInputClassName}
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
                  placeholder="Required to set a new password"
                />
                <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600" onClick={() => setFocusStates(s => ({ ...s, showCurrent: !s.showCurrent }))}>
                  {focusStates.showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <label className={adminLabelClassName}>
              <span className={adminLabelTextClassName}>New password</span>
              <div className="relative">
                <input
                  type={focusStates.showNew ? 'text' : (focusStates.isNewFoc || passwordForm.newPassword.length > 0 ? 'password' : 'text')}
                  autoComplete="new-password"
                  name="new-password-field"
                  onFocus={() => setFocusStates(s => ({ ...s, isNewFoc: true }))}
                  onBlur={() => setFocusStates(s => ({ ...s, isNewFoc: false }))}
                  className={adminInputClassName}
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
                  placeholder="Minimum 6 characters"
                />
                <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600" onClick={() => setFocusStates(s => ({ ...s, showNew: !s.showNew }))}>
                  {focusStates.showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <label className={adminLabelClassName}>
              <span className={adminLabelTextClassName}>Confirm new password</span>
              <div className="relative">
                <input
                  type={focusStates.showConfirm ? 'text' : (focusStates.isConfirmFoc || passwordForm.confirmPassword.length > 0 ? 'password' : 'text')}
                  autoComplete="new-password"
                  name="confirm-password-field"
                  onFocus={() => setFocusStates(s => ({ ...s, isConfirmFoc: true }))}
                  onBlur={() => setFocusStates(s => ({ ...s, isConfirmFoc: false }))}
                  className={adminInputClassName}
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
                  placeholder="Re-type new password"
                />
                <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600" onClick={() => setFocusStates(s => ({ ...s, showConfirm: !s.showConfirm }))}>
                  {focusStates.showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <div className="mt-2">
              <Button onClick={handlePasswordSubmit} disabled={isPasswordSaving || updateMe.isPending}>
                {isPasswordSaving ? 'Updating...' : 'Update password'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
