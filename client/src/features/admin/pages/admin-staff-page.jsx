import { useMemo, useState } from 'react';
import { Eye, Plus, Search, Settings, ShieldCheck, UserCog } from 'lucide-react';
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
import { DepartmentManagerModal } from '@/features/admin/components/department-manager-modal';
import {
  adminInputClassName,
  adminLabelClassName,
  adminLabelTextClassName,
  adminSelectClassName,
  ADMIN_ROLE_OPTIONS,
  STAFF_SHIFT_OPTIONS,
  USER_STATUS_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
  getDisplayRoleLabel,
  titleCase,
} from '@/features/admin/config';
import { getDisplayName } from '@/features/admin/display-utils';

const SYSTEM_ROLE_DEPARTMENTS = {
  admin: 'management',
  manager: 'management',
  receptionist: 'reception',
  housekeeping: 'housekeeping',
  maintenance: 'maintenance',
};
import { validateAdminStaffForm } from '@/features/admin/form-utils';
import { useAdminStaff, useCreateStaff, useUpdateStaff, useAdminRoles, useAdminDepartments } from '@/features/admin/hooks';

const createInitialForm = () => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  role: '',
  status: 'active',
  profile: {
    employmentStatus: 'active',
    department: '',
    designation: '',
    joiningDate: '',
    shift: '',
    salary: '',
    address: '',
  },
});

const mapStaffToForm = (member) => ({
  firstName: member.firstName ?? '',
  lastName: member.lastName ?? '',
  email: member.email ?? '',
  phone: member.phone ?? '',
  password: '',
  role: getDisplayRoleLabel(member.role ?? 'manager'),
  status: member.status ?? 'active',
  profile: {
    employmentStatus: member.employmentStatus ?? 'active',
    department: member.department ?? 'management',
    designation: member.designation ?? '',
    joiningDate: member.joiningDate ? new Date(member.joiningDate).toISOString().slice(0, 10) : '',
    shift: member.shift ?? 'morning',
    salary: member.salary ?? '',
    address: member.address ?? '',
  },
});

const buildStaffPayload = (form, isEditing) => {
  const payload = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    role: form.role,
    status: form.status,
    profile: {
      employmentStatus: form.profile.employmentStatus,
      department: form.profile.department,
      designation: form.profile.designation.trim(),
      joiningDate: form.profile.joiningDate,
      shift: form.profile.shift,
      salary: form.profile.salary === '' ? null : Number(form.profile.salary),
      address: form.profile.address.trim() || null,
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
  role: '',
  department: '',
  status: '',
});

