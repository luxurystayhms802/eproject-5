import { useState } from 'react';
import { Plus, Trash2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminModal } from '@/features/admin/components/admin-modal';
import { adminInputClassName } from '@/features/admin/config';
import { useAdminDepartments, useCreateDepartment, useDeleteDepartment } from '@/features/admin/hooks';

export const DepartmentManagerModal = ({ open, onClose }) => {
  const [newLabel, setNewLabel] = useState('');
  
  const departmentsQuery = useAdminDepartments();
  const createDepartment = useCreateDepartment();
  const deleteDepartment = useDeleteDepartment();
  const departments = departmentsQuery.data ?? [];

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    try {
      await createDepartment.mutateAsync(newLabel.trim());
      setNewLabel('');
    } catch {
      // Hook shows toast
    }
  };

  const handleDelete = async (name) => {
    if (!window.confirm(`Are you sure you want to delete the "${name}" department?`)) return;
    try {
      await deleteDepartment.mutateAsync(name);
    } catch {
      // Hook shows toast
    }
  };

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Manage Departments"
      description="Add new departments or remove unused ones. Departments with active staff cannot be deleted."
      widthClassName="max-w-lg"
    >
      <form onSubmit={handleCreate} className="flex gap-2 mb-5">
        <input
          className={`${adminInputClassName} flex-1`}
          placeholder="New department name"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
        />
        <Button
          type="submit"
          variant="secondary"
          className="rounded-2xl px-4 shrink-0"
          disabled={createDepartment.isPending || !newLabel.trim()}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add
        </Button>
      </form>

      <div className="space-y-2 pb-8">
        {departmentsQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-[16px] bg-white/70" />
          ))
        ) : departments.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-[var(--border)] bg-white/70 px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
            No departments found. Add one above.
          </div>
        ) : (
          departments.map((dept) => (
            <div
              key={dept.name}
              className="flex items-center justify-between gap-3 rounded-[16px] border border-[var(--border)] bg-white/78 px-4 py-3 transition hover:bg-white hover:shadow-[0_8px_20px_rgba(16,36,63,0.04)]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-[rgba(16,36,63,0.08)] bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                  <Building2 className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold text-[var(--primary)] capitalize truncate">{dept.label}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl px-3 py-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs shrink-0"
                onClick={() => handleDelete(dept.name)}
                disabled={deleteDepartment.isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>
    </AdminModal>
  );
};
