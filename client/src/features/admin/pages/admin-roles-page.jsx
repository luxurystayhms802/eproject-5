import { useMemo, useState } from 'react';
import { Plus, Search, ShieldCheck, Sparkles, Users2 } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/app/store/auth-store';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdminModal } from '@/features/admin/components/admin-modal';
import { AdminToolbar } from '@/features/admin/components/admin-toolbar';
import {
  ROLE_PERMISSION_OPTIONS,
  adminInputClassName,
  adminLabelClassName,
  adminLabelTextClassName,
  adminTextAreaClassName,
  titleCase,
  formatPermission,
} from '@/features/admin/config';
import { validateRoleForm } from '@/features/admin/form-utils';
import { useAdminRoles, useCreateRole, useUpdateRole, useDeleteRole } from '@/features/admin/hooks';

const createInitialForm = () => ({
  name: '',
  description: '',
  permissions: [],
  isSystemRole: false,
});

const mapRoleToForm = (role) => ({
  name: role.name ?? '',
  description: role.description ?? '',
  permissions: (role.permissions ?? []).filter((permission) => ROLE_PERMISSION_OPTIONS.includes(permission)),
  isSystemRole: Boolean(role.isSystemRole),
});

const permissionGroups = Object.entries(
  ROLE_PERMISSION_OPTIONS.reduce((groups, permission) => {
    const [module] = permission.split('.');
    groups[module] = [...(groups[module] ?? []), permission];
    return groups;
  }, {}),
);

