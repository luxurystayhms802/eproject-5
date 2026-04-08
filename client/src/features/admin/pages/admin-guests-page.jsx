import { useMemo, useState } from 'react';
import { Eye, Globe2, Plus, Search, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/store/auth-store';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  AdminDetailDrawer,
  AdminDetailGrid,
  AdminDetailItem,
  AdminDetailSection,
} from '@/features/admin/components/admin-detail-drawer';
import { AdminEmptyState, AdminResultsSummary } from '@/features/admin/components/admin-list-state';
import { AdminModal } from '@/features/admin/components/admin-modal';
import { AdminToolbar } from '@/features/admin/components/admin-toolbar';
import {
  adminInputClassName,
  adminLabelClassName,
  adminLabelTextClassName,
  adminSelectClassName,
  adminTextAreaClassName,
  GENDER_OPTIONS,
  ID_TYPE_OPTIONS,
  USER_STATUS_OPTIONS,
} from '@/features/admin/config';
import { getDisplayName } from '@/features/admin/display-utils';
import { validateAdminGuestForm } from '@/features/admin/form-utils';
import { useAdminGuests, useCreateGuest, useDeleteAdminUser, useUpdateGuest } from '@/features/admin/hooks';

const getGuestStatus = (guest) => guest?.status || 'active';

const createInitialForm = () => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  status: 'active',
  profile: {
    gender: '',
    dateOfBirth: '',
    nationality: '',
    idType: '',
    idNumber: '',
    addressLine1: '',
    city: '',
    country: '',
    notes: '',
  },
});

const mapGuestToForm = (guest) => ({
  firstName: guest.firstName ?? '',
  lastName: guest.lastName ?? '',
  email: guest.email ?? '',
  phone: guest.phone ?? '',
  password: '',
  status: getGuestStatus(guest),
  profile: {
    gender: guest.profile?.gender ?? '',
    dateOfBirth: guest.profile?.dateOfBirth ? new Date(guest.profile.dateOfBirth).toISOString().slice(0, 10) : '',
    nationality: guest.profile?.nationality ?? guest.nationality ?? '',
    idType: guest.profile?.idType ?? guest.idType ?? '',
    idNumber: guest.profile?.idNumber ?? guest.idNumber ?? '',
    addressLine1: guest.profile?.addressLine1 ?? '',
    city: guest.profile?.city ?? guest.city ?? '',
    country: guest.profile?.country ?? guest.country ?? '',
    notes: guest.profile?.notes ?? '',
  },
});

const buildGuestPayload = (form, isEditing) => {
  const payload = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    status: form.status,
    profile: {
      gender: form.profile.gender || null,
      dateOfBirth: form.profile.dateOfBirth || null,
      nationality: form.profile.nationality.trim() || '',
      idType: form.profile.idType || null,
      idNumber: form.profile.idNumber.trim() || '',
      addressLine1: form.profile.addressLine1.trim() || '',
      city: form.profile.city.trim() || '',
      country: form.profile.country.trim() || '',
      notes: form.profile.notes.trim() || null,
    },
  };

  if (!isEditing || form.password.trim()) {
    payload.password = form.password.trim();
  }

  if (isEditing && !payload.password) {
    delete payload.password;
  }

  return payload;
};

const createInitialFilters = () => ({
  search: '',
  nationality: '',
  status: '',
});

