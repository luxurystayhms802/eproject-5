import { BedDouble, CalendarDays, Receipt, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useGuestDashboard } from '@/features/guest/hooks';
const formatCurrency = (value) => `Rs ${value.toFixed(2)}`;
export const GuestDashboardPage = () => {
    const { isLoading, summary } = useGuestDashboard();
    return (<div className="space-y-6">
      <PageHeader title="Guest Dashboard" description="Track upcoming stays, current reservations, and the hospitality history attached to your account."/>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Upcoming stays" value={String(summary.upcomingCount)} description="Confirmed or pending future reservations" icon={CalendarDays}/>
        <StatsCard title="Current stays" value={String(summary.currentCount)} description="Active in-house reservations" icon={BedDouble}/>
        <StatsCard title="Completed stays" value={String(summary.completedCount)} description="Past visits available for feedback and invoices" icon={Receipt}/>
        <StatsCard title="Total stay value" value={formatCurrency(summary.totalSpend)} description="Cumulative invoiced amount including added stay charges" icon={Wallet}/>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-[var(--primary)]">Recent reservations</h2>
            <Link to="/rooms">
              <Button variant="outline">Book another stay</Button>
            </Link>
          </div>

          {isLoading ? (<div className="grid gap-3">
              {Array.from({ length: 3 }).map((_, index) => (<div key={index} className="h-24 animate-pulse rounded-2xl bg-white/70"/>))}
            </div>) : summary.recentReservations.length > 0 ? (<div className="grid gap-3">
              {summary.recentReservations.map((reservation) => (<div key={reservation.id} className="rounded-2xl border border-[var(--border)] bg-white/75 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">{reservation.reservationCode}</p>
                      <h3 className="mt-2 text-lg font-semibold text-[var(--primary)]">{reservation.roomType?.name ?? 'Room reservation'}</h3>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {new Date(reservation.checkInDate).toLocaleDateString()} to {new Date(reservation.checkOutDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm font-semibold capitalize text-[var(--accent)]">
                      {reservation.status.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--muted-foreground)]">
                    <span>{reservation.adults} adults, {reservation.children} children</span>
                    <div className="text-right">
                      <span className="font-semibold text-[var(--primary)]">{formatCurrency(reservation.invoiceTotalAmount ?? reservation.totalAmount)}</span>
                      {reservation.hasInvoiceCharges ? (<p className="text-xs text-[var(--muted-foreground)]">Includes added stay charges</p>) : null}
                    </div>
                  </div>
                </div>))}
            </div>) : (<div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm leading-6 text-[var(--muted-foreground)]">
              No reservations yet. Browse available room types to create your first LuxuryStay booking.
            </div>)}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--primary)]">Next stay snapshot</h2>
          {summary.nextUpcoming ? (<div className="space-y-4">
              <div className="rounded-2xl bg-[linear-gradient(145deg,#10243f_0%,#18355d_62%,#b88c4a_150%)] p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#f7d7a6]">{summary.nextUpcoming.reservationCode}</p>
                <h3 className="mt-3 text-2xl font-semibold">{summary.nextUpcoming.roomType?.name ?? 'Upcoming stay'}</h3>
                <p className="mt-2 text-sm text-white/80">
                  {new Date(summary.nextUpcoming.checkInDate).toLocaleDateString()} to {new Date(summary.nextUpcoming.checkOutDate).toLocaleDateString()}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5 text-sm leading-6 text-[var(--muted-foreground)]">
                You can review invoice totals, added stay charges, service requests, and post-stay feedback from this guest workspace without relying on the front desk.
              </div>
            </div>) : (<div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm leading-6 text-[var(--muted-foreground)]">
              Once a future booking exists, your next stay summary will appear here automatically.
            </div>)}
        </Card>
      </div>
    </div>);
};