export const AdminRolesPage = () => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [form, setForm] = useState(createInitialForm());

  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];
  const isAdmin = user?.role === 'admin';
  const canCreate = isAdmin || permissions.includes('roles.create');
  const canUpdate = isAdmin || permissions.includes('roles.update');
  const canDelete = isAdmin || permissions.includes('roles.delete');

  const rolesQuery = useAdminRoles();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const roles = rolesQuery.data ?? [];

  const filteredRoles = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    if (!searchTerm) {
      return roles;
    }

    return roles.filter((role) => {
      const haystack = [role.name, role.description, ...(role.permissions ?? [])].join(' ').toLowerCase();
      return haystack.includes(searchTerm);
    });
  }, [roles, search]);

  const summary = useMemo(
    () => ({
      total: roles.length,
      system: roles.filter((role) => role.isSystemRole).length,
      custom: roles.filter((role) => !role.isSystemRole).length,
      permissions: ROLE_PERMISSION_OPTIONS.length,
    }),
    [roles],
  );

  const openCreateModal = () => {
    setEditingRole(null);
    setForm(createInitialForm());
    setModalOpen(true);
  };

  const openEditModal = (role) => {
    setEditingRole(role);
    setForm(mapRoleToForm(role));
    setModalOpen(true);
  };

  const togglePermission = (permission) => {
    setForm((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter((entry) => entry !== permission)
        : [...current.permissions, permission],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = validateRoleForm(form, Boolean(editingRole));
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      permissions: form.permissions,
      isSystemRole: form.isSystemRole,
    };

    try {
      if (editingRole) {
        const updated = await updateRole.mutateAsync({
          roleId: editingRole.id || editingRole._id,
          payload: {
            description: payload.description,
            permissions: payload.permissions,
            isSystemRole: payload.isSystemRole,
          },
        });

        // Force a session refresh if the admin edited their own active role
        if (user?.role === (updated?.name || form.name || editingRole.name)) {
          try {
            const me = await authApi.me();
            useAuthStore.getState().setUser(me);
          } catch (error) {
            console.error('Failed to update local session with new permissions', error);
          }
        }
      } else {
        await createRole.mutateAsync(payload);
      }

      setModalOpen(false);
    } catch {
      // Mutation hook already shows a toast.
    }
  };

  const handleDeleteItem = async (role) => {
    if (!role || role.isSystemRole) return;
    if (window.confirm(`Are you sure you want to permanently delete the role "${role.name}"?`)) {
      try {
        await deleteRole.mutateAsync(role.id || role._id);
      } catch {
        // Mutation hook already shows a toast.
      }
    }
  };

  const isAdminRole = editingRole?.name === 'admin';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Define operating roles, review module access, and keep authorization governance visible from the admin control layer."
        action={
          canCreate ? (
            <Button variant="secondary" className="rounded-2xl px-5" onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Create role
            </Button>
          ) : null
        }
      >
        <StatusBadge value={summary.custom ? 'active' : 'inactive'} />
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Roles" value={String(summary.total)} description="Named access profiles currently configured for the platform." icon={ShieldCheck} />
        <StatsCard title="System roles" value={String(summary.system)} description="Default governance roles shipped with the operational platform." icon={Users2} />
        <StatsCard title="Custom roles" value={String(summary.custom)} description="Additional access models created for tailored staff operations." icon={Sparkles} />
        <StatsCard title="Permissions" value={String(summary.permissions)} description="Distinct permission keys available for role-based access control." icon={ShieldCheck} />
      </div>

      <AdminToolbar title="Access governance" description="Search roles, inspect the permission matrix, and edit access posture without leaving the admin desk.">
        <label className="relative block w-full">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--accent-strong)]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={`${adminInputClassName} pl-11`}
            placeholder="Search by role name, description, or permission"
          />
        </label>
      </AdminToolbar>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[24px] text-[var(--primary)] [font-family:var(--font-display)]">Role registry</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Every role currently recognized by the admin authorization layer.</p>
            </div>
            <StatusBadge value={summary.total ? 'active' : 'inactive'} />
          </div>

          <div className="space-y-3">
            {rolesQuery.isLoading ? (
              Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-[20px] bg-white/70" />)
            ) : filteredRoles.length ? (
              filteredRoles.map((role) => {
                const isSelected = selectedRole && (selectedRole.id || selectedRole._id) === (role.id || role._id);
                return (
                <div
                  key={role.id || role._id}
                  className={[
                    'w-full rounded-[20px] border px-4 py-4 text-left transition',
                    isSelected
                      ? 'border-[var(--primary)] bg-white shadow-[0_12px_24px_rgba(16,36,63,0.06)] ring-1 ring-[var(--primary)]'
                      : 'border-[var(--border)] bg-white/78 hover:bg-white hover:shadow-[0_16px_34px_rgba(16,36,63,0.06)]'
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div 
                      className="flex-1 cursor-pointer" 
                      onClick={() => setSelectedRole((current) => current && (current.id || current._id) === (role.id || role._id) ? null : role)}
                    >
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge value={role.isSystemRole ? 'system_role' : 'custom_role'} />
                        {role.name === 'admin' && (
                          <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-700">
                            Locked
                          </span>
                        )}
                        <span className="inline-flex items-center rounded-full border border-[rgba(16,36,63,0.08)] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                          {role.permissions?.length ?? 0} permissions
                        </span>
                        <span className="inline-flex rounded-full border border-[rgba(16,36,63,0.08)] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                          {role.userCount ?? 0} {role.userCount === 1 ? 'user' : 'users'}
                        </span>
                      </div>
                      <h3 className="mt-3 text-xl text-[var(--primary)] [font-family:var(--font-display)]">{titleCase(role.name)}</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{role.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {canDelete && !role.isSystemRole && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="rounded-2xl px-4 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleDeleteItem(role)}
                          disabled={deleteRole.isPending}
                        >
                          Delete
                        </Button>
                      )}
                      {canUpdate ? (
                        <Button type="button" variant="outline" className="rounded-2xl px-4" onClick={() => openEditModal(role)}>
                          Edit
                        </Button>
                      ) : (
                        <Button type="button" variant="outline" className="rounded-2xl px-4 text-[var(--muted-foreground)]" onClick={() => openEditModal(role)}>
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                );
              })
            ) : (
              <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-white/70 px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                No roles match the current governance search.
              </div>
            )}
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="text-[24px] text-[var(--primary)] [font-family:var(--font-display)]">
              {selectedRole ? `${titleCase(selectedRole.name)} matrix` : 'Permission matrix'}
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              {selectedRole 
                ? `Active authorization capabilities provided to ${titleCase(selectedRole.name)} roles.` 
                : 'A grouped view of every permission key available for role-based admin access control. Click a role to preview capabilities.'}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {permissionGroups.map(([group, permissions]) => (
              <div key={group} className="rounded-[20px] border border-[var(--border)] bg-white/78 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-[var(--primary)]">{titleCase(group)}</h3>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">{permissions.length} keys</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {permissions.map((permission) => {
                    const active = selectedRole && selectedRole.permissions && selectedRole.permissions.includes(permission);
                    return (
                      <span
                        key={permission}
                        className={[
                          'inline-flex rounded-[12px] border px-2.5 py-1 text-[12px] font-medium transition',
                          active
                            ? 'border-[rgba(184,140,74,0.28)] bg-[var(--accent-soft)] text-[var(--primary)] shadow-sm'
                            : 'border-[rgba(16,36,63,0.08)] bg-white text-[var(--muted-foreground)]',
                        ].join(' ')}
                      >
                        {formatPermission(permission)}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRole ? (canUpdate ? 'Edit role' : 'View role') : 'Create role'}
        description="Shape how different staff groups access reservations, billing, rooms, reports, and operational controls."
        widthClassName="max-w-5xl"
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className={adminLabelClassName}>
              <span className={adminLabelTextClassName}>Role name</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className={adminInputClassName}
                disabled={Boolean(editingRole)}
                placeholder="operations_supervisor"
                required
              />
            </label>

            {isAdmin && (
              <label className={`${adminLabelClassName} justify-end`}>
                <label className="inline-flex items-center gap-3 rounded-[18px] border border-[var(--border)] bg-white/85 px-4 py-3 text-sm text-[var(--foreground)] mt-6">
                  <input
                    type="checkbox"
                    checked={form.isSystemRole}
                    onChange={(event) => setForm((current) => ({ ...current, isSystemRole: event.target.checked }))}
                  />
                  Mark as system role
                </label>
              </label>
            )}
          </div>

          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Description</span>
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className={adminTextAreaClassName}
              placeholder="Describe how this role should operate inside the hotel system."
              disabled={!canUpdate}
              required
            />
          </label>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-[var(--primary)]">Permissions</h3>
                  {isAdminRole && (
                    <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-700">
                      Locked
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {isAdminRole 
                    ? 'Super Administrator permissions are permanently locked by the system.'
                    : 'Choose the exact capabilities this role should have across the platform.'}
                </p>
              </div>
              <span className="rounded-full border border-[rgba(16,36,63,0.08)] bg-white px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                Selected {form.permissions.length}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {permissionGroups.map(([group, permissions]) => (
                <div key={group} className="rounded-[20px] border border-[var(--border)] bg-white/78 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-semibold text-[var(--primary)]">{titleCase(group)}</h4>
                    {canUpdate && !isAdminRole && (
                      <button
                        type="button"
                        className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            permissions: Array.from(new Set([...current.permissions, ...permissions])),
                          }))
                        }
                      >
                        Select all
                      </button>
                    )}
                  </div>
                  <div className="mt-3 grid gap-2">
                    {permissions.map((permission) => {
                      const active = form.permissions.includes(permission);

                      return (
                        <button
                          key={permission}
                          type="button"
                          className={[
                            'rounded-[16px] border px-3 py-2 text-left text-sm transition',
                            active
                              ? 'border-[rgba(184,140,74,0.28)] bg-[var(--accent-soft)] text-[var(--primary)]'
                              : 'border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)]',
                            isAdminRole ? 'opacity-70 cursor-not-allowed' : ''
                          ].join(' ')}
                          onClick={() => canUpdate && !isAdminRole && togglePermission(permission)}
                          disabled={(!canUpdate && !active) || isAdminRole}
                        >
                          {formatPermission(permission)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" className="rounded-2xl px-5" onClick={() => setModalOpen(false)}>
              {canUpdate ? 'Cancel' : 'Close'}
            </Button>
            {canUpdate ? (
              <Button
                type="submit"
                variant="secondary"
                className="rounded-2xl px-5"
                disabled={createRole.isPending || updateRole.isPending}
              >
                {createRole.isPending || updateRole.isPending ? 'Saving...' : editingRole ? 'Save role' : 'Create role'}
              </Button>
            ) : null}
          </div>
        </form>
      </AdminModal>
    </div>
  );
};
