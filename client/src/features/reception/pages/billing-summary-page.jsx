import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { printInvoiceDocument, printPaymentReceiptDocument } from '@/lib/print-documents';
import { receptionApi } from '@/features/reception/api';
import { useInvoices, usePayments } from '@/features/reception/hooks';
import { formatReceptionCurrency } from '@/features/reception/config';

const formatLabel = (value, fallback = 'n/a') => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  return String(value).replaceAll('_', ' ');
};

const formatDateTime = (value) => {
  if (!value) {
    return 'Date unavailable';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Date unavailable' : parsed.toLocaleString();
};

export const BillingSummaryPage = () => {
  const invoicesQuery = useInvoices();
  const paymentsQuery = usePayments();

  const invoices = invoicesQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];
  const outstandingBalance = invoices.reduce((sum, invoice) => sum + Number(invoice.balanceAmount ?? 0), 0);
  const totalCollected = payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const unpaidInvoices = invoices.filter((invoice) => Number(invoice.balanceAmount ?? 0) > 0).length;

  const handlePrintInvoice = async (invoice) => {
    try {
      const charges = invoice.reservationId ? await receptionApi.listFolioCharges(invoice.reservationId) : [];
      const invoicePayments = payments.filter((payment) => payment.invoiceId === invoice.id);

      printInvoiceDocument({
        brandLabel: 'LuxuryStay Reception',
        invoice,
        charges,
        payments: invoicePayments,
      });
    } catch {
      toast.error('Unable to prepare this invoice for printing right now.');
    }
  };

  const handlePrintReceipt = (payment) => {
    printPaymentReceiptDocument({
      brandLabel: 'LuxuryStay Reception',
      payment,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Billing Summary" description="Review desk invoices, receipts, and open balances." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Invoices" value={String(invoices.length)} description="Visible desk invoices" />
        <StatsCard title="Outstanding" value={formatReceptionCurrency(outstandingBalance)} description="Open balance" />
        <StatsCard title="Payments" value={String(payments.length)} description="Captured receipts" />
        <StatsCard title="Collected" value={formatReceptionCurrency(totalCollected)} description="Recorded payment value" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-[var(--primary)]">Recent invoices</h2>
            <span className="text-sm text-[var(--muted-foreground)]">{unpaidInvoices} unpaid</span>
          </div>

          {invoicesQuery.isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/70" />
              ))}
            </div>
          ) : invoices.length > 0 ? (
            <div className="space-y-3">
              {invoices.slice(0, 10).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{invoice.invoiceNumber ?? 'Invoice draft'}</p>
                    <p className="text-sm capitalize text-[var(--muted-foreground)]">{formatLabel(invoice.status)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--primary)]">{formatReceptionCurrency(invoice.totalAmount)}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">Balance {formatReceptionCurrency(invoice.balanceAmount)}</p>
                    <Button className="mt-2" variant="outline" onClick={() => handlePrintInvoice(invoice)}>
                      Print invoice
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
              No desk invoices are available yet.
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-[var(--primary)]">Recent payments</h2>
            <span className="text-sm text-[var(--muted-foreground)]">{formatReceptionCurrency(totalCollected)} collected</span>
          </div>

          {paymentsQuery.isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/70" />
              ))}
            </div>
          ) : payments.length > 0 ? (
            <div className="space-y-3">
              {payments.slice(0, 10).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3">
                  <div>
                    <p className="font-medium capitalize text-[var(--foreground)]">{formatLabel(payment.method, 'Payment')}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">{formatDateTime(payment.paidAt ?? payment.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--primary)]">{formatReceptionCurrency(payment.amount)}</p>
                    <p className="text-sm capitalize text-[var(--muted-foreground)]">{formatLabel(payment.status)}</p>
                    <Button className="mt-2" variant="outline" onClick={() => handlePrintReceipt(payment)}>
                      Print receipt
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
              No payments are recorded yet.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
