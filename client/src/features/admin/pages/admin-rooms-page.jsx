import { useMemo, useState } from 'react';
import { Eye, Hotel, Plus, Search, SlidersHorizontal } from 'lucide-react';
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
import { AdminImageUploader } from '@/features/admin/components/admin-image-uploader';
import { AdminEmptyState, AdminResultsSummary } from '@/features/admin/components/admin-list-state';
import { AdminModal } from '@/features/admin/components/admin-modal';
import { AdminToolbar } from '@/features/admin/components/admin-toolbar';
import {
  adminInputClassName,
  adminLabelClassName,
  adminLabelTextClassName,
  adminSelectClassName,
  HOUSEKEEPING_STATUS_OPTIONS,
  ROOM_STATUS_OPTIONS,
  formatAdminCurrency,
} from '@/features/admin/config';
import { validateAdminRoomForm } from '@/features/admin/form-utils';
import { useAdminRoomTypes, useAdminRooms, useCreateRoom, useDeleteRoom, useUpdateRoom, useUpdateRoomStatus } from '@/features/admin/hooks';

const normalizeEnumValue = (value, fallback) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  return value.trim().toLowerCase().replaceAll(' ', '_').replaceAll('-', '_') || fallback;
};

const createInitialForm = () => ({
  roomNumber: '',
  floor: '',
  roomTypeId: '',
  customPrice: '',
  capacityAdults: '',
  capacityChildren: '',
  status: 'available',
  housekeepingStatus: 'clean',
  notes: '',
  images: [],
  isActive: true,
});

const mapRoomToForm = (room) => ({
  roomNumber: room.roomNumber ?? '',
  floor: String(room.floor ?? 0),
  roomTypeId: room.roomTypeId ?? '',
  customPrice: room.customPrice === null || room.customPrice === undefined ? '' : String(room.customPrice),
  capacityAdults: String(room.capacityAdults ?? 1),
  capacityChildren: String(room.capacityChildren ?? 0),
  status: normalizeEnumValue(room.status, 'available'),
  housekeepingStatus: normalizeEnumValue(room.housekeepingStatus, 'clean'),
  notes: room.notes ?? '',
  images: room.images ?? [],
  isActive: room.isActive !== false,
});

const buildRoomPayload = (form) => ({
  roomNumber: form.roomNumber.trim(),
  floor: Number(form.floor),
  roomTypeId: form.roomTypeId,
  customPrice: form.customPrice === '' ? null : Number(form.customPrice),
  capacityAdults: Number(form.capacityAdults),
  capacityChildren: Number(form.capacityChildren),
  status: normalizeEnumValue(form.status, 'available'),
  housekeepingStatus: normalizeEnumValue(form.housekeepingStatus, 'clean'),
  notes: form.notes.trim() || null,
  images: form.images,
  isActive: Boolean(form.isActive),
});

const createInitialFilters = () => ({
  search: '',
  status: '',
  housekeepingStatus: '',
  roomTypeId: '',
  floor: '',
});

const getRoomTypeBasePrice = (roomTypes, roomTypeId) =>
  roomTypes.find((roomType) => roomType.id === roomTypeId)?.basePrice ?? null;

