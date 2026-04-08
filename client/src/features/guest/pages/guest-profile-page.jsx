import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdminImageUploader } from '@/features/admin/components/admin-image-uploader';
import { validateGuestProfileForm } from '@/features/guest/form-utils';
import { useGuestProfile, useUpdateGuestProfile } from '@/features/guest/hooks';

const inputClassName = 'w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]';

export const GuestProfilePage = () => {
  const { data, isLoading } = useGuestProfile();
  const updateProfile = useUpdateGuestProfile();
  const [form, setForm] = useState(null);

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
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? 'Saving...' : 'Save profile'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
