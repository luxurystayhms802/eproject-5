import { useMemo, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/store/auth-store';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdminImageUploader } from '@/features/admin/components/admin-image-uploader';
import { AdminModal } from '@/features/admin/components/admin-modal';
import { AdminToolbar } from '@/features/admin/components/admin-toolbar';
import {
  adminInputClassName,
  adminLabelClassName,
  adminLabelTextClassName,
  adminSelectClassName,
  adminTextAreaClassName,
  BED_TYPE_OPTIONS,
  formatAdminCurrency,
} from '@/features/admin/config';
import { validateAdminRoomTypeForm } from '@/features/admin/form-utils';
import { useAdminRoomTypes, useCreateRoomType, useDeleteRoomType, useUpdateRoomType } from '@/features/admin/hooks';

const createInitialForm = () => ({
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  basePrice: '250',
  maxAdults: '2',
  maxChildren: '1',
  bedCount: '1',
  bedType: 'queen',
  roomSizeSqFt: '',
  amenities: 'WiFi, Breakfast, Concierge',
  images: [],
  featured: false,
  isActive: true,
});

const mapRoomTypeToForm = (roomType) => ({
  name: roomType.name ?? '',
  slug: roomType.slug ?? '',
  shortDescription: roomType.shortDescription ?? '',
  description: roomType.description ?? '',
  basePrice: String(roomType.basePrice ?? 0),
  maxAdults: String(roomType.maxAdults ?? 1),
  maxChildren: String(roomType.maxChildren ?? 0),
  bedCount: String(roomType.bedCount ?? 1),
  bedType: roomType.bedType ?? 'queen',
  roomSizeSqFt: roomType.roomSizeSqFt ? String(roomType.roomSizeSqFt) : '',
  amenities: (roomType.amenities ?? []).join(', '),
  images: roomType.images ?? [],
  featured: Boolean(roomType.featured),
  isActive: Boolean(roomType.isActive),
});

const buildPayload = (form) => ({
  name: form.name.trim(),
  slug: form.slug.trim() || undefined,
  shortDescription: form.shortDescription.trim(),
  description: form.description.trim(),
  basePrice: Number(form.basePrice),
  maxAdults: Number(form.maxAdults),
  maxChildren: Number(form.maxChildren),
  bedCount: Number(form.bedCount),
  bedType: form.bedType,
  roomSizeSqFt: form.roomSizeSqFt ? Number(form.roomSizeSqFt) : null,
  amenities: form.amenities
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
  images: form.images,
  featured: Boolean(form.featured),
  isActive: Boolean(form.isActive),
});

export const AdminRoomTypesPage = () => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState(null);
  const [form, setForm] = useState(createInitialForm);

  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];
  const isSuperAdmin = user?.role === 'super_admin';
  const canUpdate = isSuperAdmin || permissions.includes('roomTypes.update');
  const canCreate = isSuperAdmin || permissions.includes('roomTypes.create');
  const canDelete = isSuperAdmin || permissions.includes('roomTypes.delete');

  const roomTypesQuery = useAdminRoomTypes({
    search: search.trim() || undefined,
  });
  const createRoomType = useCreateRoomType();
  const updateRoomType = useUpdateRoomType();
  const deleteRoomType = useDeleteRoomType();

  const roomTypes = roomTypesQuery.data ?? [];
  const featuredCount = roomTypes.filter((item) => item.featured).length;
  const activeCount = roomTypes.filter((item) => item.isActive).length;
  const averageRate = roomTypes.length
    ? roomTypes.reduce((sum, item) => sum + Number(item.basePrice ?? 0), 0) / roomTypes.length
    : 0;

  const sortedRoomTypes = useMemo(
    () => [...roomTypes].sort((left, right) => Number(right.featured) - Number(left.featured) || left.name.localeCompare(right.name)),
    [roomTypes],
  );

  const openCreateModal = () => {
    setEditingRoomType(null);
    setForm(createInitialForm());
    setModalOpen(true);
  };

  const openEditModal = (roomType) => {
    setEditingRoomType(roomType);
    setForm(mapRoomTypeToForm(roomType));
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = validateAdminRoomTypeForm(form);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    const payload = buildPayload(form);

    try {
      if (editingRoomType) {
        await updateRoomType.mutateAsync({
          roomTypeId: editingRoomType.id,
          payload,
        });
      } else {
        await createRoomType.mutateAsync(payload);
      }

      setModalOpen(false);
    } catch {
      // Mutation hook already surfaces a toast. Keep the modal open for correction.
    }
  };

  const handleDelete = async (roomTypeId) => {
    const confirmed = window.confirm('Archive this room type from active inventory?');
    if (!confirmed) {
      return;
    }

    try {
      await deleteRoomType.mutateAsync(roomTypeId);
    } catch {
      // Mutation hook already shows a toast.
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Room Types"
        description="Shape the premium catalog that drives rooms, pricing, guest expectations, and reservation matching across the property."
      >
        <div className="rounded-[22px] border border-white/60 bg-white/72 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Active types</p>
          <p className="mt-2 text-xl text-[var(--primary)] [font-family:var(--font-display)]">{activeCount}</p>
        </div>
        <div className="rounded-[22px] border border-white/60 bg-[linear-gradient(135deg,var(--primary)_0%,#21436b_68%,var(--accent)_160%)] px-4 py-3 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/68">Average rate</p>
          <p className="mt-2 text-xl [font-family:var(--font-display)]">{formatAdminCurrency(averageRate)}</p>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Catalog size" value={String(roomTypes.length)} description="Distinct hospitality products published in the system" icon={Plus} />
        <StatsCard title="Featured" value={String(featuredCount)} description="Highlighted room types on the public luxury website" icon={Search} />
        <StatsCard title="Active" value={String(activeCount)} description="Room types currently open for booking and allocation" icon={Plus} />
        <StatsCard title="Average rate" value={formatAdminCurrency(averageRate)} description="Snapshot of the room-type pricing baseline" icon={Search} />
      </div>

      <AdminToolbar
        title="Catalog management"
        description="Search, refine, create, and polish room products without leaving the admin surface."
        actions={
          canCreate ? (
            <Button variant="secondary" onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Add room type
            </Button>
          ) : null
        }
      >
        <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative w-full xl:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              className={`${adminInputClassName} pl-11`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, description, or amenities"
            />
          </div>
        </div>
      </AdminToolbar>

      <Card className="space-y-4">
        {roomTypesQuery.isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-[22px] bg-white/70" />
            ))}
          </div>
        ) : sortedRoomTypes.length > 0 ? (
          <div className="space-y-3">
            {sortedRoomTypes.map((roomType) => (
              <div key={roomType.id} className="rounded-[24px] border border-[var(--border)] bg-white/76 p-5 shadow-[0_16px_34px_rgba(16,36,63,0.05)]">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                      {roomType.images?.[0] ? (
                        <div className="h-28 w-full overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface-muted)] xl:h-28 xl:w-36">
                          <img src={roomType.images[0]} alt={roomType.name} className="h-full w-full object-cover" />
                        </div>
                      ) : null}
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">{roomType.slug}</p>
                          <StatusBadge value={roomType.isActive ? 'active' : 'inactive'} />
                          {roomType.featured ? <StatusBadge value="featured" className="bg-indigo-100 text-indigo-700" /> : null}
                        </div>
                        <div>
                          <h3 className="text-2xl text-[var(--primary)] [font-family:var(--font-display)]">{roomType.name}</h3>
                          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">{roomType.shortDescription}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(roomType.amenities ?? []).slice(0, 6).map((amenity) => (
                            <span key={amenity} className="rounded-full border border-[rgba(16,36,63,0.08)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
                    <div className="rounded-[22px] border border-[var(--border)] bg-white/84 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Base rate</p>
                      <p className="mt-2 text-lg font-semibold text-[var(--primary)]">{formatAdminCurrency(roomType.basePrice)}</p>
                    </div>
                    <div className="rounded-[22px] border border-[var(--border)] bg-white/84 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Capacity</p>
                      <p className="mt-2 text-lg font-semibold text-[var(--primary)]">{roomType.maxAdults}A / {roomType.maxChildren}C</p>
                    </div>
                    <div className="rounded-[22px] border border-[var(--border)] bg-white/84 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Bed setup</p>
                      <p className="mt-2 text-lg font-semibold capitalize text-[var(--primary)]">{roomType.bedCount} {roomType.bedType}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
                  {canUpdate && (
                    <Button variant="outline" onClick={() => openEditModal(roomType)}>
                      Edit details
                    </Button>
                  )}
                  {canDelete && (
                    <Button variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => handleDelete(roomType.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Archive
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-white/60 p-8 text-sm leading-7 text-[var(--muted-foreground)]">
            No room types match the current filters. Create a new product to enrich the luxury catalog.
          </div>
        )}
      </Card>

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRoomType ? 'Edit room type' : 'Create room type'}
        description="Define pricing, occupancy, amenities, and public-facing positioning for this room category."
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Type name</span>
            <input className={adminInputClassName} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Slug</span>
            <input className={adminInputClassName} value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} placeholder="optional-auto-generated" />
          </label>
          <label className={`${adminLabelClassName} md:col-span-2`}>
            <span className={adminLabelTextClassName}>Short description</span>
            <textarea className={adminTextAreaClassName} value={form.shortDescription} onChange={(event) => setForm((current) => ({ ...current, shortDescription: event.target.value }))} />
          </label>
          <label className={`${adminLabelClassName} md:col-span-2`}>
            <span className={adminLabelTextClassName}>Long description</span>
            <textarea className={adminTextAreaClassName} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Base price</span>
            <input className={adminInputClassName} type="number" min="0" value={form.basePrice} onChange={(event) => setForm((current) => ({ ...current, basePrice: event.target.value }))} />
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Bed type</span>
            <select className={adminSelectClassName} value={form.bedType} onChange={(event) => setForm((current) => ({ ...current, bedType: event.target.value }))}>
              {BED_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Max adults</span>
            <input className={adminInputClassName} type="number" min="1" value={form.maxAdults} onChange={(event) => setForm((current) => ({ ...current, maxAdults: event.target.value }))} />
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Max children</span>
            <input className={adminInputClassName} type="number" min="0" value={form.maxChildren} onChange={(event) => setForm((current) => ({ ...current, maxChildren: event.target.value }))} />
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Bed count</span>
            <input className={adminInputClassName} type="number" min="1" value={form.bedCount} onChange={(event) => setForm((current) => ({ ...current, bedCount: event.target.value }))} />
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Room size (sq ft)</span>
            <input className={adminInputClassName} type="number" min="0" value={form.roomSizeSqFt} onChange={(event) => setForm((current) => ({ ...current, roomSizeSqFt: event.target.value }))} />
          </label>
          <label className={`${adminLabelClassName} md:col-span-2`}>
            <span className={adminLabelTextClassName}>Amenities</span>
            <input className={adminInputClassName} value={form.amenities} onChange={(event) => setForm((current) => ({ ...current, amenities: event.target.value }))} placeholder="Comma separated amenities" />
          </label>
          <AdminImageUploader
            label="Room type gallery"
            folder="room-types"
            value={form.images}
            onChange={(images) => setForm((current) => ({ ...current, images }))}
            helperText="Upload premium room-type images. Cloudinary URLs will be saved automatically."
          />
          <label className="flex items-center gap-3 rounded-[20px] border border-[var(--border)] bg-white/72 px-4 py-3">
            <input type="checkbox" checked={form.featured} onChange={(event) => setForm((current) => ({ ...current, featured: event.target.checked }))} />
            <span className="text-sm font-medium text-[var(--primary)]">Feature on public website</span>
          </label>
          <label className="flex items-center gap-3 rounded-[20px] border border-[var(--border)] bg-white/72 px-4 py-3">
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
            <span className="text-sm font-medium text-[var(--primary)]">Keep room type active</span>
          </label>
          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" disabled={createRoomType.isPending || updateRoomType.isPending}>
              {editingRoomType ? 'Save changes' : 'Create room type'}
            </Button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
};
