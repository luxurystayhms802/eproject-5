import { useMemo, useState } from 'react';
import { MessageSquareQuote, Search, Sparkles, Star, ThumbsUp } from 'lucide-react';
import { useAuthStore } from '@/app/store/auth-store';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdminToolbar } from '@/features/admin/components/admin-toolbar';
import { adminInputClassName, adminSelectClassName, titleCase } from '@/features/admin/config';
import { getDisplayName } from '@/features/admin/display-utils';
import { useAdminFeedback, useAdminPublishFeedback } from '@/features/admin/hooks';

const RATING_OPTIONS = ['1', '2', '3', '4', '5'];
const VISIBILITY_OPTIONS = [
  { value: '', label: 'All visibility' },
  { value: 'published', label: 'Published only' },
  { value: 'hidden', label: 'Hidden only' },
];

export const AdminFeedbackPage = () => {
  const [filters, setFilters] = useState({ search: '', rating: '', visibility: '' });

  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];
  const isAdmin = user?.role === 'admin';
  const canPublish = isAdmin || permissions.includes('feedback.publish');

  const feedbackQuery = useAdminFeedback({
    rating: filters.rating ? Number(filters.rating) : undefined,
    isPublished:
      filters.visibility === 'published'
        ? true
        : filters.visibility === 'hidden'
          ? false
          : undefined,
    limit: 100,
  });
  const publishFeedback = useAdminPublishFeedback();

  const feedbackItems = feedbackQuery.data ?? [];

  const filteredFeedback = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();

    if (!searchTerm) {
      return feedbackItems;
    }

      return feedbackItems.filter((item) => {
        const haystack = [
          item.title,
          item.comment,
          getDisplayName(item.guest),
          item.guest?.email,
          item.reservation?.reservationCode,
        ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(searchTerm);
    });
  }, [feedbackItems, filters.search]);

  const summary = useMemo(() => {
    const total = filteredFeedback.length;
    const published = filteredFeedback.filter((item) => item.isPublished).length;
    const lowRated = filteredFeedback.filter((item) => Number(item.rating) <= 2).length;
    const averageRating = total ? (filteredFeedback.reduce((sum, item) => sum + Number(item.rating ?? 0), 0) / total).toFixed(1) : '0.0';

    return {
      total,
      published,
      lowRated,
      averageRating,
    };
  }, [filteredFeedback]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feedback Overview"
        description="Review post-stay guest sentiment, highlight service quality signals, and control which reviews are published across the admin surface."
      >
        <StatusBadge value={summary.lowRated ? 'pending' : 'active'} />
        <span className="inline-flex items-center rounded-full border border-[rgba(16,36,63,0.08)] bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
          Average rating {summary.averageRating}/5
        </span>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Feedback items" value={String(summary.total)} description="Guest reviews visible after active filters and search are applied." icon={MessageSquareQuote} />
        <StatsCard title="Published" value={String(summary.published)} description="Reviews already approved for published visibility or showcase use." icon={ThumbsUp} />
        <StatsCard title="Low rated" value={String(summary.lowRated)} description="Reviews that may need service recovery or managerial attention." icon={Sparkles} />
        <StatsCard title="Average rating" value={`${summary.averageRating}/5`} description="Average guest score calculated from the visible admin review set." icon={Star} />
      </div>

      <AdminToolbar
        title="Review moderation"
        description="Search guest reviews, filter by rating or visibility, and publish only the feedback that matches your brand standards."
      >
        <div className="grid w-full gap-3 xl:grid-cols-[minmax(0,1.4fr)_180px_220px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--accent-strong)]" />
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              className={`${adminInputClassName} pl-11`}
              placeholder="Search guest, reservation, title, or review text"
            />
          </label>

          <select
            value={filters.rating}
            onChange={(event) => setFilters((current) => ({ ...current, rating: event.target.value }))}
            className={adminSelectClassName}
          >
            <option value="">All ratings</option>
            {RATING_OPTIONS.map((rating) => (
              <option key={rating} value={rating}>
                {rating} star{rating === '1' ? '' : 's'}
              </option>
            ))}
          </select>

          <select
            value={filters.visibility}
            onChange={(event) => setFilters((current) => ({ ...current, visibility: event.target.value }))}
            className={adminSelectClassName}
          >
            {VISIBILITY_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </AdminToolbar>

      <div className="space-y-4">
        {feedbackQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, index) => <Card key={index} className="h-56 animate-pulse bg-white/70" />)
        ) : filteredFeedback.length ? (
          filteredFeedback.map((item) => (
            <Card key={item.id} className="space-y-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge value={item.isPublished ? 'active' : 'inactive'} />
                    <span className="inline-flex rounded-full border border-[rgba(16,36,63,0.08)] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                      {item.rating}/5 rating
                    </span>
                  </div>
                  <div>
                    <h2 className="text-[28px] text-[var(--primary)] [font-family:var(--font-display)]">{item.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">{item.comment}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                      {getDisplayName(item.guest, item.guest?.email ?? 'Guest reviewer')} | Reservation {item.reservation?.reservationCode ?? 'n/a'}
                    </p>
                  </div>
                </div>

                <div className="rounded-[20px] border border-[var(--border)] bg-white/82 px-4 py-4 xl:min-w-[270px]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[var(--muted-foreground)]">Category ratings</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-[var(--foreground)]">
                    {Object.entries(item.categories ?? {}).map(([key, value]) => (
                      <div key={key} className="rounded-[16px] border border-[var(--border)] bg-white px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">{titleCase(key)}</p>
                        <p className="mt-1 font-semibold text-[var(--primary)]">{value}/5</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                {canPublish && (
                  <Button
                    type="button"
                    variant={item.isPublished ? 'outline' : 'secondary'}
                    className="rounded-2xl px-5"
                    onClick={() => publishFeedback.mutate({ feedbackId: item.id, payload: { isPublished: !item.isPublished } })}
                    disabled={publishFeedback.isPending}
                  >
                    {item.isPublished ? 'Hide review' : 'Publish review'}
                  </Button>
                )}
              </div>
            </Card>
          ))
        ) : (
          <Card className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--primary)]">No feedback found</h2>
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">
              Checked-out guest reviews will appear here for moderation and brand-level visibility control.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
