import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGuestReservations } from '@/features/public/hooks';
import { useCancelGuestReservation, useGuestInvoices } from '@/features/guest/hooks';
const formatCurrency = (value) => `Rs ${value.toFixed(2)}`;
export const GuestReservationsPage = () => {
    const reservationsQuery = useGuestReservations();
    const invoicesQuery = useGuestInvoices();
    const cancelReservation = useCancelGuestReservation();
    const reservations = reservationsQuery.data ?? [];
    const invoices = invoicesQuery.data ?? [];
    const invoiceTotalsByReservation = new Map(invoices.filter((invoice) => invoice?.reservationId).map((invoice) => [invoice.reservationId, invoice]));
    return (<div className="space-y-6">
      <PageHeader title="My Reservations" description="View your complete reservation history, stay windows, and reservation statuses."/>

      <div className="grid gap-4">
        {reservationsQuery.isLoading ? (Array.from({ length: 3 }).map((_, index) => <Card key={index} className="h-40 animate-pulse bg-white/70"/>)) : reservations.length > 0 ? (reservations.map((reservation) => (<Card key={reservation.id} className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">{reservation.reservationCode}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-[var(--primary)]">{reservation.roomType?.name ?? 'Reservation'}</h2>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {new Date(reservation.checkInDate).toLocaleDateString()} to {new Date(reservation.checkOutDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={reservation.status}/>
                  {reservation.status === 'pending' ? (<Button variant="outline" disabled={cancelReservation.isPending} onClick={() => cancelReservation.mutate(reservation.id)}>
                      Cancel
                    </Button>) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--muted-foreground)]">
                <span>
                  {reservation.adults} adults, {reservation.children} children
                </span>
                <span>{reservation.nights} nights</span>
                <div className="text-right">
                  <span className="font-semibold text-[var(--primary)]">{formatCurrency(invoiceTotalsByReservation.get(reservation.id)?.totalAmount ?? reservation.totalAmount)}</span>
                  {invoiceTotalsByReservation.get(reservation.id) && Number(invoiceTotalsByReservation.get(reservation.id).totalAmount) > Number(reservation.totalAmount) ? (<p className="text-xs text-[var(--muted-foreground)]">Includes added charges</p>) : null}
                </div>
              </div>
            </Card>))) : (<Card className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--primary)]">No reservations yet</h2>
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">Browse live availability and create your first guest reservation.</p>
            <Link to="/rooms">
              <Button variant="outline">Explore rooms</Button>
            </Link>
          </Card>)}
      </div>
    </div>);
};
