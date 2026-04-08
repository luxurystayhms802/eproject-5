import { BedDouble, BellRing, Receipt, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { guestApi } from '@/features/guest/api';
import {
  useGuestInvoices,
  useGuestPayments,
  useGuestServiceRequests,
} from '@/features/guest/hooks';
import { useGuestReservations } from '@/features/public/hooks';
import { printInvoiceDocument, printPaymentReceiptDocument } from '@/lib/print-documents';

const formatCurrency = (value) => `Rs ${Number(value ?? 0).toFixed(2)}`;

export const GuestStayCenterPage = () => {
  const reservationsQuery = useGuestReservations();
  const invoicesQuery = useGuestInvoices();
  const paymentsQuery = useGuestPayments();
  const requestsQuery = useGuestServiceRequests();

  const reservations = reservationsQuery.data ?? [];
  const invoices = invoicesQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];
  const requests = requestsQuery.data ?? [];

  const currentStay = reservations.find((reservation) => reservation.status === 'checked_in') ?? null;
  const nextStay =
    reservations
      .filter((reservation) => ['pending', 'confirmed'].includes(reservation.status))
      .sort((left, right) => new Date(left.checkInDate).getTime() - new Date(right.checkInDate).getTime())[0] ?? null;
  const focusStay = currentStay ?? nextStay ?? null;
  const linkedInvoice = focusStay ? invoices.find((invoice) => invoice.reservationId === focusStay.id) ?? null : null;
  const linkedPayments = linkedInvoice ? payments.filter((payment) => payment.invoiceId === linkedInvoice.id) : [];
  const openRequests = requests.filter((request) => ['pending', 'in_progress'].includes(request.status));

  const handlePrintInvoice = async () => {
    if (!linkedInvoice) {
      return;
    }

    const charges = linkedInvoice.reservationId ? await guestApi.listFolioCharges(linkedInvoice.reservationId) : [];
    printInvoiceDocument({
      brandLabel: 'LuxuryStay Guest',
      invoice: linkedInvoice,
      charges,
      payments: linkedPayments,
    });
  };

  const handlePrintLatestReceipt = () => {
    if (!linkedPayments[0]) {
      return;
    }

    printPaymentReceiptDocument({
      brandLabel: 'LuxuryStay Guest',
      payment: linkedPayments[0],
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Stay Center" description="Current stay, next arrival, billing, and request tracking in one place.">
        <div className="flex flex-wrap gap-3">
          <Link to="/guest/reservations">
            <Button variant="secondary">Reservations</Button>
          </Link>
          <Link to="/guest/invoices">
            <Button variant="outline">Invoices</Button>
          </Link>
          <Link to="/guest/service-requests">
            <Button variant="outline">Services</Button>
          </Link>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Current stay" value={currentStay ? 'Live' : 'None'} description="Checked-in reservation" icon={BedDouble} />
        <StatsCard title="Open requests" value={String(openRequests.length)} description="Pending or active services" icon={BellRing} />
        <StatsCard title="Outstanding" value={formatCurrency(linkedInvoice?.balanceAmount ?? 0)} description="Focused stay balance" icon={Wallet} />
        <StatsCard title="Payments" value={String(linkedPayments.length)} description="Recorded on focused stay" icon={Receipt} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-[var(--primary)]">Stay snapshot</h2>
            {focusStay ? <StatusBadge value={focusStay.status} /> : null}
          </div>

          {focusStay ? (
            <div className="space-y-4">
              <div className="rounded-[22px] border border-[var(--border)] bg-white/80 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
                  {currentStay ? 'Current stay' : 'Next stay'}
                </p>
                <h3 className="mt-3 text-2xl text-[var(--primary)] [font-family:var(--font-display)]">
                  {focusStay.roomType?.name ?? 'Stay'}
                </h3>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {new Date(focusStay.checkInDate).toLocaleDateString()} to {new Date(focusStay.checkOutDate).toLocaleDateString()}
                </p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {focusStay.room?.roomNumber ? `Room ${focusStay.room.roomNumber}` : 'Room assignment pending'}
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[22px] border border-[var(--border)] bg-white/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Guests</p>
                  <p className="mt-3 text-2xl text-[var(--primary)] [font-family:var(--font-display)]">
                    {focusStay.adults}A / {focusStay.children}C
                  </p>
                </div>
                <div className="rounded-[22px] border border-[var(--border)] bg-white/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Reservation code</p>
                  <p className="mt-3 text-lg font-semibold text-[var(--primary)]">{focusStay.reservationCode}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
              Your next or current stay will appear here automatically.
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-[var(--primary)]">Billing snapshot</h2>
            {linkedInvoice ? <StatusBadge value={linkedInvoice.status} /> : null}
          </div>

          {linkedInvoice ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[22px] border border-[var(--border)] bg-white/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Invoice total</p>
                  <p className="mt-3 text-2xl text-[var(--primary)] [font-family:var(--font-display)]">{formatCurrency(linkedInvoice.totalAmount)}</p>
                </div>
                <div className="rounded-[22px] border border-[var(--border)] bg-white/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Balance due</p>
                  <p className="mt-3 text-2xl text-[var(--primary)] [font-family:var(--font-display)]">{formatCurrency(linkedInvoice.balanceAmount)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={handlePrintInvoice}>
                  Print invoice
                </Button>
                <Button variant="outline" onClick={handlePrintLatestReceipt} disabled={!linkedPayments[0]}>
                  Print receipt
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
              Billing details will appear here once an invoice is generated for your stay.
            </div>
          )}
        </Card>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-[var(--primary)]">Open service requests</h2>
          <Link to="/guest/service-requests">
            <Button variant="outline">Manage services</Button>
          </Link>
        </div>

        {openRequests.length > 0 ? (
          <div className="grid gap-3">
            {openRequests.map((request) => (
              <div key={request.id} className="rounded-[22px] border border-[var(--border)] bg-white/80 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold capitalize text-[var(--primary)]">
                      {request.requestType.replaceAll('_', ' ')}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{request.description}</p>
                  </div>
                  <StatusBadge value={request.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
            No open service requests are attached to your account.
          </div>
        )}
      </Card>
    </div>
  );
};
