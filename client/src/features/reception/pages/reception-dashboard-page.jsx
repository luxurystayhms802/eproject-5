import { useMemo } from 'react';
import { ClipboardCheck, CreditCard, DoorClosed, Hotel, Receipt, Users, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  useArrivalsToday,
  useCheckedInReservations,
  useConfirmedReservations,
  useDeparturesToday,
  useInvoices,
  usePayments,
} from '@/features/reception/hooks';
import { useAuthStore } from '@/app/store/auth-store';
import { getDisplayName } from '@/features/admin/display-utils';
import { formatReceptionCurrency, formatReceptionDate } from '@/features/reception/config';

const LoadingRows = ({ count = 4 }) => (
  <div className="grid gap-3">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/70" />
    ))}
  </div>
);

export const ReceptionDashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];
  const canReadReservations = permissions.includes('reservations.read');
  const canReadInvoices = permissions.includes('invoices.read');
  const canReadPayments = permissions.includes('payments.read');
  const canReadCheckIn = permissions.includes('checkIn.update');
  const canReadCheckOut = permissions.includes('checkOut.update');
  const canReadFolio = permissions.includes('folioCharges.read');
  const canReadServices = permissions.includes('serviceRequests.read');
  const canCreateReservations = permissions.includes('reservations.create');

  const arrivalsQuery = useArrivalsToday({ enabled: canReadReservations });
  const departuresQuery = useDeparturesToday({ enabled: canReadReservations });
  const confirmedQuery = useConfirmedReservations({ enabled: canReadReservations });
  const checkedInQuery = useCheckedInReservations({ enabled: canReadReservations });
  const invoicesQuery = useInvoices({ enabled: canReadInvoices });
  const paymentsQuery = usePayments({ enabled: canReadPayments });

  const arrivals = arrivalsQuery.data ?? [];
  const departures = departuresQuery.data ?? [];
  const confirmedReservations = confirmedQuery.data ?? [];
  const checkedInReservations = checkedInQuery.data ?? [];
  const invoices = invoicesQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];

  const outstandingBalance = invoices.reduce((sum, invoice) => sum + Number(invoice.balanceAmount ?? 0), 0);
  const collectedValue = payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const pendingRoomCount = confirmedReservations.filter((reservation) => !reservation.roomId).length;
  const unsettledDepartures = departures.filter((reservation) => {
    const linkedInvoice = invoices.find((invoice) => invoice.reservationId === reservation.id);
    return Number(linkedInvoice?.balanceAmount ?? 0) > 0;
  }).length;

  const quickLinks = useMemo(() => {
    return [
      canReadReservations && { label: 'Arrivals', href: '/reception/arrivals' },
      canReadReservations && { label: 'Departures', href: '/reception/departures' },
      canReadReservations && { label: 'Reservations', href: '/reception/reservations' },
      canCreateReservations && { label: 'Walk-ins', href: '/reception/walk-ins' },
      canReadCheckIn && { label: 'Check-in', href: '/reception/check-in' },
      canReadCheckOut && { label: 'Check-out', href: '/reception/check-out' },
      canReadFolio && { label: 'Billing', href: '/reception/billing' },
      canReadServices && { label: 'Services', href: '/reception/services' },
    ].filter(Boolean);
  }, [
    canCreateReservations,
    canReadCheckIn,
    canReadCheckOut,
    canReadFolio,
    canReadReservations,
    canReadServices,
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Reception Dashboard" description="Live front-desk overview.">
        <div className="flex flex-wrap gap-3">
          {quickLinks.slice(0, 4).map((link) => (
            <Link key={link.href} to={link.href}>
              <Button variant="outline">{link.label}</Button>
            </Link>
          ))}
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard title="Arrivals" value={String(arrivals.length)} description="Due today" icon={Users} />
        <StatsCard title="Departures" value={String(departures.length)} description="Expected today" icon={DoorClosed} />
        <StatsCard title="Pending room" value={String(pendingRoomCount)} description="Awaiting allocation" icon={Hotel} />
        <StatsCard title="In-house" value={String(checkedInReservations.length)} description="Checked in now" icon={ClipboardCheck} />
        <StatsCard title="Outstanding" value={formatReceptionCurrency(outstandingBalance)} description="Unpaid balance" icon={Receipt} />
        <StatsCard title="Collected" value={formatReceptionCurrency(collectedValue)} description="Tracked receipts" icon={CreditCard} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-[var(--primary)]">Arrival queue</h2>
            <Link to="/reception/check-in">
              <Button variant="outline">Open desk</Button>
            </Link>
          </div>

          {arrivalsQuery.isLoading ? (
            <LoadingRows />
          ) : arrivals.length > 0 ? (
            <div className="space-y-3">
              {arrivals.slice(0, 5).map((reservation) => (
                <div key={reservation.id} className="grid gap-4 rounded-[22px] border border-[var(--border)] bg-white/80 p-4 xl:grid-cols-[minmax(0,1fr)_auto]">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--primary)]">
                      {getDisplayName(reservation.guest, 'Arrival guest')}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {reservation.roomType?.name ?? 'Room type'} | {formatReceptionDate(reservation.checkInDate)}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {reservation.room?.roomNumber ? `Room ${reservation.room.roomNumber}` : 'Room pending'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge value={reservation.status} />
                    <StatusBadge
                      value={reservation.room ? 'assigned' : 'pending'}
                      className={reservation.room ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
              No arrivals are queued right now.
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-[var(--primary)]">Departure queue</h2>
            <Link to="/reception/check-out">
              <Button variant="outline">Open settlement</Button>
            </Link>
          </div>

          {departuresQuery.isLoading ? (
            <LoadingRows />
          ) : departures.length > 0 ? (
            <div className="space-y-3">
              {departures.slice(0, 5).map((reservation) => {
                const linkedInvoice = invoices.find((invoice) => invoice.reservationId === reservation.id);
                return (
                  <div key={reservation.id} className="grid gap-4 rounded-[22px] border border-[var(--border)] bg-white/80 p-4 xl:grid-cols-[minmax(0,1fr)_auto]">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--primary)]">
                        {getDisplayName(reservation.guest, 'Departure guest')}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        Room {reservation.room?.roomNumber ?? 'Pending'} | {formatReceptionDate(reservation.checkOutDate)}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        Balance {formatReceptionCurrency(linkedInvoice?.balanceAmount ?? 0)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge value={reservation.status} />
                      <StatusBadge
                        value={Number(linkedInvoice?.balanceAmount ?? 0) > 0 ? 'pending' : 'paid'}
                        className={Number(linkedInvoice?.balanceAmount ?? 0) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
              No departures are queued right now.
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-[var(--primary)]">Desk actions</h2>
            <Wallet className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {quickLinks.map((link) => (
              <Link key={link.href} to={link.href}>
                <Button variant="outline" className="w-full justify-start">
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-[var(--primary)]">Desk totals</h2>
            <StatusBadge value={unsettledDepartures > 0 ? 'pending' : 'active'} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[22px] border border-[var(--border)] bg-white/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Confirmed queue</p>
              <p className="mt-3 text-3xl text-[var(--primary)] [font-family:var(--font-display)]">{confirmedReservations.length}</p>
            </div>
            <div className="rounded-[22px] border border-[var(--border)] bg-white/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Settlement pending</p>
              <p className="mt-3 text-3xl text-[var(--primary)] [font-family:var(--font-display)]">{unsettledDepartures}</p>
            </div>
            <div className="rounded-[22px] border border-[var(--border)] bg-white/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Invoices</p>
              <p className="mt-3 text-3xl text-[var(--primary)] [font-family:var(--font-display)]">{invoices.length}</p>
            </div>
            <div className="rounded-[22px] border border-[var(--border)] bg-white/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Payments</p>
              <p className="mt-3 text-3xl text-[var(--primary)] [font-family:var(--font-display)]">{payments.length}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
