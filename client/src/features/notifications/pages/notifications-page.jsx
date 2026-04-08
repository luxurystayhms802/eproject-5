import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BellRing, Plus, Search, Users2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/app/store/auth-store';
import { AdminModal } from '@/features/admin/components/admin-modal';
import { AdminEmptyState, AdminResultsSummary } from '@/features/admin/components/admin-list-state';
import { adminApi } from '@/features/admin/api';
import { getDisplayName } from '@/features/admin/display-utils';
import {
  adminInputClassName,
  adminLabelClassName,
  adminLabelTextClassName,
  adminSelectClassName,
  adminTextAreaClassName,
  NOTIFICATION_PRIORITY_OPTIONS,
  NOTIFICATION_TYPE_OPTIONS,
  USER_ROLE_OPTIONS,
} from '@/features/admin/config';
import { useCreateAdminNotification, useAdminRoles } from '@/features/admin/hooks';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '@/features/notifications/hooks';

const resolveBackPath = (pathname) => {
  const [, segment] = pathname.split('/');
  return segment ? `/${segment}/dashboard` : '/';
};

const createInitialComposer = () => ({
  type: 'system',
  title: '',
  message: '',
  priority: 'medium',
  link: '',
  targetRoles: [],
  targetUserIds: [],
});

export const NotificationsPage = () => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const [filters, setFilters] = useState({
    type: '',
    priority: '',
    readStatus: '',
    search: '',
    timeframe: '',
    direction: '',
  });
  const notificationsQuery = useNotifications({
    type: filters.type || undefined,
    priority: filters.priority || undefined,
    readStatus: filters.readStatus || undefined,
    timeframe: filters.timeframe || undefined,
    direction: filters.direction || undefined,
  });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const createAdminNotification = useCreateAdminNotification();
  const rolesQuery = useAdminRoles();

  const [composerOpen, setComposerOpen] = useState(false);
  const [composer, setComposer] = useState(createInitialComposer);

  const staffDirectoryQuery = useQuery({
    queryKey: ['notification-staff-directory'],
    queryFn: () => adminApi.listStaff({ limit: 100, status: 'active' }),
    enabled: ['admin', 'super_admin'].includes(user?.role),
  });

  const guestDirectoryQuery = useQuery({
    queryKey: ['notification-guest-directory'],
    queryFn: () => adminApi.listGuests({ limit: 100, status: 'active' }),
    enabled: ['admin', 'super_admin'].includes(user?.role),
  });

  const staffDirectory = staffDirectoryQuery.data ?? [];
  const guestDirectory = guestDirectoryQuery.data ?? [];
  const notifications = useMemo(() => {
    const items = notificationsQuery.data ?? [];
    if (!filters.search.trim()) {
      return items;
    }
    const expression = filters.search.trim().toLowerCase();
    return items.filter((item) => [item.title, item.message, item.type, item.priority].some((value) => String(value ?? '').toLowerCase().includes(expression)));
  }, [filters.search, notificationsQuery.data]);
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const permissions = user?.permissions ?? [];
  const isSuperAdmin = user?.role === 'super_admin';
  const canCompose = isSuperAdmin || permissions.includes('notifications.create');
  const emptyDescription = canCompose
    ? 'There are no alerts for the current filter set. Clear filters or compose a new operational alert from the admin side.'
    : 'There are no alerts relevant to your account for the current filter set. Clear filters or check back when a new operational update is issued to your role.';
  const activeFilters = useMemo(
    () => [
      filters.type ? `Type: ${filters.type}` : null,
      filters.priority ? `Priority: ${filters.priority}` : null,
      filters.readStatus ? `${filters.readStatus} only` : null,
      filters.timeframe ? `Time: ${filters.timeframe}` : null,
      filters.direction ? `Direction: ${filters.direction}` : null,
      filters.search ? `Search: ${filters.search}` : null,
    ].filter(Boolean),
    [filters],
  );

  const visibleStaff = useMemo(() => {
    if (!composer.targetRoles.length) {
      return staffDirectory;
    }
    return staffDirectory.filter((member) => composer.targetRoles.includes(member.role));
  }, [composer.targetRoles, staffDirectory]);

  const visibleGuests = useMemo(() => guestDirectory.filter((guest) => guest.status === 'active' || !guest.status), [guestDirectory]);
  const availableRoles = useMemo(() => [...(rolesQuery.data?.map((r) => r.name) ?? []), 'guest'], [rolesQuery.data]);

  const toggleTargetRole = (role) => {
    setComposer((current) => ({
      ...current,
      targetRoles: current.targetRoles.includes(role)
        ? current.targetRoles.filter((item) => item !== role)
        : [...current.targetRoles, role],
    }));
  };

  const toggleTargetUser = (userId) => {
    setComposer((current) => ({
      ...current,
      targetUserIds: current.targetUserIds.includes(userId)
        ? current.targetUserIds.filter((item) => item !== userId)
        : [...current.targetUserIds, userId],
    }));
  };

  const handleCreateNotification = async (event) => {
    event.preventDefault();

    await createAdminNotification.mutateAsync({
      type: composer.type,
      title: composer.title.trim(),
      message: composer.message.trim(),
      priority: composer.priority,
      link: composer.link.trim() || null,
      targetRoles: composer.targetRoles,
      targetUserIds: composer.targetUserIds,
    });

    setComposerOpen(false);
    setComposer(createInitialComposer());
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Track booking, billing, housekeeping, maintenance, and guest lifecycle events relevant to your role."
        action={(
          <div className="flex flex-wrap gap-3">
            <Link to={resolveBackPath(location.pathname)}>
              <Button variant="outline">Back to dashboard</Button>
            </Link>
            {canCompose ? (
              <Button variant="secondary" onClick={() => setComposerOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Compose alert
              </Button>
            ) : null}
            <Button variant="primary" disabled={markAllRead.isPending || unreadCount === 0} onClick={() => markAllRead.mutate()}>
              Mark all read
            </Button>
          </div>
        )}
      />

      <Card className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-6">
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              className={`${adminInputClassName} pl-11`}
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Search alert title, message, type, or priority"
            />
          </div>
          <select className={adminSelectClassName} value={filters.timeframe} onChange={(event) => setFilters((current) => ({ ...current, timeframe: event.target.value }))}>
            <option value="">Any time</option>
            <option value="today">Today</option>
            <option value="last7days">Last 7 days</option>
            <option value="last30days">Last 30 days</option>
          </select>
          {canCompose && (
            <select className={adminSelectClassName} value={filters.direction} onChange={(event) => setFilters((current) => ({ ...current, direction: event.target.value }))}>
              <option value="">All directions</option>
              <option value="inbound">Received by me</option>
              <option value="outbound">Sent by me</option>
            </select>
          )}
          <select className={adminSelectClassName} value={filters.readStatus} onChange={(event) => setFilters((current) => ({ ...current, readStatus: event.target.value }))}>
            <option value="">Read + unread</option>
            <option value="unread">Unread only</option>
            <option value="read">Read only</option>
          </select>
          <select className={adminSelectClassName} value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}>
            <option value="">All types</option>
            {NOTIFICATION_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select className={adminSelectClassName} value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}>
            <option value="">All priorities</option>
            {NOTIFICATION_PRIORITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <AdminResultsSummary
        count={notifications.length}
        noun="notifications"
        activeFilters={activeFilters}
        onClearFilters={() => setFilters({ type: '', priority: '', readStatus: '', search: '', timeframe: '', direction: '' })}
      />

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[var(--primary)]">Inbox</h2>
            <p className="text-sm text-[var(--muted-foreground)]">{unreadCount} unread items</p>
          </div>
          <BellRing className="h-5 w-5 text-[var(--accent)]" />
        </div>

        {notificationsQuery.isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/70" />
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-white/75 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                      {item.isCreator 
                         ? 'Sent by you' 
                         : item.createdByRole 
                           ? `Broadcast by ${item.createdByRole.replace('_', ' ')}`
                           : item.createdBy 
                             ? 'Official broadcast' 
                             : 'System generated'}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge value={item.type} />
                      <StatusBadge value={item.priority} />
                      {!item.isRead ? <StatusBadge value="active" className="bg-blue-100 text-blue-700" /> : null}
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--primary)]">{item.title}</h3>
                    <p className="text-sm leading-6 text-[var(--muted-foreground)]">{item.message}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Recently'}</p>
                  </div>
                  {!item.isRead ? (
                    <Button variant="outline" disabled={markRead.isPending} onClick={() => markRead.mutate(item.id)}>
                      Mark read
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
            </div>
          ) : (
          <AdminEmptyState
            title="No notifications available"
            description={emptyDescription}
            action={canCompose ? (
              <Button variant="secondary" onClick={() => setComposerOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Compose alert
              </Button>
            ) : null}
          />
          )}
      </Card>

      <AdminModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        title="Compose notification"
        description="Broadcast a targeted operational alert to the right hotel roles without leaving the admin command center."
      >
        <form className="grid gap-4" onSubmit={handleCreateNotification}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className={adminLabelClassName}>
              <span className={adminLabelTextClassName}>Type</span>
              <select className={adminSelectClassName} value={composer.type} onChange={(event) => setComposer((current) => ({ ...current, type: event.target.value }))}>
                {NOTIFICATION_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className={adminLabelClassName}>
              <span className={adminLabelTextClassName}>Priority</span>
              <select className={adminSelectClassName} value={composer.priority} onChange={(event) => setComposer((current) => ({ ...current, priority: event.target.value }))}>
                {NOTIFICATION_PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Title</span>
            <input className={adminInputClassName} value={composer.title} onChange={(event) => setComposer((current) => ({ ...current, title: event.target.value }))} />
          </label>

          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Message</span>
            <textarea className={adminTextAreaClassName} value={composer.message} onChange={(event) => setComposer((current) => ({ ...current, message: event.target.value }))} />
          </label>

          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Deep link (optional)</span>
            <input className={adminInputClassName} value={composer.link} onChange={(event) => setComposer((current) => ({ ...current, link: event.target.value }))} placeholder="/admin/reservations" />
          </label>

          <div className="space-y-3">
            <span className={adminLabelTextClassName}>Target roles</span>
            <div className="flex flex-wrap gap-2">
              {availableRoles.map((role) => {
                const active = composer.targetRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    className={[
                      'rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition',
                      active
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                        : 'border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)]',
                    ].join(' ')}
                    onClick={() => toggleTargetRole(role)}
                  >
                    {role.replaceAll('_', ' ')}
                  </button>
                );
              })}
            </div>
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">
              Selecting a role broadcasts this alert to all current and future accounts in that role, so multiple maintenance or housekeeping staff receive the same admin-issued update instantly.
            </p>
          </div>

          <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-secondary)]/65 px-4 py-3 text-sm text-[var(--muted-foreground)]">
            Audience summary: {composer.targetRoles.length} role broadcast{composer.targetRoles.length === 1 ? '' : 's'} and {composer.targetUserIds.length} direct recipient{composer.targetUserIds.length === 1 ? '' : 's'} selected.
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users2 className="h-4 w-4 text-[var(--accent)]" />
              <span className={adminLabelTextClassName}>Direct staff targeting (optional)</span>
            </div>
            <div className="rounded-[22px] border border-[var(--border)] bg-white/70 p-3">
              {staffDirectoryQuery.isLoading ? (
                <div className="grid gap-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-12 animate-pulse rounded-2xl bg-white/70" />
                  ))}
                </div>
              ) : visibleStaff.length > 0 ? (
                <div className="grid max-h-56 gap-2 overflow-y-auto pr-1">
                  {visibleStaff.map((member) => {
                    const active = composer.targetUserIds.includes(member.id);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        className={[
                          'flex items-center justify-between rounded-[18px] border px-3 py-3 text-left transition',
                          active
                            ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                            : 'border-[var(--border)] bg-white/80 hover:bg-white',
                        ].join(' ')}
                        onClick={() => toggleTargetUser(member.id)}
                      >
                        <div>
                          <p className="text-sm font-semibold text-[var(--primary)]">{member.fullName}</p>
                          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                            {member.role} | {member.department || 'team'}
                          </p>
                        </div>
                        {active ? <StatusBadge value="selected" className="bg-emerald-100 text-emerald-700" /> : null}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">No active staff match the selected target roles.</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users2 className="h-4 w-4 text-[var(--accent)]" />
              <span className={adminLabelTextClassName}>Direct guest targeting (optional)</span>
            </div>
            <div className="rounded-[22px] border border-[var(--border)] bg-white/70 p-3">
              {guestDirectoryQuery.isLoading ? (
                <div className="grid gap-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-12 animate-pulse rounded-2xl bg-white/70" />
                  ))}
                </div>
              ) : visibleGuests.length > 0 ? (
                <div className="grid max-h-56 gap-2 overflow-y-auto pr-1">
                  {visibleGuests.map((guest) => {
                    const active = composer.targetUserIds.includes(guest.id);
                    return (
                      <button
                        key={guest.id}
                        type="button"
                        className={[
                          'flex items-center justify-between rounded-[18px] border px-3 py-3 text-left transition',
                          active
                            ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                            : 'border-[var(--border)] bg-white/80 hover:bg-white',
                        ].join(' ')}
                        onClick={() => toggleTargetUser(guest.id)}
                      >
                        <div>
                          <p className="text-sm font-semibold text-[var(--primary)]">{getDisplayName(guest, guest.email)}</p>
                          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                            guest | {guest.email || 'no email'}
                          </p>
                        </div>
                        {active ? <StatusBadge value="selected" className="bg-emerald-100 text-emerald-700" /> : null}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">No active guests are available for direct targeting.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setComposerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" disabled={createAdminNotification.isPending || (composer.targetRoles.length === 0 && composer.targetUserIds.length === 0)}>
              Send notification
            </Button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
};
