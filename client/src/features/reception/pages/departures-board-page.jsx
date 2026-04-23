import { CreditCard, DoorClosed, Receipt, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getDisplayName } from '@/features/admin/display-utils';
import { formatReceptionCurrency, formatReceptionDate } from '@/features/reception/config';
import { useCheckedInReservations, useInvoices } from '@/features/reception/hooks';

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export const DeparturesBoardPage = () => {
  const reservationsQuery = useCheckedInReservations();
  const invoicesQuery = useInvoices();
  const today = startOfToday();
  const reservations = reservationsQuery.data ?? [];
  const invoices = invoicesQuery.data ?? [];

  const departures = reservations
    .filter((reservation) => new Date(reservation.checkOutDate) <= today)
    .sort((left, right) => new Date(left.checkOutDate).getTime() - new Date(right.checkOutDate).getTime());

  const dueToday = departures.filter((reservation) => new Date(reservation.checkOutDate).toDateString() === today.toDateString());
  const overdue = departures.filter((reservation) => new Date(reservation.checkOutDate) < today);
  const withBalance = departures.filter((reservation) => {
    const invoice = invoices.find((item) => item.reservationId === reservation.id);
    return Number(invoice?.balanceAmount ?? 0) > 0 && invoice?.status !== 'void';
  });

  const totalBalance = withBalance.reduce((sum, reservation) => {
    const invoice = invoices.find((item) => item.reservationId === reservation.id);
    return sum + (invoice?.status === 'void' ? 0 : Number(invoice?.balanceAmount ?? 0));
  }, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Departures Board" description="Departure queue and settlement watch.">
        <div className="flex flex-wrap gap-3">
          <Link to="/reception/check-out">
            <Button variant="secondary">Open check-out desk</Button>
          </Link>
          <Link to="/reception/billing">
            <Button variant="outline">Billing desk</Button>
          </Link>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Due today" value={String(dueToday.length)} description="Today's departures" icon={DoorClosed} />
        <StatsCard title="Overdue" value={String(overdue.length)} description="Past due stays" icon={Users} />
        <StatsCard title="With balance" value={String(withBalance.length)} description="Payment pending" icon={Receipt} />
        <StatsCard title="Open balance" value={formatReceptionCurrency(totalBalance)} description="Outstanding" icon={CreditCard} />
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-[var(--primary)]">Departure queue</h2>
          <StatusBadge value={withBalance.length > 0 ? 'pending' : 'active'} />
        </div>

        {reservationsQuery.isLoading || invoicesQuery.isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl bg-white/70" />
            ))}
          </div>
        ) : departures.length > 0 ? (
          <div className="space-y-3">
            {departures.map((reservation) => {
              const invoice = invoices.find((item) => item.reservationId === reservation.id);
              const balance = invoice?.status === 'void' ? 0 : Number(invoice?.balanceAmount ?? 0);
              const isOverdue = new Date(reservation.checkOutDate) < today;

              return (
                <div key={reservation.id} className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge value={isOverdue ? 'overdue' : 'checked_in'} />
                        <StatusBadge
                          value={balance > 0 ? 'pending' : 'paid'}
                          className={balance > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}
                        />
                      </div>
                      <h3 className="text-lg font-semibold text-[var(--primary)]">{getDisplayName(reservation.guest, 'Guest')}</h3>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Room {reservation.room?.roomNumber ?? 'n/a'} | {formatReceptionDate(reservation.checkOutDate)}
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)]">Balance {formatReceptionCurrency(balance)}</p>
                    </div>

                    <Link to="/reception/check-out">
                      <Button variant="outline">Settle</Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
            No checked-in departures in the current queue.
          </div>
        )}
      </Card>
    </div>
  );
};
