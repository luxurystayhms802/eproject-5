import { CalendarClock, DoorOpen, Hotel, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getDisplayName } from '@/features/admin/display-utils';
import { formatReceptionDate } from '@/features/reception/config';
import { useConfirmedReservations } from '@/features/reception/hooks';

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export const ArrivalsBoardPage = () => {
  const reservationsQuery = useConfirmedReservations();
  const today = startOfToday();
  const reservations = reservationsQuery.data ?? [];

  const arrivals = reservations
    .filter((reservation) => new Date(reservation.checkInDate) <= today)
    .sort((left, right) => new Date(left.checkInDate).getTime() - new Date(right.checkInDate).getTime());

  const overdueArrivals = arrivals.filter((reservation) => new Date(reservation.checkInDate) < today);
  const todayArrivals = arrivals.filter((reservation) => new Date(reservation.checkInDate).toDateString() === today.toDateString());
  const assignedArrivals = arrivals.filter((reservation) => reservation.room);
  const pendingRoom = arrivals.filter((reservation) => !reservation.room);

  return (
    <div className="space-y-6">
      <PageHeader title="Arrivals Board" description="Confirmed arrivals and room-readiness queue.">
        <div className="flex flex-wrap gap-3">
          <Link to="/reception/check-in">
            <Button variant="secondary">Open check-in desk</Button>
          </Link>
          <Link to="/reception/reservations">
            <Button variant="outline">Reservation desk</Button>
          </Link>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Due today" value={String(todayArrivals.length)} description="Today's arrivals" icon={CalendarClock} />
        <StatsCard title="Overdue" value={String(overdueArrivals.length)} description="Past due arrivals" icon={Users} />
        <StatsCard title="Assigned" value={String(assignedArrivals.length)} description="Room linked" icon={Hotel} />
        <StatsCard title="Pending room" value={String(pendingRoom.length)} description="Assignment needed" icon={DoorOpen} />
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-[var(--primary)]">Arrival queue</h2>
          <StatusBadge value={pendingRoom.length > 0 ? 'pending' : 'active'} />
        </div>

        {reservationsQuery.isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl bg-white/70" />
            ))}
          </div>
        ) : arrivals.length > 0 ? (
          <div className="space-y-3">
            {arrivals.map((reservation) => {
              const isOverdue = new Date(reservation.checkInDate) < today;

              return (
                <div key={reservation.id} className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge value={isOverdue ? 'overdue' : 'confirmed'} />
                        <StatusBadge
                          value={reservation.room ? 'assigned' : 'pending'}
                          className={reservation.room ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}
                        />
                      </div>
                      <h3 className="text-lg font-semibold text-[var(--primary)]">{getDisplayName(reservation.guest, 'Guest')}</h3>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {reservation.roomType?.name ?? 'Room type'} | {formatReceptionDate(reservation.checkInDate)}
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {reservation.room?.roomNumber ? `Room ${reservation.room.roomNumber}` : 'Room not assigned'} | {reservation.adults}A / {reservation.children}C
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link to="/reception/check-in">
                        <Button variant="outline">Process</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
            No confirmed arrivals in the current queue.
          </div>
        )}
      </Card>
    </div>
  );
};
