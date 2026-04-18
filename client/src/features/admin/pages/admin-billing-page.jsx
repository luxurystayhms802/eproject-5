import { useEffect, useMemo, useState } from 'react';
import { Banknote, ClipboardPlus, FileText, ReceiptText, Search, Wallet } from 'lucide-react';
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
  FOLIO_CHARGE_TYPE_OPTIONS,
  INVOICE_STATUS_OPTIONS,
  adminInputClassName,
  adminLabelClassName,
  adminLabelTextClassName,
  adminSelectClassName,
  adminTextAreaClassName,
  formatAdminCurrency,
  formatAdminDate,
  formatAdminDateTime,
  titleCase,
} from '@/features/admin/config';
import { getDisplayName } from '@/features/admin/display-utils';
import { validateChargeForm, validateGenerateInvoiceForm } from '@/features/admin/form-utils';
import {
  useAdminFolioCharges,
  useAdminInvoice,
  useAdminInvoices,
  useAdminPayments,
  useAdminReservations,
  useAdminSettings,
  useCreateFolioCharge,
  useDeleteFolioCharge,
  useFinalizeInvoice,
  useGenerateInvoice,
} from '@/features/admin/hooks';
import { printInvoiceDocument } from '@/lib/print-documents';

const createGenerateForm = () => ({
  reservationId: '',
});

const createFinalizeForm = (invoice) => ({
  dueAt: invoice?.dueAt ? new Date(invoice.dueAt).toISOString().slice(0, 10) : '',
  notes: invoice?.notes ?? '',
});

const createChargeForm = (reservationId = '') => ({
  reservationId,
  chargeType: 'misc',
  description: '',
  unitPrice: '0',
  quantity: '1',
  chargeDate: new Date().toISOString().slice(0, 10),
});

const getInvoiceLabel = (invoice) => invoice?.invoiceNumber ?? 'Unissued invoice';
const getReservationLabel = (invoice) => invoice?.reservation?.reservationCode ?? invoice?.reservationCode ?? 'Reservation pending';
const getGuestName = (invoice) => getDisplayName(invoice?.guest, 'Guest record');