export const AdminGuestsPage = () => {
  const [filters, setFilters] = useState(createInitialFilters);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [form, setForm] = useState(createInitialForm);

  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];
  const isSuperAdmin = user?.role === 'super_admin';
  const canUpdate = isSuperAdmin || permissions.includes('guests.update');
  const canCreate = isSuperAdmin || permissions.includes('guests.create');
  const canDelete = isSuperAdmin || permissions.includes('guests.delete');

  const guestsQuery = useAdminGuests({
    search: filters.search.trim() || undefined,
    nationality: filters.nationality.trim() || undefined,
    status: filters.status || undefined,
  });
  const createGuest = useCreateGuest();
  const updateGuest = useUpdateGuest();
  const deleteUser = useDeleteAdminUser();

  const guests = guestsQuery.data ?? [];
  const nationalities = useMemo(
    () => [...new Set(
      guests
        .map((guest) => guest.nationality)
        .filter((n) => Boolean(n) && n.toLowerCase() !== 'all nationalities' && !/^\d+$/.test(n))
    )].sort((left, right) => left.localeCompare(right)),
    [guests],
  );

  const summary = useMemo(
    () => ({
      total: guests.length,
      activeStays: guests.filter((guest) => guest.reservationCount > 0).length,
      international: guests.filter((guest) => guest.country && guest.country.toLowerCase() !== 'pakistan').length,
      repeatGuests: guests.filter((guest) => guest.reservationCount > 1).length,
    }),
    [guests],
  );

  const activeFilters = useMemo(
    () => [
      filters.search ? `Search: ${filters.search}` : null,
      filters.nationality ? `Nationality: ${filters.nationality}` : null,
      filters.status ? `Status: ${filters.status}` : null,
    ].filter(Boolean),
    [filters],
  );

  const openCreateModal = () => {
    setEditingGuest(null);
    setForm(createInitialForm());
    setModalOpen(true);
  };

  const openEditModal = (guest) => {
    setSelectedGuest(null);
    setEditingGuest(guest);
    setForm(mapGuestToForm(guest));
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = validateAdminGuestForm(form, Boolean(editingGuest));
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    const payload = buildGuestPayload(form, Boolean(editingGuest));

    try {
      if (editingGuest) {
        await updateGuest.mutateAsync({
          guestId: editingGuest.id,
          payload,
        });
      } else {
        await createGuest.mutateAsync(payload);
      }

      setModalOpen(false);
    } catch {
      // Mutation hook already shows a toast.
    }
  };

  const handleQuickStatus = async (guest, status) => {
    try {
      await updateGuest.mutateAsync({
        guestId: guest.id,
        payload: { status },
      });
    } catch {
      // Mutation hook already shows a toast.
    }
  };

  const handleDeleteGuest = async (guest) => {
    if (!window.confirm(`Delete ${getDisplayName(guest, 'this guest')}? This will permanently remove the guest account from the system.`)) {
      return;
    }

    try {
      await deleteUser.mutateAsync(guest.id);
      setSelectedGuest(null);
    } catch {
      // Mutation hook already shows a toast.
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guest Profiles"
        description="Review guest identity, preferences, nationality mix, and repeat-stay behaviour from one curated hospitality relationship board."
      >
        <div className="rounded-[22px] border border-white/60 bg-white/72 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Profiles in view</p>
          <p className="mt-2 text-xl text-[var(--primary)] [font-family:var(--font-display)]">{summary.total}</p>
        </div>
        <div className="rounded-[22px] border border-white/60 bg-[linear-gradient(135deg,var(--primary)_0%,#21436b_68%,var(--accent)_160%)] px-4 py-3 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/68">Repeat guests</p>
          <p className="mt-2 text-xl [font-family:var(--font-display)]">{summary.repeatGuests}</p>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Guest profiles" value={String(summary.total)} description="Registered guest identities accessible to the admin command layer" icon={UserRound} />
        <StatsCard title="Reservation-linked" value={String(summary.activeStays)} description="Guests with at least one reservation in the operational database" icon={Globe2} />
        <StatsCard title="International mix" value={String(summary.international)} description="Profiles indicating country information outside the default local market" icon={Globe2} />
        <StatsCard title="Repeat stays" value={String(summary.repeatGuests)} description="Guests with multiple reservations and stronger loyalty signals" icon={UserRound} />
      </div>

      <AdminToolbar
        title="Guest relationship control"
        description="Search profiles, review travel identity details, and create or refine guest records before reservations are issued."
        actions={
          canCreate ? (
            <Button variant="secondary" onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Add guest
            </Button>
          ) : null
        }
      >
        <div className="grid w-full gap-3 lg:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,0.8fr))]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              className={`${adminInputClassName} pl-11`}
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Search by name, email, phone, or identity"
            />
          </div>
          <select className={adminSelectClassName} value={filters.nationality} onChange={(event) => setFilters((current) => ({ ...current, nationality: event.target.value }))}>
            <option value="">All nationalities</option>
            {nationalities.map((nationality) => (
              <option key={nationality} value={nationality}>
                {nationality}
              </option>
            ))}
          </select>
          <select className={adminSelectClassName} value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="">All statuses</option>
            {USER_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </AdminToolbar>

      <AdminResultsSummary
        count={guests.length}
        noun="guest records"
        activeFilters={activeFilters}
        onClearFilters={() => setFilters(createInitialFilters())}
      />

      <Card className="space-y-4">
        {guestsQuery.isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-[22px] bg-white/70" />
            ))}
          </div>
        ) : guests.length > 0 ? (
          <div className="space-y-3">
            {guests.map((guest) => (
              <div key={guest.id} className="grid gap-4 rounded-[24px] border border-[var(--border)] bg-white/76 p-5 shadow-[0_16px_34px_rgba(16,36,63,0.05)] xl:grid-cols-[minmax(0,1.55fr)_minmax(250px,0.85fr)_auto] xl:items-start">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={getGuestStatus(guest)} />
                    {guest.idType ? <StatusBadge value={guest.idType} className="bg-slate-100 text-slate-700" /> : null}
                    {!guest.idType || !guest.idNumber || (!guest.nationality && !guest.country) ? (
                      <StatusBadge value="incomplete profile" className="bg-orange-100 text-orange-700 border-none" />
                    ) : null}
                  </div>
                  <div>
                    <h3 className="text-2xl text-[var(--primary)] [font-family:var(--font-display)]">{getDisplayName(guest, 'Guest profile')}</h3>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{guest.email} | {guest.phone}</p>
                  </div>
                  <div className="grid gap-2 text-sm text-[var(--muted-foreground)] sm:grid-cols-2">
                    <span>Nationality: <strong className="font-semibold text-[var(--primary)]">{guest.nationality || guest.country || 'n/a'}</strong></span>
                    <span>Reservations: <strong className="font-semibold text-[var(--primary)]">{guest.reservationCount ?? 0}</strong></span>
                    <span>Identity: <strong className="font-semibold text-[var(--primary)]">{guest.idType || 'Not captured'}</strong></span>
                    <span>City: <strong className="font-semibold text-[var(--primary)]">{guest.city || 'n/a'}</strong></span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-[22px] border border-[var(--border)] bg-white/84 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Identity posture</p>
                    <p className="mt-2 text-lg font-semibold capitalize text-[var(--primary)]">{guest.idNumber || 'Pending verification'}</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{guest.idType || 'No document type stored'}</p>
                  </div>
                  <div className="rounded-[22px] border border-[var(--border)] bg-white/84 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Location</p>
                    <p className="mt-2 text-lg font-semibold text-[var(--primary)]">{guest.country || 'Country n/a'}</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{guest.city || 'City n/a'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-start justify-end gap-3 xl:flex-col xl:items-stretch">
                  <Button variant="outline" onClick={() => setSelectedGuest(guest)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View details
                  </Button>
                  {canUpdate && (
                    <Button variant="outline" onClick={() => openEditModal(guest)}>
                      Edit guest
                    </Button>
                  )}
                  {canUpdate && getGuestStatus(guest) !== 'inactive' ? (
                    <Button variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => handleQuickStatus(guest, 'inactive')}>
                      Deactivate
                    </Button>
                  ) : canUpdate ? (
                    <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => handleQuickStatus(guest, 'active')}>
                      Reactivate
                    </Button>
                  ) : null}
                  {canDelete && (
                    <Button variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => handleDeleteGuest(guest)}>
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AdminEmptyState
            title="No guest profiles found"
            description="Try a broader search or create a guest record to support walk-ins and admin-led reservations."
            action={
              canCreate ? (
                <Button variant="secondary" onClick={openCreateModal}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add guest
                </Button>
              ) : null
            }
          />
        )}
      </Card>

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingGuest ? 'Edit guest profile' : 'Create guest profile'}
        description="Capture guest identity, contact basics, and stay preferences in a clean hotel-grade profile record."
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
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
            <input type="email" autoComplete="off" className={adminInputClassName} value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
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
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Account status</span>
            <select className={adminSelectClassName} value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
              {USER_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>{editingGuest ? 'Reset password (optional)' : 'Password'}</span>
            <input type="password" autoComplete="new-password" className={adminInputClassName} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Gender</span>
            <select className={adminSelectClassName} value={form.profile.gender} onChange={(event) => setForm((current) => ({ ...current, profile: { ...current.profile, gender: event.target.value } }))}>
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Date of birth</span>
            <input type="date" className={adminInputClassName} value={form.profile.dateOfBirth} onChange={(event) => setForm((current) => ({ ...current, profile: { ...current.profile, dateOfBirth: event.target.value } }))} />
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>ID type</span>
            <select className={adminSelectClassName} value={form.profile.idType} onChange={(event) => setForm((current) => ({ ...current, profile: { ...current.profile, idType: event.target.value } }))}>
              <option value="">Select ID type</option>
              {ID_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>ID number</span>
            <input
              className={adminInputClassName}
              value={form.profile.idNumber}
              onChange={(event) => {
                const val = event.target.value.replace(/[^0-9a-zA-Z-]/g, '');
                setForm((current) => ({ ...current, profile: { ...current.profile, idNumber: val } }));
              }}
            />
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Nationality</span>
            <input
              className={adminInputClassName}
              value={form.profile.nationality}
              onChange={(event) => {
                const val = event.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                setForm((current) => ({ ...current, profile: { ...current.profile, nationality: val } }));
              }}
            />
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>City</span>
            <input
              className={adminInputClassName}
              value={form.profile.city}
              onChange={(event) => {
                const val = event.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                setForm((current) => ({ ...current, profile: { ...current.profile, city: val } }));
              }}
            />
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Country</span>
            <input
              className={adminInputClassName}
              value={form.profile.country}
              onChange={(event) => {
                const val = event.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                setForm((current) => ({ ...current, profile: { ...current.profile, country: val } }));
              }}
            />
          </label>
          <label className={`${adminLabelClassName} md:col-span-2`}>
            <span className={adminLabelTextClassName}>Address line</span>
            <input className={adminInputClassName} value={form.profile.addressLine1} onChange={(event) => setForm((current) => ({ ...current, profile: { ...current.profile, addressLine1: event.target.value } }))} />
          </label>
          <label className={`${adminLabelClassName} md:col-span-2`}>
            <span className={adminLabelTextClassName}>Notes</span>
            <textarea className={adminTextAreaClassName} value={form.profile.notes} onChange={(event) => setForm((current) => ({ ...current, profile: { ...current.profile, notes: event.target.value } }))} />
          </label>
          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" disabled={createGuest.isPending || updateGuest.isPending}>
              {editingGuest ? 'Save guest' : 'Create guest'}
            </Button>
          </div>
        </form>
      </AdminModal>

      <AdminDetailDrawer
        open={Boolean(selectedGuest)}
        onClose={() => setSelectedGuest(null)}
        title={getDisplayName(selectedGuest, '')}
        subtitle="Review guest identity, travel profile, and reservation signals from a cleaner detail surface."
        actions={selectedGuest ? (
          <>
            {canUpdate && (
              <Button variant="outline" onClick={() => openEditModal(selectedGuest)}>
                Edit guest
              </Button>
            )}
            {canUpdate && (
              <Button
                variant="outline"
                className={getGuestStatus(selectedGuest) !== 'inactive' ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}
                onClick={() => handleQuickStatus(selectedGuest, getGuestStatus(selectedGuest) !== 'inactive' ? 'inactive' : 'active')}
              >
                {getGuestStatus(selectedGuest) !== 'inactive' ? 'Deactivate' : 'Reactivate'}
              </Button>
            )}
          </>
        ) : null}
      >
        {selectedGuest ? (
          <>
            <AdminDetailSection title="Guest profile" description="Primary identity and hospitality relationship summary.">
              <AdminDetailGrid>
                <AdminDetailItem label="Status" value={getGuestStatus(selectedGuest)} emphasis />
                <AdminDetailItem label="Reservations" value={String(selectedGuest.reservationCount ?? 0)} emphasis />
                <AdminDetailItem label="Email" value={selectedGuest.email} />
                <AdminDetailItem label="Phone" value={selectedGuest.phone} />
              </AdminDetailGrid>
            </AdminDetailSection>

            <AdminDetailSection title="Identity and location" description="Document capture and residency details used by front-desk workflows.">
              <AdminDetailGrid>
                <AdminDetailItem label="ID type" value={selectedGuest.idType || 'Not captured'} />
                <AdminDetailItem label="ID number" value={selectedGuest.idNumber || 'Pending verification'} emphasis />
                <AdminDetailItem label="Nationality" value={selectedGuest.nationality || selectedGuest.country || 'Not captured'} />
                <AdminDetailItem label="Gender" value={selectedGuest.profile?.gender || 'Not captured'} />
                <AdminDetailItem label="City" value={selectedGuest.city || 'Not captured'} />
                <AdminDetailItem label="Country" value={selectedGuest.country || 'Not captured'} />
              </AdminDetailGrid>
            </AdminDetailSection>

            <AdminDetailSection title="Address and notes" description="Supporting guest details useful for personalized service.">
              <AdminDetailGrid columns={1}>
                <AdminDetailItem label="Address" value={selectedGuest.profile?.addressLine1 || 'No address added yet'} />
                <AdminDetailItem label="Notes" value={selectedGuest.profile?.notes || 'No guest notes recorded'} />
              </AdminDetailGrid>
            </AdminDetailSection>
          </>
        ) : null}
      </AdminDetailDrawer>
    </div>
  );
};
