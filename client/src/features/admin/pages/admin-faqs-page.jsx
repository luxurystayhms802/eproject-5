import { useMemo, useState } from 'react';
import { Plus, Search, MessageCircleQuestion, MessagesSquare, CheckCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/store/auth-store';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdminModal } from '@/features/admin/components/admin-modal';
import { AdminToolbar } from '@/features/admin/components/admin-toolbar';
import {
  adminInputClassName,
  adminLabelClassName,
  adminLabelTextClassName,
  adminTextAreaClassName,
} from '@/features/admin/config';
import { useAdminFaqs, useAdminCreateFaq, useAdminUpdateFaq, useAdminDeleteFaq } from '@/features/admin/hooks';

const createInitialForm = () => ({
  question: '',
  answer: '',
  isActive: true,
  order: 0,
});

const mapFaqToForm = (faq) => ({
  question: faq.question ?? '',
  answer: faq.answer ?? '',
  isActive: Boolean(faq.isActive),
  order: Number(faq.order) ?? 0,
});

export const AdminFaqsPage = () => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [selectedFaq, setSelectedFaq] = useState(null);
  const [form, setForm] = useState(createInitialForm());

  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];
  const isSuperAdmin = user?.role === 'super_admin';
  const canCreate = isSuperAdmin || permissions.includes('faqs.create');
  const canUpdate = isSuperAdmin || permissions.includes('faqs.update');
  const canDelete = isSuperAdmin || permissions.includes('faqs.delete');

  const faqsQuery = useAdminFaqs();
  const createFaq = useAdminCreateFaq();
  const updateFaq = useAdminUpdateFaq();
  const deleteFaq = useAdminDeleteFaq();
  const faqs = faqsQuery.data ?? [];

  const filteredFaqs = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    if (!searchTerm) {
      return faqs;
    }
    return faqs.filter((faq) => {
      const haystack = [faq.question, faq.answer].join(' ').toLowerCase();
      return haystack.includes(searchTerm);
    });
  }, [faqs, search]);

  const summary = useMemo(
    () => ({
      total: faqs.length,
      active: faqs.filter((f) => f.isActive).length,
      inactive: faqs.filter((f) => !f.isActive).length,
    }),
    [faqs],
  );

  const openCreateModal = () => {
    setEditingFaq(null);
    setForm(createInitialForm());
    setModalOpen(true);
  };

  const openEditModal = (faq) => {
    setEditingFaq(faq);
    setForm(mapFaqToForm(faq));
    setModalOpen(true);
  };

  const handleDelete = async (faq) => {
    if (!window.confirm('Delete this FAQ permanently?')) {
      return;
    }
    deleteFaq.mutate(faq.id, {
      onSuccess: () => {
        if (selectedFaq?.id === faq.id) {
          setSelectedFaq(null);
        }
      },
    });
  };

  const validateForm = () => {
    if (form.question.trim().length < 3) {
      toast.error('Question must be at least 3 characters.');
      return false;
    }
    if (form.answer.trim().length < 5) {
      toast.error('Answer must be at least 5 characters.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const payload = { ...form };

    if (editingFaq) {
      updateFaq.mutate(
        { faqId: editingFaq.id, payload },
        {
          onSuccess: () => setModalOpen(false),
        },
      );
    } else {
      createFaq.mutate(payload, {
        onSuccess: () => setModalOpen(false),
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="FAQ Management"
        description="Add, update, and sort frequently asked questions for the guest website."
        action={
          canCreate ? (
            <Button onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Add FAQ
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total FAQs"
          value={summary.total.toString()}
          icon={MessagesSquare}
          description="Total items in the database"
          variant="primary"
        />
        <StatsCard
          title="Live Settings"
          value={summary.active.toString()}
          icon={CheckCircle}
          description="Visible to guests"
          variant="success"
        />
        <StatsCard
          title="Draft / Inactive"
          value={summary.inactive.toString()}
          icon={MessageCircleQuestion}
          description="Hidden from website"
          variant="warning"
        />
      </div>

      <Card className="overflow-hidden bg-white shadow-sm ring-1 ring-[var(--border)]">
        <AdminToolbar search={search} onSearchChange={setSearch} />

        <div className="grid grid-cols-1 lg:grid-cols-12 lg:divide-x lg:divide-[var(--border)]">
          <div className="lg:col-span-12">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-[var(--muted-foreground)]">
                    <th className="whitespace-nowrap px-6 py-4 font-medium">Order</th>
                    <th className="px-6 py-4 font-medium">Question</th>
                    <th className="whitespace-nowrap px-6 py-4 font-medium text-center">Status</th>
                    <th className="whitespace-nowrap px-6 py-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredFaqs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-[var(--muted-foreground)]">
                        {search ? "No FAQs matched your search." : "No FAQs configured yet."}
                      </td>
                    </tr>
                  ) : null}
                  {filteredFaqs.map((faq) => (
                    <tr
                      key={faq.id}
                      className="transition-colors hover:bg-[var(--muted)]/20"
                    >
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-[var(--primary)]">
                        {faq.order}
                      </td>
                      <td className="px-6 py-4 font-medium text-[var(--primary)]">
                        {faq.question}
                        <div className="text-xs text-[var(--muted-foreground)] font-normal line-clamp-1 mt-1">
                          {faq.answer}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <StatusBadge
                          status={faq.isActive ? 'active' : 'inactive'}
                          config={{
                            active: { label: 'Live', variant: 'success' },
                            inactive: { label: 'Hidden', variant: 'warning' },
                          }}
                        />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {canUpdate ? (
                            <button
                              onClick={() => openEditModal(faq)}
                              className="text-sm font-medium text-[var(--accent)] hover:underline"
                            >
                              Edit
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button
                              onClick={() => handleDelete(faq)}
                              className="text-[var(--danger)] hover:text-[var(--danger)]/80"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingFaq ? 'Edit FAQ' : 'Create FAQ'}
      >
        <div className="space-y-6">
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Question</span>
            <input
              type="text"
              value={form.question}
              onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
              placeholder="e.g. What is the check-in time?"
              className={adminInputClassName}
              disabled={createFaq.isPending || updateFaq.isPending}
            />
          </label>

          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Answer</span>
            <textarea
              value={form.answer}
              onChange={(e) => setForm((prev) => ({ ...prev, answer: e.target.value }))}
              placeholder="Detailed answer here..."
              className={adminTextAreaClassName}
              disabled={createFaq.isPending || updateFaq.isPending}
            />
          </label>

          <div className="flex items-center justify-between gap-4">
            <label className={adminLabelClassName + ' flex-1'}>
              <span className={adminLabelTextClassName}>Sort Order</span>
              <input
                type="number"
                min="0"
                value={form.order}
                onChange={(e) => setForm((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                className={adminInputClassName}
                disabled={createFaq.isPending || updateFaq.isPending}
              />
            </label>

            <label className="flex h-full items-center gap-3 pt-6 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="h-5 w-5 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                disabled={createFaq.isPending || updateFaq.isPending}
              />
              <span className="text-sm font-medium text-[var(--foreground)]">Displayed Publicly (Live)</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={createFaq.isPending || updateFaq.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createFaq.isPending || updateFaq.isPending}
              isLoading={createFaq.isPending || updateFaq.isPending}
            >
              {editingFaq ? 'Save Changes' : 'Create FAQ'}
            </Button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
};
