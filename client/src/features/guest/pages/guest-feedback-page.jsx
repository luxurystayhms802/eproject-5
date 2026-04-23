import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { validateGuestFeedbackForm } from '@/features/guest/form-utils';
import { useCreateGuestFeedback, useGuestFeedback } from '@/features/guest/hooks';
import { useGuestReservations } from '@/features/public/hooks';

const inputClassName = 'w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]';

export const GuestFeedbackPage = () => {
  const reservationsQuery = useGuestReservations();
  const feedbackQuery = useGuestFeedback();
  const createFeedback = useCreateGuestFeedback();

  const existingReservationIds = new Set((feedbackQuery.data ?? []).map((item) => item.reservationId));
  const eligibleReservations = useMemo(
    () => (reservationsQuery.data ?? []).filter((reservation) => reservation.status === 'checked_out' && !existingReservationIds.has(reservation.id)),
    [reservationsQuery.data, feedbackQuery.data],
  );

  const [reservationId, setReservationId] = useState('');
  const [categories, setCategories] = useState({
    overall: 5,
    room: 5,
    cleanliness: 5,
    staff: 5,
    food: 5,
  });
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  const submitFeedback = (event) => {
    event.preventDefault();

    const validationMessage = validateGuestFeedbackForm(
      { reservationId, rating: categories.overall, title, comment },
      eligibleReservations.length > 0,
    );
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    const normalizedRating = Math.min(5, Math.max(1, Number(rating) || 1));

    createFeedback.mutate(
      {
        reservationId,
        rating: categories.overall,
        title: title.trim(),
        comment: comment.trim(),
        categories: categories,
      },
      {
        onSuccess: () => {
          setReservationId('');
          setCategories({ overall: 5, room: 5, cleanliness: 5, staff: 5, food: 5 });
          setTitle('');
          setComment('');
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feedback & Ratings"
        description="Share post-stay feedback for checked-out reservations and review your previous submissions."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <Card>
          <form className="space-y-4" onSubmit={submitFeedback}>
            <div>
              <h2 className="text-xl font-semibold text-[var(--primary)]">Submit feedback</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Only completed stays can receive a guest review.</p>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">Reservation</span>
              <select className={inputClassName} name="reservationId" value={reservationId} onChange={(event) => setReservationId(event.target.value)}>
                <option value="">Select checked-out reservation</option>
                {eligibleReservations.map((reservation) => (
                  <option key={reservation.id} value={reservation.id}>
                    {reservation.reservationCode} | {reservation.roomType?.name ?? 'Stay'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[var(--muted-foreground)]">
                {eligibleReservations.length > 0
                  ? 'Only checked-out stays without an existing review can be rated.'
                  : 'No completed stays are waiting for feedback right now.'}
              </p>
            </label>

            <div className="space-y-3">
              <span className="text-sm font-semibold text-[var(--primary)]">Ratings (1-5)</span>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {Object.entries(categories).map(([key, value]) => (
                  <label key={key} className="space-y-1">
                    <span className="text-xs font-semibold capitalize text-[var(--muted-foreground)]">{key}</span>
                    <input
                      className={inputClassName}
                      type="number"
                      min={1}
                      max={5}
                      value={value}
                      onChange={(e) => setCategories(c => ({ ...c, [key]: Math.min(5, Math.max(1, Number(e.target.value) || 1)) }))}
                    />
                  </label>
                ))}
              </div>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">Title</span>
              <input className={inputClassName} name="title" value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">Comment</span>
              <textarea className={`${inputClassName} min-h-28`} name="comment" value={comment} onChange={(event) => setComment(event.target.value)} />
            </label>

            <Button type="submit" disabled={createFeedback.isPending || eligibleReservations.length === 0}>
              {createFeedback.isPending ? 'Submitting...' : 'Submit feedback'}
            </Button>
          </form>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--primary)]">My submissions</h2>

          {feedbackQuery.isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/70" />
              ))}
            </div>
          ) : (feedbackQuery.data ?? []).length > 0 ? (
            <div className="space-y-3">
              {(feedbackQuery.data ?? []).map((item) => (
                <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-white/75 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-[var(--primary)]">{item.title}</h3>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{item.comment}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge value={item.isPublished ? 'active' : 'inactive'} />
                      <span className="text-sm font-semibold text-[var(--accent)]">{item.rating}/5</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
              No feedback submitted yet.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
