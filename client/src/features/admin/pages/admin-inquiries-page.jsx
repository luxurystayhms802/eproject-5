import { useMemo, useState } from 'react';
import { MailQuestion, Search, CheckCircle2, Inbox } from 'lucide-react';
import { useAuthStore } from '@/app/store/auth-store';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdminToolbar } from '@/features/admin/components/admin-toolbar';
import { adminInputClassName, adminSelectClassName, formatAdminDateTime } from '@/features/admin/config';
import { useAdminInquiries, useResolveInquiry } from '@/features/admin/hooks';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending only' },
  { value: 'resolved', label: 'Resolved only' },
];

export const AdminInquiriesPage = () => {
  const [filters, setFilters] = useState({ search: '', status: '' });

  const user = useAuthStore((state) => state.user);
  const canUpdate = user?.role === 'super_admin' || (user?.permissions || []).includes('inquiries.update');

  const inquiriesQuery = useAdminInquiries({
    status: filters.status || undefined,
    limit: 100,
  });
  
  const resolveInquiry = useResolveInquiry();
  const inquiryItems = inquiriesQuery.data?.items ?? [];

  const filteredInquiries = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();

    if (!searchTerm) {
      return inquiryItems;
    }

    return inquiryItems.filter((item) => {
      const haystack = [
        item.fullName,
        item.email,
        item.phone,
        item.message,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(searchTerm);
    });
  }, [inquiryItems, filters.search]);

  const summary = useMemo(() => {
    const total = filteredInquiries.length;
    const pending = filteredInquiries.filter((item) => item.status === 'pending').length;
    const resolved = filteredInquiries.filter((item) => item.status === 'resolved').length;

    return { total, pending, resolved };
  }, [filteredInquiries]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guest Inquiries"
        description="Review general requests, group booking questions, and private messages submitted directly from the public contact portal."
      >
        <StatusBadge value={summary.pending > 0 ? 'pending' : 'active'} />
        <span className="inline-flex items-center rounded-full border border-[rgba(16,36,63,0.08)] bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
          {summary.pending} awaiting reply
        </span>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatsCard title="Total inquiries" value={String(summary.total)} description="Active and historical guest submissions currently visible." icon={MailQuestion} />
        <StatsCard title="Pending reply" value={String(summary.pending)} description="New submissions that require an operational response." icon={Inbox} />
        <StatsCard title="Resolved" value={String(summary.resolved)} description="Inquiries that have been closed by the reservation desk." icon={CheckCircle2} />
      </div>

      <AdminToolbar
        title="Inquiry queue"
        description="Filter by pending status or perform a text search to find specific guest details."
      >
        <div className="grid w-full gap-3 xl:grid-cols-[minmax(0,1.4fr)_180px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--accent-strong)]" />
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              className={`${adminInputClassName} pl-11`}
              placeholder="Search by name, email, or message content"
            />
          </label>

          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            className={adminSelectClassName}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </AdminToolbar>

      <div className="space-y-4">
        {inquiriesQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, index) => <Card key={index} className="h-40 animate-pulse bg-white/70" />)
        ) : filteredInquiries.length ? (
          filteredInquiries.map((item) => (
            <Card key={item.id} className="space-y-5 p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3 max-w-[800px]">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge value={item.status === 'resolved' ? 'active' : 'pending'} />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                      Submitted {formatAdminDateTime(item.createdAt)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-[20px] font-semibold text-[var(--primary)]">{item.fullName}</h2>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted-foreground)]">
                      <a href={`mailto:${item.email}`} className="hover:text-[var(--accent)]">{item.email}</a>
                      {item.phone && <a href={`tel:${item.phone}`} className="hover:text-[var(--accent)]">{item.phone}</a>}
                    </div>
                    <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]">{item.message}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 border-t border-[var(--border)] pt-5 mt-2">
                  {item.status === 'resolved' && item.resolvedBy ? (
                    <div className="text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[var(--muted-foreground)]">Resolved by</p>
                      <p className="text-sm font-medium text-[var(--foreground)] mt-0.5">
                        {item.resolvedBy.firstName} {item.resolvedBy.lastName}
                      </p>
                    </div>
                  ) : canUpdate ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="rounded-full px-6"
                        onClick={() => resolveInquiry.mutate(item.id)}
                        disabled={resolveInquiry.isPending}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {resolveInquiry.isPending ? 'Resolving...' : 'Mark as resolved'}
                      </Button>
                  ) : null}
              </div>
            </Card>
          ))
        ) : (
          <Card className="space-y-3 p-8 text-center">
            <h2 className="text-xl font-semibold text-[var(--primary)]">No inquiries found</h2>
            <p className="mx-auto max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
              When public guests submit the contact form, their messages will appear here for operational review and action.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