export const AdminBillingPage = () => {
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [chargeModalOpen, setChargeModalOpen] = useState(false);
  const [generateForm, setGenerateForm] = useState(createGenerateForm);
  const [finalizeForm, setFinalizeForm] = useState(createFinalizeForm(null));
  const [chargeForm, setChargeForm] = useState(createChargeForm());

  const invoicesQuery = useAdminInvoices({
    status: filters.status || undefined,
    limit: 100,
  });
  const settingsQuery = useAdminSettings();
  const reservationsQuery = useAdminReservations({ limit: 100 });
  const invoiceDetailQuery = useAdminInvoice(selectedInvoiceId);

  const invoiceFromList = useMemo(
    () => (invoicesQuery.data ?? []).find((invoice) => invoice.id === selectedInvoiceId) ?? null,
    [invoicesQuery.data, selectedInvoiceId],
  );
  const selectedInvoice = invoiceDetailQuery.data ?? invoiceFromList;

  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];
  const isAdmin = user?.role === 'admin';
  const canCreateInvoice = isAdmin || permissions.includes('invoices.create');
  const canFinalizeInvoice = isAdmin || permissions.includes('invoices.finalize');
  const canCreateCharge = isAdmin || permissions.includes('folioCharges.create');
  const canDeleteCharge = isAdmin || permissions.includes('folioCharges.delete');

  const paymentsQuery = useAdminPayments(selectedInvoice?.id ? { invoiceId: selectedInvoice.id, limit: 50 } : {}, Boolean(selectedInvoice?.id));
  const chargesQuery = useAdminFolioCharges(selectedInvoice?.reservationId ? { reservationId: selectedInvoice.reservationId, limit: 50 } : {});

  const generateInvoice = useGenerateInvoice();
  const finalizeInvoice = useFinalizeInvoice();
  const createFolioCharge = useCreateFolioCharge();
  const deleteFolioCharge = useDeleteFolioCharge();

  const invoices = invoicesQuery.data ?? [];
  const reservations = reservationsQuery.data ?? [];
  const charges = chargesQuery.data ?? [];
  const invoicePayments = paymentsQuery.data ?? [];
  const invoiceTerms = settingsQuery.data?.invoiceTerms ?? '';

  const filteredInvoices = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      if (!searchTerm) {
        return true;
      }

      const haystack = [
        invoice.invoiceNumber,
        getDisplayName(invoice.guest),
        invoice.guest?.email,
        invoice.reservation?.reservationCode,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(searchTerm);
    });
  }, [filters.search, invoices]);

  useEffect(() => {
    if (!filteredInvoices.length) {
      setSelectedInvoiceId('');
      return;
    }

    if (!selectedInvoiceId || !filteredInvoices.some((invoice) => invoice.id === selectedInvoiceId)) {
      setSelectedInvoiceId(filteredInvoices[0].id);
    }
  }, [filteredInvoices, selectedInvoiceId]);

  const summary = useMemo(() => {
    const totalBilled = invoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount ?? 0), 0);
    const outstandingBalance = invoices.reduce((sum, invoice) => sum + Number(invoice.balanceAmount ?? 0), 0);
    const collectedAmount = invoices.reduce((sum, invoice) => sum + Number(invoice.paidAmount ?? 0), 0);
    const collectionRate = totalBilled > 0 ? Math.round((collectedAmount / totalBilled) * 100) : 0;

    return {
      totalInvoices: invoices.length,
      outstandingBalance,
      collectedAmount,
      collectionRate,
    };
  }, [invoices]);

  const eligibleReservations = useMemo(
    () => reservations.filter((reservation) => !['draft', 'cancelled', 'missed_arrival'].includes(reservation.status)),
    [reservations],
  );

  const openGenerateModal = () => {
    setGenerateForm({
      reservationId: eligibleReservations[0]?.id ?? '',
    });
    setGenerateModalOpen(true);
  };

  const openFinalizeModal = () => {
    if (!selectedInvoice) {
      return;
    }

    setFinalizeForm(createFinalizeForm(selectedInvoice));
    setFinalizeModalOpen(true);
  };

  const openChargeModal = () => {
    if (!selectedInvoice?.reservationId) {
      return;
    }

    setChargeForm(createChargeForm(selectedInvoice.reservationId));
    setChargeModalOpen(true);
  };

  const handleGenerateInvoice = async (event) => {
    event.preventDefault();
    const validationMessage = validateGenerateInvoiceForm(generateForm);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    try {
      const invoice = await generateInvoice.mutateAsync(generateForm.reservationId);
      setSelectedInvoiceId(invoice.id);
      setGenerateModalOpen(false);
    } catch {
      // Mutation hook already shows a toast.
    }
  };

  const handleFinalizeInvoice = async (event) => {
    event.preventDefault();

    if (!selectedInvoice) {
      toast.error('Select an invoice before finalizing it.');
      return;
    }

    try {
      await finalizeInvoice.mutateAsync({
        invoiceId: selectedInvoice.id,
        payload: {
          dueAt: finalizeForm.dueAt || null,
          notes: finalizeForm.notes.trim() || null,
        },
      });

      setFinalizeModalOpen(false);
    } catch {
      // Mutation hook already shows a toast.
    }
  };

  const handleCreateCharge = async (event) => {
    event.preventDefault();
    const validationMessage = validateChargeForm(chargeForm);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    try {
      await createFolioCharge.mutateAsync({
        reservationId: chargeForm.reservationId,
        chargeType: chargeForm.chargeType,
        description: chargeForm.description.trim(),
        unitPrice: Number(chargeForm.unitPrice),
        quantity: Number(chargeForm.quantity),
        chargeDate: chargeForm.chargeDate || undefined,
      });

      setChargeModalOpen(false);
    } catch {
      // Mutation hook already shows a toast.
    }
  };

  const handleDeleteCharge = async (chargeId) => {
    if (!window.confirm('Remove this folio charge from the invoice draft?')) {
      return;
    }

    try {
      await deleteFolioCharge.mutateAsync(chargeId);
    } catch {
      // Mutation hook already shows a toast.
    }
  };

  const handlePrintInvoice = () => {
    if (!selectedInvoice) {
      toast.error('Select an invoice before printing it.');
      return;
    }

    printInvoiceDocument({
      brandLabel: 'LuxuryStay Admin',
      invoice: selectedInvoice,
      charges,
      payments: invoicePayments,
      invoiceTerms,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Invoices"
        description="Generate billing drafts, finalize invoices, and review folio charges with a cleaner admin finance desk."
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="rounded-2xl px-4" onClick={handlePrintInvoice} disabled={!selectedInvoice}>
              Print invoice
            </Button>
            {canCreateInvoice && (
              <Button variant="secondary" className="rounded-2xl px-4" onClick={openGenerateModal}>
                Generate invoice
              </Button>
            )}
          </div>
        }
      >
        <StatusBadge value={summary.totalInvoices ? 'active' : 'inactive'} className="capitalize" />
        <span className="inline-flex items-center rounded-full border border-[rgba(16,36,63,0.08)] bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
          Outstanding {formatAdminCurrency(summary.outstandingBalance)}
        </span>
      </PageHeader>

      <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-4">
        <StatsCard
          title="Invoices"
          value={summary.totalInvoices}
          description="Billing records currently visible inside the admin finance queue."
          icon={ReceiptText}
        />
        <StatsCard
          title="Outstanding"
          value={formatAdminCurrency(summary.outstandingBalance)}
          description="Unsettled balance still awaiting payment collection or final closure."
          icon={Wallet}
        />
        <StatsCard
          title="Collected"
          value={formatAdminCurrency(summary.collectedAmount)}
          description="Successful captured revenue reflected across generated invoice records."
          icon={Banknote}
        />
        <StatsCard
          title="Collection Rate"
          value={`${summary.collectionRate}%`}
          description="Share of billed revenue already converted into captured payment value."
          icon={FileText}
        />
      </div>

      <AdminToolbar
        title="Invoice command desk"
        description="Search active billing records, review stay charges, and open finalization actions without leaving the admin cockpit."
        actions={
          selectedInvoice ? (
            <>
              {canCreateCharge && (
                <Button variant="outline" className="rounded-2xl px-4" onClick={openChargeModal} disabled={selectedInvoice.status === 'paid'}>
                  Add charge
                </Button>
              )}
              {canFinalizeInvoice && (
                <Button variant="secondary" className="rounded-2xl px-4" onClick={openFinalizeModal}>
                  Finalize invoice
                </Button>
              )}
            </>
          ) : null
        }
      >
        <div className="grid w-full gap-3 xl:grid-cols-[minmax(0,1.5fr)_220px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--accent-strong)]" />
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              className={`${adminInputClassName} pl-11`}
              placeholder="Search invoice number, guest, or reservation code"
            />
          </label>

          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            className={adminSelectClassName}
          >
            <option value="">All invoice statuses</option>
            {INVOICE_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {titleCase(status)}
              </option>
            ))}
          </select>
        </div>
      </AdminToolbar>

      <div className="grid gap-6 2xl:grid-cols-[0.92fr_1.25fr]">
        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-[rgba(16,36,63,0.08)] px-5 py-4">
            <div>
              <h2 className="text-[24px] text-[var(--primary)] [font-family:var(--font-display)]">Invoice queue</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Select any invoice to inspect balances, charges, and payment movement.</p>
            </div>
            <StatusBadge value={filters.status || 'active'} />
          </div>

          <div className="scrollbar-invisible smooth-scroll max-h-[760px] space-y-3 overflow-y-auto px-4 py-4">
            {invoicesQuery.isLoading ? (
              <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-white/65 px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                Loading invoice records...
              </div>
            ) : filteredInvoices.length ? (
              filteredInvoices.map((invoice) => {
                const isActive = invoice.id === selectedInvoiceId;

                return (
                  <button
                    key={invoice.id}
                    type="button"
                    onClick={() => setSelectedInvoiceId(invoice.id)}
                    className={[
                      'w-full rounded-[22px] border px-4 py-4 text-left transition',
                      isActive
                        ? 'border-[rgba(184,140,74,0.32)] bg-[linear-gradient(135deg,rgba(255,252,247,0.98)_0%,rgba(241,231,214,0.96)_100%)] shadow-[0_16px_34px_rgba(16,36,63,0.1)]'
                        : 'border-[var(--border)] bg-white/75 hover:bg-white hover:shadow-[0_16px_34px_rgba(16,36,63,0.06)]',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-[var(--primary)]">{getInvoiceLabel(invoice)}</p>
                          <StatusBadge value={invoice.status} />
                        </div>
                        <p className="text-sm text-[var(--foreground)]">{getGuestName(invoice)}</p>
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">{getReservationLabel(invoice)}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-semibold text-[var(--primary)]">{formatAdminCurrency(invoice.totalAmount)}</p>
                        <p className="text-sm text-[var(--muted-foreground)]">Balance {formatAdminCurrency(invoice.balanceAmount)}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-white/65 px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                No invoices match the active billing filters yet.
              </div>
            )}
          </div>
        </Card>

        <Card className="space-y-5">
          {selectedInvoice ? (
            <>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={selectedInvoice.status} />
                    <span className="inline-flex rounded-full border border-[rgba(16,36,63,0.08)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                      {getReservationLabel(selectedInvoice)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-[30px] text-[var(--primary)] [font-family:var(--font-display)]">{getInvoiceLabel(selectedInvoice)}</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                      Guest {getGuestName(selectedInvoice)} with issued activity recorded on {formatAdminDateTime(selectedInvoice.issuedAt)}.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[20px] border border-[var(--border)] bg-white/82 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Total amount</p>
                    <p className="mt-2 text-[28px] text-[var(--primary)] [font-family:var(--font-display)]">
                      {formatAdminCurrency(selectedInvoice.totalAmount)}
                    </p>
                  </div>
                  <div className="rounded-[20px] border border-[var(--border)] bg-white/82 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Balance due</p>
                    <p className="mt-2 text-[28px] text-[var(--primary)] [font-family:var(--font-display)]">
                      {formatAdminCurrency(selectedInvoice.balanceAmount)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <div className="rounded-[22px] border border-[var(--border)] bg-white/80 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Stay ledger</p>
                  <div className="mt-3 space-y-2 text-sm text-[var(--foreground)]">
                    <p>Subtotal: {formatAdminCurrency(selectedInvoice.subtotal)}</p>
                    <p>Tax: {formatAdminCurrency(selectedInvoice.taxAmount)}</p>
                    <p>Discount: {formatAdminCurrency(selectedInvoice.discountAmount)}</p>
                  </div>
                </div>
                <div className="rounded-[22px] border border-[var(--border)] bg-white/80 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Collection posture</p>
                  <div className="mt-3 space-y-2 text-sm text-[var(--foreground)]">
                    <p>Paid: {formatAdminCurrency(selectedInvoice.paidAmount)}</p>
                    <p>Balance: {formatAdminCurrency(selectedInvoice.balanceAmount)}</p>
                    <p>Due date: {formatAdminDate(selectedInvoice.dueAt)}</p>
                  </div>
                </div>
                <div className="rounded-[22px] border border-[var(--border)] bg-white/80 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Action stack</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {canCreateCharge && (
                      <Button variant="outline" className="rounded-2xl px-4" onClick={openChargeModal} disabled={selectedInvoice.status === 'paid'}>
                        <ClipboardPlus className="mr-2 h-4 w-4" />
                        Add charge
                      </Button>
                    )}
                    <Button variant="outline" className="rounded-2xl px-4" onClick={handlePrintInvoice}>
                      <ReceiptText className="mr-2 h-4 w-4" />
                      Print invoice
                    </Button>
                    {canFinalizeInvoice && (
                      <Button variant="secondary" className="rounded-2xl px-4" onClick={openFinalizeModal}>
                        <FileText className="mr-2 h-4 w-4" />
                        Finalize
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[24px] text-[var(--primary)] [font-family:var(--font-display)]">Folio charges</h3>
                      <p className="text-sm text-[var(--muted-foreground)]">Live service, minibar, and tax items shaping the billing draft.</p>
                    </div>
                    {canCreateCharge && (
                      <Button variant="outline" className="rounded-2xl px-4" onClick={openChargeModal} disabled={selectedInvoice.status === 'paid'}>
                        Add charge
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {chargesQuery.isLoading ? (
                      <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-white/70 px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                        Loading folio charges...
                      </div>
                    ) : charges.length ? (
                      charges.map((charge) => (
                        <div key={charge.id} className="rounded-[20px] border border-[var(--border)] bg-white/78 px-4 py-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex rounded-full border border-[rgba(16,36,63,0.08)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                                  {titleCase(charge.chargeType)}
                                </span>
                                <span className="text-xs text-[var(--muted-foreground)]">{formatAdminDate(charge.chargeDate)}</span>
                              </div>
                              <p className="font-medium text-[var(--foreground)]">{charge.description}</p>
                              <p className="text-sm text-[var(--muted-foreground)]">
                                {formatAdminCurrency(charge.unitPrice)} x {charge.quantity}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 md:flex-col md:items-end">
                              <p className="text-lg font-semibold text-[var(--primary)]">{formatAdminCurrency(charge.amount)}</p>
                              {canDeleteCharge && (
                                <Button variant="outline" className="rounded-2xl px-4 py-2 text-xs" onClick={() => handleDeleteCharge(charge.id)} disabled={selectedInvoice.status === 'paid'}>
                                  Remove
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-white/70 px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                        No folio charges have been added to this reservation yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[24px] text-[var(--primary)] [font-family:var(--font-display)]">Payment movement</h3>
                      <p className="text-sm text-[var(--muted-foreground)]">Captured or pending collections linked to the selected invoice.</p>
                    </div>
                    <StatusBadge value={invoicePayments.length ? 'active' : 'inactive'} />
                  </div>

                  <div className="space-y-3">
                    {paymentsQuery.isLoading ? (
                      <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-white/70 px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                        Loading payment history...
                      </div>
                    ) : invoicePayments.length ? (
                      invoicePayments.map((payment) => (
                        <div key={payment.id} className="rounded-[20px] border border-[var(--border)] bg-white/78 px-4 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <StatusBadge value={payment.status} />
                                <span className="inline-flex rounded-full border border-[rgba(16,36,63,0.08)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                                  {titleCase(payment.method)}
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-[var(--muted-foreground)]">{formatAdminDateTime(payment.paidAt)}</p>
                              <p className="text-sm text-[var(--foreground)]">{payment.referenceNumber || 'No payment reference supplied'}</p>
                            </div>
                            <p className="text-lg font-semibold text-[var(--primary)]">{formatAdminCurrency(payment.amount)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-white/70 px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                        No payment activity recorded for this invoice yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-[22px] border border-dashed border-[var(--border)] bg-white/72 px-5 py-10 text-center text-sm text-[var(--muted-foreground)]">
              Select an invoice from the left queue to inspect billing totals, charges, and payment movement.
            </div>
          )}
        </Card>
      </div>

      <AdminModal
        open={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        title="Generate invoice"
        description="Choose a reservation and the system will calculate room totals, taxes, discounts, and current folio charges."
        widthClassName="max-w-2xl"
      >
        <form className="space-y-5" onSubmit={handleGenerateInvoice}>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Reservation</span>
            <select
              value={generateForm.reservationId}
              onChange={(event) => setGenerateForm({ reservationId: event.target.value })}
              className={adminSelectClassName}
              required
            >
              <option value="">Select reservation</option>
              {eligibleReservations.map((reservation) => (
                <option key={reservation.id} value={reservation.id}>
                  {reservation.reservationCode} | {getDisplayName(reservation.guest ?? reservation.guestProfileSnapshot, 'Guest')} |{' '}
                  {titleCase(reservation.status)}
                </option>
              ))}
            </select>
          </label>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" className="rounded-2xl px-5" onClick={() => setGenerateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" className="rounded-2xl px-5" disabled={generateInvoice.isPending}>
              {generateInvoice.isPending ? 'Generating...' : 'Generate invoice'}
            </Button>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={finalizeModalOpen}
        onClose={() => setFinalizeModalOpen(false)}
        title="Finalize invoice"
        description="Lock the current billing draft with optional due date and final notes for operations or guest-facing delivery."
        widthClassName="max-w-2xl"
      >
        <form className="space-y-5" onSubmit={handleFinalizeInvoice}>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Due date</span>
            <input
              type="date"
              value={finalizeForm.dueAt}
              onChange={(event) => setFinalizeForm((current) => ({ ...current, dueAt: event.target.value }))}
              className={adminInputClassName}
            />
          </label>

          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Admin notes</span>
            <textarea
              value={finalizeForm.notes}
              onChange={(event) => setFinalizeForm((current) => ({ ...current, notes: event.target.value }))}
              className={adminTextAreaClassName}
              placeholder="Payment terms, billing notes, or stay-specific settlement remarks"
            />
          </label>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" className="rounded-2xl px-5" onClick={() => setFinalizeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" className="rounded-2xl px-5" disabled={finalizeInvoice.isPending}>
              {finalizeInvoice.isPending ? 'Finalizing...' : 'Finalize invoice'}
            </Button>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={chargeModalOpen}
        onClose={() => setChargeModalOpen(false)}
        title="Add folio charge"
        description="Capture room-service, transport, minibar, or miscellaneous charges directly against the selected reservation."
        widthClassName="max-w-3xl"
      >
        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleCreateCharge}>
          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Charge type</span>
            <select
              value={chargeForm.chargeType}
              onChange={(event) => setChargeForm((current) => ({ ...current, chargeType: event.target.value }))}
              className={adminSelectClassName}
              required
            >
              {FOLIO_CHARGE_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {titleCase(type)}
                </option>
              ))}
            </select>
          </label>

          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Charge date</span>
            <input
              type="date"
              value={chargeForm.chargeDate}
              onChange={(event) => setChargeForm((current) => ({ ...current, chargeDate: event.target.value }))}
              className={adminInputClassName}
              required
            />
          </label>

          <label className={`${adminLabelClassName} md:col-span-2`}>
            <span className={adminLabelTextClassName}>Description</span>
            <input
              value={chargeForm.description}
              onChange={(event) => setChargeForm((current) => ({ ...current, description: event.target.value }))}
              className={adminInputClassName}
              placeholder="Example: In-room dining, airport transfer, or minibar consumption"
              required
            />
          </label>

          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Unit price</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={chargeForm.unitPrice}
              onChange={(event) => setChargeForm((current) => ({ ...current, unitPrice: event.target.value }))}
              className={adminInputClassName}
              required
            />
          </label>

          <label className={adminLabelClassName}>
            <span className={adminLabelTextClassName}>Quantity</span>
            <input
              type="number"
              min="1"
              step="1"
              value={chargeForm.quantity}
              onChange={(event) => setChargeForm((current) => ({ ...current, quantity: event.target.value }))}
              className={adminInputClassName}
              required
            />
          </label>

          <div className="md:col-span-2 flex justify-end gap-3">
            <Button type="button" variant="outline" className="rounded-2xl px-5" onClick={() => setChargeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" className="rounded-2xl px-5" disabled={createFolioCharge.isPending}>
              {createFolioCharge.isPending ? 'Saving...' : 'Add charge'}
            </Button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
};