export const AdminStaffPage = () => {
  const [filters, setFilters] = useState(createInitialFilters);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [form, setForm] = useState(createInitialForm);
  const [deptModalOpen, setDeptModalOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];
  const isAdmin = user?.role === 'admin';
  const canUpdate = isAdmin || permissions.includes('staff.update');
  const canCreate = isAdmin || permissions.includes('staff.create');
  const isCurrentUserAdmin = user?.role === 'admin';

  const staffQuery = useAdminStaff({
    search: filters.search.trim() || undefined,
    role: filters.role || undefined,
    department: filters.department || undefined,
    status: filters.status || undefined,
  });
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const rolesQuery = useAdminRoles();
  const departmentsQuery = useAdminDepartments();
  const staff = staffQuery.data ?? [];
  const departments = departmentsQuery.data ?? [];

  const summary = useMemo(() => ({
    total: staff.length,
    active: staff.filter((member) => member.status === 'active').length,
    reception: staff.filter((member) => member.role === 'receptionist').length,
    housekeeping: staff.filter((member) => member.role === 'housekeeping').length,
  }), [staff]);

  const activeFilters = useMemo(
    () => [
      filters.search ? `Search: ${filters.search}` : null,
      filters.role ? `Role: ${filters.role}` : null,
      filters.department ? `Department: ${filters.department}` : null,
      filters.status ? `Status: ${filters.status}` : null,
    ].filter(Boolean),
    [filters],
  );

  const openCreateModal = () => {
    setEditingStaff(null);
    setForm(createInitialForm());
    setModalOpen(true);
  };

  const openEditModal = (member) => {
    setSelectedStaff(null);
    setEditingStaff(member);
    setForm(mapStaffToForm(member));
    setModalOpen(true);
  };

  const isDepartmentLocked = Boolean(SYSTEM_ROLE_DEPARTMENTS[form.role]);

  const handleRoleChange = (event) => {
    const newRole = event.target.value;
    setForm((current) => {
      const nextForm = { ...current, role: newRole };
      const strictDept = SYSTEM_ROLE_DEPARTMENTS[newRole];
      if (strictDept) {
        nextForm.profile = { ...current.profile, department: strictDept };
      }
      return nextForm;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = validateAdminStaffForm(form, Boolean(editingStaff));
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    const payload = buildStaffPayload(form, Boolean(editingStaff));

    try {
      if (editingStaff) {
        await updateStaff.mutateAsync({
          staffId: editingStaff.id,
          payload,
        });
      } else {
        await createStaff.mutateAsync(payload);
      }

      setModalOpen(false);
    } catch {
      // Mutation hook already shows a toast.
    }
  };

  const handleQuickStatus = async (member, status) => {
    try {
      await updateStaff.mutateAsync({
        staffId: member.id,
        payload: { status },
      });
    } catch {
      // Mutation hook already shows a toast.
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Management"
        description="Provision hotel teams, fine-tune role coverage, and control operational access across reception, housekeeping, maintenance, and management."
      >
        <div className="rounded-[22px] border border-white/60 bg-white/72 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Active staff</p>
          <p className="mt-2 text-xl text-[var(--primary)] [font-family:var(--font-display)]">{summary.active}</p>
        </div>
        <div className="rounded-[22px] border border-white/60 bg-[linear-gradient(135deg,var(--primary)_0%,#21436b_68%,var(--accent)_160%)] px-4 py-3 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/68">Desk + floor mix</p>
          <p className="mt-2 text-xl [font-family:var(--font-display)]">{summary.reception + summary.housekeeping}</p>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total staff" value={String(summary.total)} description="Team members visible under current admin filters" icon={UserCog} />
        <StatsCard title="Active" value={String(summary.active)} description="Accounts currently allowed to access operational modules" icon={ShieldCheck} />
        <StatsCard title="Reception" value={String(summary.reception)} description="Front-desk members supporting arrivals, billing, and guest desk activity" icon={UserCog} />
        <StatsCard title="Housekeeping" value={String(summary.housekeeping)} description="Service-floor crew aligned to room turnover and readiness" icon={ShieldCheck} />
      </div>

      <AdminToolbar
        title="Team control"
        description="Search and filter your operating team, then open create or edit flows without leaving the page."
        actions={
          canCreate ? (
            <Button variant="secondary" onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Provision staff
            </Button>
          ) : null
        }
      >
        <div className="grid w-full gap-3 lg:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,0.7fr))]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              className={`${adminInputClassName} pl-11`}
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Search by name, email, or phone"
            />
          </div>
          <select className={adminSelectClassName} value={filters.role} onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}>
            <option value="">All roles</option>
            {rolesQuery.data?.map((r) => <option key={r.id || r.name} value={r.name} className="capitalize">{r.name}</option>)}
          </select>
          <select className={adminSelectClassName} value={filters.department} onChange={(event) => setFilters((current) => ({ ...current, department: event.target.value }))}>
            <option value="">All departments</option>
            {departments.map((dept) => <option key={dept.name} value={dept.name}>{dept.label}</option>)}
          </select>
          <select className={adminSelectClassName} value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="">All statuses</option>
            {['active', 'inactive', 'suspended'].map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
      </AdminToolbar>

      <AdminResultsSummary
        count={staff.length}
        noun="staff records"
        activeFilters={activeFilters}
        onClearFilters={() => setFilters(createInitialFilters())}
      />

      <Card className="space-y-4">
        {staffQuery.isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-[22px] bg-white/70" />
            ))}
          </div>
        ) : staff.length > 0 ? (
          <div className="space-y-3">
            {staff.map((member) => (
              <div key={member.id} className="grid gap-4 rounded-[24px] border border-[var(--border)] bg-white/76 p-5 shadow-[0_16px_34px_rgba(16,36,63,0.05)] xl:grid-cols-[minmax(0,1.6fr)_minmax(260px,0.85fr)_auto] xl:items-start">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={member.employmentStatus} />
                    <StatusBadge value={member.status} className={member.status === 'active' ? 'bg-indigo-100 text-indigo-700' : 'bg-red-100 text-red-700'} />
                    <StatusBadge value={getDisplayRoleLabel(member.role)} />
                    {member.department ? <StatusBadge value={member.department} className="bg-slate-100 text-slate-700" /> : null}
                  </div>
                  <div>
                    <h3 className="text-2xl text-[var(--primary)] [font-family:var(--font-display)]">{getDisplayName(member, 'Staff member')}</h3>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{member.email} | {member.phone}</p>
                  </div>
                  <div className="grid gap-2 text-sm text-[var(--muted-foreground)] sm:grid-cols-2">
                    <span>Designation: <strong className="font-semibold text-[var(--primary)]">{member.designation || 'n/a'}</strong></span>
                    <span>Shift: <strong className="font-semibold capitalize text-[var(--primary)]">{member.shift || 'n/a'}</strong></span>
                    <span>Employee code: <strong className="font-semibold text-[var(--primary)]">{member.employeeCode || 'Auto'}</strong></span>
                    <span>Department: <strong className="font-semibold capitalize text-[var(--primary)]">{member.department || 'n/a'}</strong></span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-[22px] border border-[var(--border)] bg-white/84 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Access posture</p>
                    <p className="mt-2 text-lg font-semibold capitalize text-[var(--primary)]">{member.role}</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)] capitalize">{member.status === 'active' ? 'Account Active' : 'Account Inactive'}</p>
                  </div>
                  <div className="rounded-[22px] border border-[var(--border)] bg-white/84 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Employment profile</p>
                    <p className="mt-2 text-lg font-semibold capitalize text-[var(--primary)]">{member.employmentStatus} - {member.designation || 'Pending'}</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{member.joiningDate ? `Joined ${new Date(member.joiningDate).toLocaleDateString()}` : 'Joining date pending'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-start justify-end gap-3 xl:flex-col xl:items-stretch">
                  <Button variant="outline" onClick={() => setSelectedStaff(member)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View details
                  </Button>
                  {canUpdate && (
                  <Button variant="outline" disabled={member.role === 'admin' && !isCurrentUserAdmin} onClick={() => openEditModal(member)}>
                      Edit profile
                    </Button>
                  )}
                  {canUpdate && member.status !== 'inactive' ? (
                    <Button variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50" disabled={member.role === 'admin' && !isCurrentUserAdmin} onClick={() => handleQuickStatus(member, 'inactive')}>
                      Deactivate
                    </Button>
                  ) : canUpdate ? (
                    <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" disabled={member.role === 'admin' && !isCurrentUserAdmin} onClick={() => handleQuickStatus(member, 'active')}>
                      Reactivate
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AdminEmptyState
            title="No staff match these filters"
            description="Adjust the role, department, or status filters, or provision a new account to strengthen operational coverage."
            action={
              canCreate ? (
                <Button variant="secondary" onClick={openCreateModal}>
                  <Plus className="mr-2 h-4 w-4" />
                  Provision staff
                </Button>
              ) : null
            }
          />
        )}
      </Card>

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingStaff ? 'Edit staff member' : 'Provision staff account'}
        description="Create or update operational access with role, department, shift, and availability context."
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
            <input className={adminInputClassName} value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} autoComplete="new-password" />
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
            <span className={adminLabelTextClassName}>{editingStaff ? 'Reset password (optional)' : 'Password'}</span>
            <input type="password" className={adminInputClassName} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} autoComplete="new-password" />
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Role</span>
            <select className={adminSelectClassName} value={form.role} onChange={handleRoleChange}>
              <option value="">Select role</option>
              {rolesQuery.data?.map((r) => <option key={r.id || r.name} value={r.name} className="capitalize">{r.name}</option>)}
            </select>
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Account access</span>
            <select className={adminSelectClassName} value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
              {USER_STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Employment status</span>
            <select className={adminSelectClassName} value={form.profile.employmentStatus} onChange={(event) => setForm((current) => ({ ...current, profile: { ...current.profile, employmentStatus: event.target.value } }))}>
              {EMPLOYMENT_STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className={adminLabelClassName}>
            <span className="flex items-center justify-between w-full">
              <span className={adminLabelTextClassName}>Department</span>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-strong)] hover:underline"
                onClick={() => setDeptModalOpen(true)}
              >
                <Settings className="h-3 w-3" />
                Manage
              </button>
            </span>
            <select 
              className={adminSelectClassName} 
              value={form.profile.department} 
              onChange={(event) => setForm((current) => ({ ...current, profile: { ...current.profile, department: event.target.value } }))}
              disabled={isDepartmentLocked}
            >
              <option value="">Select department</option>
              {departments.map((dept) => <option key={dept.name} value={dept.name}>{dept.label}</option>)}
              {isDepartmentLocked && form.profile.department && !departments.find(d => d.name === form.profile.department) && (
                <option value={form.profile.department}>{titleCase(form.profile.department)}</option>
              )}
            </select>
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Designation</span>
            <input
              className={adminInputClassName}
              value={form.profile.designation}
              onChange={(event) => {
                const val = event.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                setForm((current) => ({ ...current, profile: { ...current.profile, designation: val } }));
              }}
            />
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Joining date</span>
            <input 
              type="date" 
              className={adminInputClassName} 
              value={form.profile.joiningDate} 
              onChange={(event) => setForm((current) => ({ ...current, profile: { ...current.profile, joiningDate: event.target.value } }))}
              required
            />
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Shift</span>
            <select className={adminSelectClassName} value={form.profile.shift} onChange={(event) => setForm((current) => ({ ...current, profile: { ...current.profile, shift: event.target.value } }))}>
              <option value="">Select shift</option>
              {STAFF_SHIFT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Salary (optional)</span>
            <input type="number" min="0" className={adminInputClassName} value={form.profile.salary} onChange={(event) => setForm((current) => ({ ...current, profile: { ...current.profile, salary: event.target.value } }))} />
          </label>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Address</span>
            <input className={adminInputClassName} value={form.profile.address} onChange={(event) => setForm((current) => ({ ...current, profile: { ...current.profile, address: event.target.value } }))} />
          </label>
          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" disabled={createStaff.isPending || updateStaff.isPending}>
              {editingStaff ? 'Save staff member' : 'Create staff member'}
            </Button>
          </div>
        </form>
      </AdminModal>

      <AdminDetailDrawer
        open={Boolean(selectedStaff)}
        onClose={() => setSelectedStaff(null)}
        title={getDisplayName(selectedStaff, '')}
        subtitle="Review staff identity, role access, employment posture, and operational profile without opening edit mode."
        actions={selectedStaff ? (
          <>
            {canUpdate && (
              <Button variant="outline" disabled={selectedStaff.role === 'admin' && !isCurrentUserAdmin} onClick={() => openEditModal(selectedStaff)}>
                Edit profile
              </Button>
            )}
            {canUpdate && (
              <Button
                variant="outline"
                className={selectedStaff.status !== 'inactive' ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}
                disabled={selectedStaff.role === 'admin' && !isCurrentUserAdmin}
                onClick={() => handleQuickStatus(selectedStaff, selectedStaff.status !== 'inactive' ? 'inactive' : 'active')}
              >
                {selectedStaff.status !== 'inactive' ? 'Deactivate' : 'Reactivate'}
              </Button>
            )}
          </>
        ) : null}
      >
        {selectedStaff ? (
          <>
            <AdminDetailSection title="Account overview" description="Primary identity, access role, and live account readiness.">
              <AdminDetailGrid>
                <AdminDetailItem label="Role" value={getDisplayRoleLabel(selectedStaff.role)} emphasis />
                <AdminDetailItem label="Account access" value={selectedStaff.status} emphasis />
                <AdminDetailItem label="Email" value={selectedStaff.email} />
                <AdminDetailItem label="Phone" value={selectedStaff.phone} />
              </AdminDetailGrid>
            </AdminDetailSection>

            <AdminDetailSection title="Employment profile" description="Operational employment details used across scheduling and reporting.">
              <AdminDetailGrid>
                <AdminDetailItem label="Employment status" value={selectedStaff.employmentStatus} emphasis />
                <AdminDetailItem label="Department" value={selectedStaff.department} emphasis />
                <AdminDetailItem label="Designation" value={selectedStaff.designation} />
                <AdminDetailItem label="Shift" value={selectedStaff.shift} />
                <AdminDetailItem label="Employee code" value={selectedStaff.employeeCode || 'Auto-generated'} />
                <AdminDetailItem label="Joining date" value={selectedStaff.joiningDate ? new Date(selectedStaff.joiningDate).toLocaleDateString() : 'Not captured'} />
                <AdminDetailItem label="Salary" value={selectedStaff.salary ? `${selectedStaff.salary}` : 'Not disclosed'} />
              </AdminDetailGrid>
            </AdminDetailSection>

            <AdminDetailSection title="Address and notes" description="Supporting profile context for internal operations.">
              <AdminDetailGrid columns={1}>
                <AdminDetailItem label="Address" value={selectedStaff.address || 'No address added yet'} />
              </AdminDetailGrid>
            </AdminDetailSection>
          </>
        ) : null}
      </AdminDetailDrawer>

      <DepartmentManagerModal open={deptModalOpen} onClose={() => setDeptModalOpen(false)} />
    </div>
  );
};
