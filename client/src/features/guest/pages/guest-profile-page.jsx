import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdminImageUploader } from '@/features/admin/components/admin-image-uploader';
import { validateGuestProfileForm } from '@/features/guest/form-utils';
import { useGuestProfile, useUpdateGuestProfile } from '@/features/guest/hooks';
import { Eye, EyeOff } from 'lucide-react';

const inputClassName = 'w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]';

export const GuestProfilePage = () => {
  const { data, isLoading } = useGuestProfile();
  const updateProfile = useUpdateGuestProfile();
  const [form, setForm] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [focusStates, setFocusStates] = useState({ showCurrent: false, showNew: false, showConfirm: false });
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const handlePasswordSubmit = (event) => {
    event.preventDefault();
    if (!passwordForm.currentPassword) return toast.error('Current password is required');
    if (passwordForm.newPassword.length < 6) return toast.error('New password must be at least 6 characters long');
    if (passwordForm.newPassword === passwordForm.currentPassword) return toast.error('New password cannot be the same as your current password');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('New passwords do not match');

    setIsPasswordSaving(true);
    updateProfile.mutate({
      currentPassword: passwordForm.currentPassword.trim(),
      password: passwordForm.newPassword.trim(),
    }, {
      onSuccess: () => {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        toast.success('Password updated successfully');
      },
      onSettled: () => setIsPasswordSaving(false),
    });
  };

  useEffect(() => {
    if (data) {
      setForm(data);
    }
  }, [data]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form) return;

    const validationMessage = validateGuestProfileForm(form);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setIsProfileSaving(true);
    updateProfile.mutate({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      avatarUrl: form.avatarUrl ?? null,
      profile: {
        gender: form.profile?.gender ?? null,
        dateOfBirth: form.profile?.dateOfBirth ?? null,
        nationality: form.profile?.nationality?.trim() ?? '',
        idType: form.profile?.idType ?? null,
        idNumber: form.profile?.idNumber?.trim() ?? '',
        addressLine1: form.profile?.addressLine1?.trim() ?? '',
        addressLine2: form.profile?.addressLine2 ?? null,
        city: form.profile?.city?.trim() ?? '',
        state: form.profile?.state ?? null,
        country: form.profile?.country?.trim() ?? '',
        postalCode: form.profile?.postalCode ?? null,
        preferences: form.profile?.preferences ?? {},
        emergencyContact: form.profile?.emergencyContact ?? {},
        notes: form.profile?.notes ?? null,
      },
    }, {
      onSettled: () => setIsProfileSaving(false)
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Manage your guest identity, stay preferences, and emergency contact information."
      />

      <Card>
        {isLoading || !form ? (
          <div className="grid gap-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-2xl bg-white/70" />
            ))}
          </div>
        ) : (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="md:col-span-2 mb-4">
              <AdminImageUploader
                label="Profile Picture"
                folder="avatars"
                multiple={false}
                value={form.avatarUrl ? [form.avatarUrl] : []}
                onChange={(images) => setForm({ ...form, avatarUrl: images[0] ?? null })}
                helperText="Upload an image to personalize your guest identity."
              />
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">First name</span>
              <input
                className={inputClassName}
                name="firstName"
                value={form.firstName}
                onChange={(event) => {
                  const val = event.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                  setForm({ ...form, firstName: val });
                }}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">Last name</span>
              <input
                className={inputClassName}
                name="lastName"
                value={form.lastName}
                onChange={(event) => {
                  const val = event.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                  setForm({ ...form, lastName: val });
                }}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">Email</span>
              <input className={inputClassName} name="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">Phone</span>
              <input
                className={inputClassName}
                name="phone"
                value={form.phone}
                onChange={(event) => {
                  const val = event.target.value.replace(/[^0-9+]/g, '');
                  setForm({ ...form, phone: val });
                }}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">Nationality</span>
              <input
                className={inputClassName}
                name="nationality"
                value={form.profile?.nationality ?? ''}
                onChange={(event) => {
                  const val = event.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                  setForm({
                    ...form,
                    profile: {
                      ...(form.profile ?? {}),
                      nationality: val,
                    },
                  });
                }}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">ID number</span>
              <input
                className={inputClassName}
                name="idNumber"
                value={form.profile?.idNumber ?? ''}
                onChange={(event) => {
                  const val = event.target.value.replace(/[^0-9]/g, ''); // User wants numbers only for id
                  setForm({
                    ...form,
                    profile: {
                      ...(form.profile ?? {}),
                      idNumber: val,
                    },
                  });
                }}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-[var(--primary)]">Address</span>
              <input
                className={inputClassName}
                name="addressLine1"
                value={form.profile?.addressLine1 ?? ''}
                onChange={(event) => setForm({
                  ...form,
                  profile: {
                    ...(form.profile ?? {}),
                    addressLine1: event.target.value,
                  },
                })}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">City</span>
              <input
                className={inputClassName}
                name="city"
                value={form.profile?.city ?? ''}
                onChange={(event) => {
                  const val = event.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                  setForm({
                    ...form,
                    profile: {
                      ...(form.profile ?? {}),
                      city: val,
                    },
                  });
                }}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">Country</span>
              <input
                className={inputClassName}
                name="country"
                value={form.profile?.country ?? ''}
                onChange={(event) => {
                  const val = event.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                  setForm({
                    ...form,
                    profile: {
                      ...(form.profile ?? {}),
                      country: val,
                    },
                  });
                }}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">Emergency contact name</span>
              <input
                className={inputClassName}
                name="emergencyContactName"
                value={form.profile?.emergencyContact?.name ?? ''}
                onChange={(event) => {
                  const val = event.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                  setForm({
                    ...form,
                    profile: {
                      ...(form.profile ?? {}),
                      emergencyContact: {
                        ...(form.profile?.emergencyContact ?? {}),
                        name: val,
                      },
                    },
                  });
                }}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">Emergency phone</span>
              <input
                className={inputClassName}
                name="emergencyContactPhone"
                value={form.profile?.emergencyContact?.phone ?? ''}
                onChange={(event) => {
                  const val = event.target.value.replace(/[^0-9+]/g, '');
                  setForm({
                    ...form,
                    profile: {
                      ...(form.profile ?? {}),
                      emergencyContact: {
                        ...(form.profile?.emergencyContact ?? {}),
                        phone: val,
                      },
                    },
                  });
                }}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-[var(--primary)]">Stay notes</span>
              <textarea
                className={`${inputClassName} min-h-28`}
                name="notes"
                value={form.profile?.notes ?? ''}
                onChange={(event) => setForm({
                  ...form,
                  profile: {
                    ...(form.profile ?? {}),
                    notes: event.target.value,
                  },
                })}
              />
            </label>

            <div className="md:col-span-2">
              <Button type="submit" disabled={isProfileSaving || updateProfile.isPending}>
                {isProfileSaving ? 'Saving...' : 'Save profile'}
              </Button>
            </div>
          </form>
        )}
      </Card>

      <form className="grid gap-4" onSubmit={handlePasswordSubmit} autoComplete="off">
        <Card className="space-y-6">
          <div className="mb-2">
            <h2 className="text-xl font-semibold text-[var(--primary)] mb-1">Security & Password</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Rotate your account password securely.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* HONEYPOT: Chrome Autofill trap far off-screen */}
            <div style={{ position: 'absolute', top: 0, left: '-9999px', opacity: 0 }} aria-hidden="true" tabIndex={-1}>
               <input type="text" name="email" autoComplete="username" defaultValue={data?.email || ''} tabIndex={-1} />
               <input type="password" name="password" autoComplete="current-password" tabIndex={-1} />
               <input type="password" name="new-password" autoComplete="new-password" tabIndex={-1} />
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">Current password</span>
              <div className="relative">
                <input
                  type={focusStates.showCurrent ? 'text' : (focusStates.isCurrentFoc || passwordForm.currentPassword.length > 0 ? 'password' : 'text')}
                  autoComplete="new-password"
                  name="current-password-field"
                  onFocus={() => setFocusStates(s => ({ ...s, isCurrentFoc: true }))}
                  onBlur={() => setFocusStates(s => ({ ...s, isCurrentFoc: false }))}
                  className={inputClassName}
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
                  placeholder="Required to set a new password"
                />
                <button type="button" tabIndex={-1} className="absolute right-3 top-[55%] -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600" onClick={() => setFocusStates(s => ({ ...s, showCurrent: !s.showCurrent }))}>
                  {focusStates.showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">New password</span>
              <div className="relative">
                <input
                  type={focusStates.showNew ? 'text' : (focusStates.isNewFoc || passwordForm.newPassword.length > 0 ? 'password' : 'text')}
                  autoComplete="new-password"
                  name="new-password-field"
                  onFocus={() => setFocusStates(s => ({ ...s, isNewFoc: true }))}
                  onBlur={() => setFocusStates(s => ({ ...s, isNewFoc: false }))}
                  className={inputClassName}
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
                  placeholder="Minimum 6 characters"
                />
                <button type="button" tabIndex={-1} className="absolute right-3 top-[55%] -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600" onClick={() => setFocusStates(s => ({ ...s, showNew: !s.showNew }))}>
                  {focusStates.showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">Confirm new password</span>
              <div className="relative">
                <input
                  type={focusStates.showConfirm ? 'text' : (focusStates.isConfirmFoc || passwordForm.confirmPassword.length > 0 ? 'password' : 'text')}
                  autoComplete="new-password"
                  name="confirm-password-field"
                  onFocus={() => setFocusStates(s => ({ ...s, isConfirmFoc: true }))}
                  onBlur={() => setFocusStates(s => ({ ...s, isConfirmFoc: false }))}
                  className={inputClassName}
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
                  placeholder="Re-type new password"
                />
                <button type="button" tabIndex={-1} className="absolute right-3 top-[55%] -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600" onClick={() => setFocusStates(s => ({ ...s, showConfirm: !s.showConfirm }))}>
                  {focusStates.showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
          </div>

          <div className="md:col-span-2">
            <Button type="submit" disabled={isPasswordSaving || updateProfile.isPending}>
              {isPasswordSaving ? 'Updating password...' : 'Update password'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};
