import { useMemo, useState } from 'react';
import { Banknote, CreditCard, Search, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/store/auth-store';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdminModal } from '@/features/admin/components/admin-modal';
import { AdminToolbar } from '@/features/admin/components/admin-toolbar';
import {
  INVOICE_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  adminInputClassName,
  adminLabelClassName,
  adminLabelTextClassName,
  adminSelectClassName,
  adminTextAreaClassName,
  formatAdminCurrency,
  formatAdminDateTime,
  titleCase,
} from '@/features/admin/config';
import { getDisplayName } from '@/features/admin/display-utils';
import { validatePaymentForm } from '@/features/admin/form-utils';
import { useAdminInvoices, useAdminPayments, useCreatePayment } from '@/features/admin/hooks';
import { printPaymentReceiptDocument } from '@/lib/print-documents';

const createPaymentForm = (invoice) => ({
  invoiceId: invoice?.id ?? '',
  amount: invoice ? String(Number(invoice.balanceAmount ?? 0).toFixed(2)) : '',
  method: 'card',
  status: 'success',
  referenceNumber: '',
  paidAt: new Date().toISOString().slice(0, 16),
  notes: '',
});

const getInvoiceLabel = (invoice) => invoice?.invoiceNumber ?? 'Invoice';
const getGuestName = (entry) => getDisplayName(entry?.guest, 'Guest record');

export const AdminPaymentsPage = () => {
  const [filters, setFilters] = useState({ search: '', method: '', status: '' });
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState(createPaymentForm(null));

  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];
  const isAdmin = user?.role === 'admin';
  const canCreate = isAdmin || permissions.includes('payments.create');

  const invoicesQuery = useAdminInvoices({ limit: 100 });
  const paymentsQuery = useAdminPayments({
    method: filters.method || undefined,
    status: filters.status || undefined,
    limit: 100,
  });

  const createPayment = useCreatePayment();

  const invoices = invoicesQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];

  const filteredPayments = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();

    return payments.filter((payment) => {
      if (!searchTerm) {
        return true;
      }

      const haystack = [
        payment.invoice?.invoiceNumber,
        getDisplayName(payment.guest),
        payment.guest?.email,
        payment.referenceNumber,
        payment.reservation?.reservationCode,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(searchTerm);
    });
  }, [filters.search, payments]);

  const outstandingInvoices = useMemo(
    () =>
      invoices
        .filter((invoice) => Number(invoice.balanceAmount) > 0 && invoice.status !== 'void' && INVOICE_STATUS_OPTIONS.includes(invoice.status))
        .sort((left, right) => Number(right.balanceAmount) - Number(left.balanceAmount)),
    [invoices],
  );

  const summary = useMemo(() => {
    const successfulPayments = filteredPayments.filter((payment) => payment.status === 'success');
    const pendingPayments = filteredPayments.filter((payment) => payment.status === 'pending');
    const collectedAmount = successfulPayments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

    return {
      totalPayments: filteredPayments.length,
      collectedAmount,
      pendingCount: pendingPayments.length,
      outstandingCount: outstandingInvoices.length,
    };
  }, [filteredPayments, outstandingInvoices.length]);

  const openPaymentModal = (invoice = null) => {
    setPaymentForm(createPaymentForm(invoice));
    setPaymentModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = validatePaymentForm(paymentForm, selectedInvoice);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    try {
      await createPayment.mutateAsync({
        invoiceId: paymentForm.invoiceId,
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        status: paymentForm.status,
        referenceNumber: paymentForm.referenceNumber.trim() || null,
        paidAt: paymentForm.paidAt || undefined,
        notes: paymentForm.notes.trim() || null,
      });

      setPaymentModalOpen(false);
    } catch {
      // Mutation hook already shows a toast.
    }
  };

  const handlePrintReceipt = (payment) => {
    printPaymentReceiptDocument({
      brandLabel: 'LuxuryStay Admin',
      payment,
    });
  };

  const selectedInvoice = invoices.find((invoice) => invoice.id === paymentForm.invoiceId) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Track cash, card, transfer, and online settlements with a finance-friendly collection board."
        action={
          canCreate ? (
            <Button variant="secondary" className="rounded-2xl px-4" onClick={() => openPaymentModal()}>
              Record payment
            </Button>
          ) : null
        }
      >
        <span className="inline-flex items-center rounded-full border border-[rgba(16,36,63,0.08)] bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
          Active ledger {filteredPayments.length}
        </span>
      </PageHeader>

      <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-4">
        <StatsCard
          title="Payments"
          value={summary.totalPayments}
          description="Payment entries visible after method and status filtering."
          icon={CreditCard}
        />
        <StatsCard
          title="Collected"
          value={formatAdminCurrency(summary.collectedAmount)}
          description="Successful payment value already captured and reconciled against invoices."
          icon={Banknote}
        />
        <StatsCard
          title="Pending"
          value={summary.pendingCount}
          description="Submitted collections waiting for settlement or finance confirmation."
          icon={Wallet}
        />
        <StatsCard
          title="Due Invoices"
          value={summary.outstandingCount}
          description="Invoices still carrying a remaining balance that can be settled from this desk."
          icon={CreditCard}
        />
      </div>

      <AdminToolbar
        title="Collections desk"
        description="Search payment records, filter by method or status, and capture outstanding balances from one managed surface."
        actions={
          canCreate ? (
            <Button variant="secondary" className="rounded-2xl px-4" onClick={() => openPaymentModal()}>
              Record payment
            </Button>
          ) : null
        }
      >
        <div className="grid w-full gap-3 xl:grid-cols-[minmax(0,1.4fr)_210px_210px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--accent-strong)]" />
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              className={`${adminInputClassName} pl-11`}
              placeholder="Search invoice, reservation, guest, or reference"
            />
          </label>

          <select
            value={filters.method}
            onChange={(event) => setFilters((current) => ({ ...current, method: event.target.value }))}
            className={adminSelectClassName}
          >
            <option value="">All methods</option>
            {PAYMENT_METHOD_OPTIONS.map((method) => (
              <option key={method} value={method}>
                {titleCase(method)}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            className={adminSelectClassName}
          >
            <option value="">All statuses</option>
            {PAYMENT_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {titleCase(status)}
              </option>
            ))}
          </select>
        </div>
      </AdminToolbar>

      <div className="grid gap-6 2xl:grid-cols-[1.2fr_0.85fr]">
        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-[rgba(16,36,63,0.08)] px-5 py-4">
            <div>
              <h2 className="text-[24px] text-[var(--primary)] [font-family:var(--font-display)]">Payment register</h2>
              <p className="text-sm text-[var(--muted-foreground)]">All captured, pending, refunded, and failed payment activity in one admin register.</p>
            </div>
            <StatusBadge value={filters.status || 'active'} />
          </div>

          <div className="scrollbar-invisible smooth-scroll max-h-[760px] space-y-3 overflow-y-auto px-4 py-4">
            {paymentsQuery.isLoading ? (
              <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-white/70 px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                Loading payment register...
              </div>
            ) : filteredPayments.length ? (
              filteredPayments.map((payment) => (
                <div key={payment.id} className="rounded-[20px] border border-[var(--border)] bg-white/78 px-4 py-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge value={payment.status} />
                        <span className="inline-flex rounded-full border border-[rgba(16,36,63,0.08)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                          {titleCase(payment.method)}
                        </span>
                      </div>
                      <p className="text-base font-semibold text-[var(--primary)]">
                        {payment.invoice?.invoiceNumber ?? 'Invoice missing'} | {getGuestName(payment)}
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Reservation {payment.reservation?.reservationCode ?? 'n/a'} | {formatAdminDateTime(payment.paidAt)}
                      </p>
                      <p className="text-sm text-[var(--foreground)]">{payment.referenceNumber || 'No payment reference supplied'}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-[26px] text-[var(--primary)] [font-family:var(--font-display)]">{formatAdminCurrency(payment.amount)}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Received by {getDisplayName(payment.receivedBy, 'Admin desk')}
                      </p>
                      <Button variant="outline" className="mt-3 rounded-2xl px-4" onClick={() => handlePrintReceipt(payment)}>
                        Print receipt
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-white/70 px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                No payments match the current filters.
              </div>
            )}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[24px] text-[var(--primary)] [font-family:var(--font-display)]">Outstanding invoices</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Start a payment directly from any invoice still carrying a remaining balance.</p>
            </div>
            <StatusBadge value={outstandingInvoices.length ? 'pending' : 'paid'} />
          </div>

          <div className="space-y-3">
            {invoicesQuery.isLoading ? (
              <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-white/70 px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                Loading invoices...
              </div>
            ) : outstandingInvoices.length ? (
              outstandingInvoices.slice(0, 10).map((invoice) => (
                <div key={invoice.id} className="rounded-[20px] border border-[var(--border)] bg-white/80 px-4 py-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--primary)]">{getInvoiceLabel(invoice)}</p>
                        <p className="text-sm text-[var(--muted-foreground)]">{getGuestName(invoice)}</p>
                      </div>
                      <StatusBadge value={invoice.status} />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Balance due</p>
                        <p className="text-xl text-[var(--primary)] [font-family:var(--font-display)]">{formatAdminCurrency(invoice.balanceAmount)}</p>
                      </div>
                      {canCreate && (
                        <Button variant="secondary" className="rounded-2xl px-4" onClick={() => openPaymentModal(invoice)}>
                          Collect
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-white/70 px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                No outstanding invoices are waiting for payment right now.
              </div>
            )}
          </div>
        </Card>
      </div>

      <AdminModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Record payment"
        description="Capture a payment against any invoice and let the system refresh balances automatically."
        widthClassName="max-w-3xl"
      >
        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className={`${adminLabelClassName} md:col-span-2`}>
            <span className={adminLabelTextClassName}>Invoice</span>
            <select
              value={paymentForm.invoiceId}
              onChange={(event) => {
                const nextInvoice = invoices.find((invoice) => invoice.id === event.target.value) ?? null;
                setPaymentForm((current) => ({
                  ...current,
                  invoiceId: event.target.value,
                  amount: nextInvoice ? String(Number(nextInvoice.balanceAmount ?? 0).toFixed(2)) : current.amount,
                }));
              }}
              className={adminSelectClassName}
              required
            >
              <option value="">Select invoice</option>
              {invoices.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.invoiceNumber} | {getDisplayName(invoice.guest, 'Guest')} | Balance {formatAdminCurrency(invoice.balanceAmount)}
                </option>
              ))}
            </select>
          </label>

          {selectedInvoice ? (
            <div className="md:col-span-2 rounded-[20px] border border-[var(--border)] bg-white/80 px-4 py-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Invoice</p>
                  <p className="mt-2 font-semibold text-[var(--primary)]">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Balance due</p>
                  <p className="mt-2 font-semibold text-[var(--primary)]">{formatAdminCurrency(selectedInvoice.balanceAmount)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Guest</p>
                  <p className="mt-2 font-semibold text-[var(--primary)]">{getGuestName(selectedInvoice)}</p>
                </div>
              </div>
            </div>
          ) : null}

          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Amount</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={paymentForm.amount}
              onChange={(event) => setPaymentForm((current) => ({ ...current, amount: event.target.value }))}
              className={adminInputClassName}
              required
            />
          </label>

          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Method</span>
            <select
              value={paymentForm.method}
              onChange={(event) => setPaymentForm((current) => ({ ...current, method: event.target.value }))}
              className={adminSelectClassName}
              required
            >
              {PAYMENT_METHOD_OPTIONS.map((method) => (
                <option key={method} value={method}>
                  {titleCase(method)}
                </option>
              ))}
            </select>
          </label>

          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Status</span>
            <select
              value={paymentForm.status}
              onChange={(event) => setPaymentForm((current) => ({ ...current, status: event.target.value }))}
              className={adminSelectClassName}
              required
            >
              {PAYMENT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {titleCase(status)}
                </option>
              ))}
            </select>
          </label>

          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Paid at</span>
            <input
              type="datetime-local"
              value={paymentForm.paidAt}
              onChange={(event) => setPaymentForm((current) => ({ ...current, paidAt: event.target.value }))}
              className={adminInputClassName}
            />
          </label>

          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Reference number</span>
            <input
              value={paymentForm.referenceNumber}
              onChange={(event) => setPaymentForm((current) => ({ ...current, referenceNumber: event.target.value }))}
              className={adminInputClassName}
              placeholder="POS slip, bank ref, or online transaction ID"
            />
          </label>

          <label className={`${adminLabelClassName} md:col-span-2`}>
            <span className={adminLabelTextClassName}>Notes</span>
            <textarea
              value={paymentForm.notes}
              onChange={(event) => setPaymentForm((current) => ({ ...current, notes: event.target.value }))}
              className={adminTextAreaClassName}
              placeholder="Optional notes for reconciliation, split settlement, or manual review"
            />
          </label>

          <div className="md:col-span-2 flex justify-end gap-3">
            <Button type="button" variant="outline" className="rounded-2xl px-5" onClick={() => setPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" className="rounded-2xl px-5" disabled={createPayment.isPending}>
              {createPayment.isPending ? 'Recording...' : 'Record payment'}
            </Button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
};