export const AdminRoomsPage = () => {
  const [filters, setFilters] = useState(createInitialFilters);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [form, setForm] = useState(createInitialForm);

  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];
  const isAdmin = user?.role === 'admin';
  const canUpdate = isAdmin || permissions.includes('rooms.update');
  const canCreate = isAdmin || permissions.includes('rooms.create');
  const canDelete = isAdmin || permissions.includes('rooms.delete');

  const roomTypesQuery = useAdminRoomTypes();
  const roomsQuery = useAdminRooms({
    search: filters.search.trim() || undefined,
    status: filters.status || undefined,
    housekeepingStatus: filters.housekeepingStatus || undefined,
    roomTypeId: filters.roomTypeId || undefined,
    floor: filters.floor === '' ? undefined : Number(filters.floor),
  });

  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const updateRoomStatus = useUpdateRoomStatus();
  const deleteRoom = useDeleteRoom();

  const roomTypes = roomTypesQuery.data ?? [];
  const rooms = roomsQuery.data ?? [];
  const selectedRoomTypeBasePrice = getRoomTypeBasePrice(roomTypes, form.roomTypeId);

  const summary = useMemo(
    () => ({
      total: rooms.length,
      available: rooms.filter((room) => room.status === 'available').length,
      occupied: rooms.filter((room) => room.status === 'occupied').length,
      maintenance: rooms.filter((room) => room.status === 'maintenance').length,
    }),
    [rooms],
  );

  const activeFilters = useMemo(
    () => [
      filters.search ? `Search: ${filters.search}` : null,
      filters.roomTypeId ? `Room type filtered` : null,
      filters.status ? `Status: ${filters.status}` : null,
      filters.housekeepingStatus ? `Housekeeping: ${filters.housekeepingStatus}` : null,
      filters.floor ? `Floor: ${filters.floor}` : null,
    ].filter(Boolean),
    [filters],
  );

  const openCreateModal = () => {
    const defaultRoomTypeId = roomTypes[0]?.id ?? '';
    const defaultBasePrice = getRoomTypeBasePrice(roomTypes, defaultRoomTypeId);
    setEditingRoom(null);
    setForm({
      ...createInitialForm(),
      roomTypeId: defaultRoomTypeId,
      customPrice: defaultBasePrice === null ? '' : String(defaultBasePrice),
    });
    setModalOpen(true);
  };

  const openEditModal = (room) => {
    setSelectedRoom(null);
    setEditingRoom(room);
    setForm(mapRoomToForm(room));
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = validateAdminRoomForm(form);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    const payload = buildRoomPayload(form);

    try {
      if (editingRoom) {
        await updateRoom.mutateAsync({
          roomId: editingRoom.id,
          payload,
        });
      } else {
        await createRoom.mutateAsync(payload);
      }

      setModalOpen(false);
    } catch {
      // Mutation hook already shows a toast.
    }
  };

  const handleStatusChange = async (room, nextStatus) => {
    try {
      await updateRoomStatus.mutateAsync({
        roomId: room.id,
        payload: {
          status: nextStatus,
          housekeepingStatus: room.housekeepingStatus,
        },
      });
    } catch {
      // Mutation hook already shows a toast.
    }
  };

  const handleArchive = async (roomId) => {
    const confirmed = window.confirm('Archive this room from active inventory?');
    if (!confirmed) {
      return;
    }

    try {
      await deleteRoom.mutateAsync(roomId);
      setSelectedRoom(null);
    } catch {
      // Mutation hook already shows a toast.
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rooms Management"
        description="Control live inventory, pricing overrides, housekeeping readiness, and room-level availability from one operational surface."
      >
        <div className="rounded-[22px] border border-white/60 bg-white/72 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Available stock</p>
          <p className="mt-2 text-xl text-[var(--primary)] [font-family:var(--font-display)]">{summary.available}</p>
        </div>
        <div className="rounded-[22px] border border-white/60 bg-[linear-gradient(135deg,var(--primary)_0%,#21436b_68%,var(--accent)_160%)] px-4 py-3 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/68">Occupied now</p>
          <p className="mt-2 text-xl [font-family:var(--font-display)]">{summary.occupied}</p>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Inventory" value={String(summary.total)} description="Rooms currently visible to the admin inventory control filters" icon={Hotel} />
        <StatsCard title="Available" value={String(summary.available)} description="Ready-to-sell inventory aligned with clean operational status" icon={SlidersHorizontal} />
        <StatsCard title="Occupied" value={String(summary.occupied)} description="Rooms with checked-in or active in-house reservation presence" icon={Hotel} />
        <StatsCard title="Maintenance" value={String(summary.maintenance)} description="Inventory temporarily blocked by active maintenance pressure" icon={SlidersHorizontal} />
      </div>

      <AdminToolbar
        title="Inventory control"
        description="Filter live stock, update readiness, and adjust room-level pricing or capacity as operations evolve."
        actions={
          canCreate ? (
            <Button variant="secondary" onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Add room
            </Button>
          ) : null
        }
      >
        <div className="grid w-full gap-3 lg:grid-cols-[minmax(0,1.25fr)_repeat(4,minmax(0,0.66fr))]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              className={`${adminInputClassName} pl-11`}
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Search room number or notes"
            />
          </div>
          <select className={adminSelectClassName} value={filters.roomTypeId} onChange={(event) => setFilters((current) => ({ ...current, roomTypeId: event.target.value }))}>
            <option value="">All room types</option>
            {roomTypes.map((roomType) => (
              <option key={roomType.id} value={roomType.id}>
                {roomType.name}
              </option>
            ))}
          </select>
          <select className={adminSelectClassName} value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="">All room statuses</option>
            {ROOM_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            className={adminInputClassName}
            value={filters.floor}
            onChange={(event) => setFilters((current) => ({ ...current, floor: event.target.value }))}
            placeholder="Floor"
          />
          <select className={adminSelectClassName} value={filters.housekeepingStatus} onChange={(event) => setFilters((current) => ({ ...current, housekeepingStatus: event.target.value }))}>
            <option value="">All housekeeping states</option>
            {HOUSEKEEPING_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </AdminToolbar>

      <AdminResultsSummary
        count={rooms.length}
        noun="rooms"
        activeFilters={activeFilters}
        onClearFilters={() => setFilters(createInitialFilters())}
      />

      <Card className="space-y-4">
        {roomsQuery.isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-[22px] bg-white/70" />
            ))}
          </div>
        ) : rooms.length > 0 ? (
          <div className="space-y-3">
            {rooms.map((room) => (
              <div key={room.id} className="grid gap-4 rounded-[24px] border border-[var(--border)] bg-white/76 p-5 shadow-[0_16px_34px_rgba(16,36,63,0.05)] xl:grid-cols-[minmax(0,1.55fr)_minmax(250px,0.85fr)_auto] xl:items-start">
                <div className="min-w-0">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                    {room.images?.[0] ? (
                      <div className="h-28 w-full overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface-muted)] xl:h-28 xl:w-32">
                        <img src={room.images[0]} alt={`Room ${room.roomNumber}`} className="h-full w-full object-cover" />
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge value={room.status} />
                        <StatusBadge value={room.housekeepingStatus} />
                        <StatusBadge value={room.isActive ? 'active' : 'inactive'} />
                      </div>
                      <div>
                        <h3 className="text-2xl text-[var(--primary)] [font-family:var(--font-display)]">Room {room.roomNumber}</h3>
                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                          {room.roomType?.name ?? 'Room type'} | Floor {room.floor} | Capacity {room.capacityAdults}A / {room.capacityChildren}C
                        </p>
                      </div>
                      <p className="text-sm leading-6 text-[var(--muted-foreground)]">{room.notes || 'No operational note attached to this room yet.'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-[22px] border border-[var(--border)] bg-white/84 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Effective rate</p>
                    <p className="mt-2 text-lg font-semibold text-[var(--primary)]">{formatAdminCurrency(room.effectivePrice)}</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{room.customPrice === null ? 'Using room-type base price' : 'Custom override enabled'}</p>
                  </div>
                  <div className="rounded-[22px] border border-[var(--border)] bg-white/84 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Readiness</p>
                    <p className="mt-2 text-lg font-semibold capitalize text-[var(--primary)]">{room.housekeepingStatus}</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{room.isActive ? 'Visible in live inventory' : 'Archived from active stock'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-start justify-end gap-3 xl:flex-col xl:items-stretch">
                  <Button variant="outline" onClick={() => setSelectedRoom(room)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View details
                  </Button>
                  {canUpdate && (
                    <Button variant="outline" onClick={() => openEditModal(room)}>
                      Edit room
                    </Button>
                  )}
                  {canDelete && (
                    <Button variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => handleArchive(room.id)}>
                      Archive
                    </Button>
                  )}
                </div>

                {canUpdate && (
                  <div className="xl:col-span-3 flex flex-wrap gap-2 border-t border-[rgba(16,36,63,0.08)] pt-4">
                    {['available', 'reserved', 'occupied', 'cleaning', 'maintenance'].map((status) => (
                      <Button
                        key={status}
                        type="button"
                        variant="outline"
                        className={room.status === status ? 'border-[var(--accent)] text-[var(--accent-strong)]' : ''}
                        onClick={() => handleStatusChange(room, status)}
                      >
                        {status.replaceAll('_', ' ')}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <AdminEmptyState
            title="No rooms match these filters"
            description="Change the room type, status, floor, or housekeeping filters, or add a new room to expand inventory."
            action={
              canCreate ? (
                <Button variant="secondary" onClick={openCreateModal}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add room
                </Button>
              ) : null
            }
          />
        )}
      </Card>

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRoom ? 'Edit room' : 'Create room'}
        description="Define room identity, room type linkage, pricing behavior, and live operational readiness."
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Room number</span>
            <input className={adminInputClassName} value={form.roomNumber} onChange={(event) => setForm((current) => ({ ...current, roomNumber: event.target.value }))} />
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Floor</span>
            <input type="number" min="0" max="1" className={adminInputClassName} value={form.floor} onChange={(event) => setForm((current) => ({ ...current, floor: event.target.value }))} />
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Room type</span>
            <select
              className={adminSelectClassName}
              value={form.roomTypeId}
              onChange={(event) => {
                const nextRoomTypeId = event.target.value;
                const nextBasePrice = getRoomTypeBasePrice(roomTypes, nextRoomTypeId);
                setForm((current) => ({
                  ...current,
                  roomTypeId: nextRoomTypeId,
                  customPrice: nextBasePrice === null ? '' : String(nextBasePrice),
                }));
              }}
            >
              <option value="">Select room type</option>
              {roomTypes.map((roomType) => (
                <option key={roomType.id} value={roomType.id}>
                  {roomType.name} | {formatAdminCurrency(roomType.basePrice)}
                </option>
              ))}
            </select>
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Custom price</span>
            <div className="space-y-2">
              <input
                type="number"
                min="0"
                max="100000"
                className={adminInputClassName}
                value={form.customPrice}
                onChange={(event) => setForm((current) => ({ ...current, customPrice: event.target.value }))}
                placeholder="Auto-filled from selected room type"
              />
              <p className="text-xs text-[var(--muted-foreground)]">
                {selectedRoomTypeBasePrice === null
                  ? 'Select a room type to fetch its default base price.'
                  : `Selected room type base price: ${formatAdminCurrency(selectedRoomTypeBasePrice)}. You can still override it manually.`}
              </p>
            </div>
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Adults capacity</span>
            <input type="number" min="1" max="20" className={adminInputClassName} value={form.capacityAdults} onChange={(event) => setForm((current) => ({ ...current, capacityAdults: event.target.value }))} />
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Children capacity</span>
            <input type="number" min="0" max="20" className={adminInputClassName} value={form.capacityChildren} onChange={(event) => setForm((current) => ({ ...current, capacityChildren: event.target.value }))} />
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Room status</span>
            <select className={adminSelectClassName} value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
              {ROOM_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Housekeeping status</span>
            <select className={adminSelectClassName} value={form.housekeepingStatus} onChange={(event) => setForm((current) => ({ ...current, housekeepingStatus: event.target.value }))}>
              {HOUSEKEEPING_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className={`${adminLabelClassName} md:col-span-2`}>
            <span className={adminLabelTextClassName}>Operational notes</span>
            <textarea className={`${adminInputClassName} min-h-[110px]`} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          </label>
          <AdminImageUploader
            label="Room gallery"
            folder="rooms"
            value={form.images}
            onChange={(images) => setForm((current) => ({ ...current, images }))}
            helperText="Upload room images. Cloudinary URLs will be stored and shown automatically."
          />
          <label className="flex items-center gap-3 rounded-[20px] border border-[var(--border)] bg-white/72 px-4 py-3">
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
            <span className="text-sm font-medium text-[var(--primary)]">Keep room active in inventory</span>
          </label>
          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" disabled={createRoom.isPending || updateRoom.isPending}>
              {editingRoom ? 'Save room' : 'Create room'}
            </Button>
          </div>
        </form>
      </AdminModal>

      <AdminDetailDrawer
        open={Boolean(selectedRoom)}
        onClose={() => setSelectedRoom(null)}
        title={selectedRoom ? `Room ${selectedRoom.roomNumber}` : ''}
        subtitle="Review inventory status, pricing behaviour, housekeeping readiness, and image assets from one compact side panel."
        actions={selectedRoom ? (
          <>
            {canUpdate && (
              <Button variant="outline" onClick={() => openEditModal(selectedRoom)}>
                Edit room
              </Button>
            )}
            {canDelete && (
              <Button variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => handleArchive(selectedRoom.id)}>
                Archive
              </Button>
            )}
          </>
        ) : null}
      >
        {selectedRoom ? (
          <>
            <AdminDetailSection title="Room profile" description="Static metadata and operational room-type linkage.">
              <AdminDetailGrid>
                <AdminDetailItem label="Room type" value={selectedRoom.roomType?.name || 'Not linked'} emphasis />
                <AdminDetailItem label="Floor" value={String(selectedRoom.floor)} />
                <AdminDetailItem label="Adults capacity" value={String(selectedRoom.capacityAdults)} />
                <AdminDetailItem label="Children capacity" value={String(selectedRoom.capacityChildren)} />
              </AdminDetailGrid>
            </AdminDetailSection>

            <AdminDetailSection title="Operational status" description="Current readiness and housekeeping state used by reservation workflows.">
              <AdminDetailGrid>
                <AdminDetailItem label="Room status" value={selectedRoom.status} emphasis />
                <AdminDetailItem label="Housekeeping" value={selectedRoom.housekeepingStatus} emphasis />
                <AdminDetailItem label="Inventory flag" value={selectedRoom.isActive ? 'Active' : 'Inactive'} />
                <AdminDetailItem label="Last cleaned" value={selectedRoom.lastCleanedAt ? new Date(selectedRoom.lastCleanedAt).toLocaleString() : 'Not recorded'} />
              </AdminDetailGrid>
            </AdminDetailSection>

            <AdminDetailSection title="Pricing and notes" description="Commercial pricing posture and room-level notes.">
              <AdminDetailGrid columns={1}>
                <AdminDetailItem label="Effective rate" value={formatAdminCurrency(selectedRoom.effectivePrice)} emphasis />
                <AdminDetailItem label="Custom price" value={selectedRoom.customPrice === null ? 'Using room-type base rate' : formatAdminCurrency(selectedRoom.customPrice)} />
                <AdminDetailItem label="Operational notes" value={selectedRoom.notes || 'No note stored'} />
              </AdminDetailGrid>
            </AdminDetailSection>

            {selectedRoom.images?.length ? (
              <AdminDetailSection title="Room gallery" description="Uploaded Cloudinary-backed room images.">
                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedRoom.images.map((image, index) => (
                    <div key={`${image}-${index}`} className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface-muted)]">
                      <img src={image} alt={`Room ${selectedRoom.roomNumber} ${index + 1}`} className="h-40 w-full object-cover" />
                    </div>
                  ))}
                </div>
              </AdminDetailSection>
            ) : null}
          </>
        ) : null}
      </AdminDetailDrawer>
    </div>
  );
};
