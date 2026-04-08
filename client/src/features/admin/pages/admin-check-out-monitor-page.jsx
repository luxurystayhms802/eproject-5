import { useMemo, useState } from 'react';
import { Receipt, Search, Wallet, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdminToolbar } from '@/features/admin/components/admin-toolbar';
import {
  FOLIO_CHARGE_TYPE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  adminInputClassName,
  adminLabelClassName,
  adminLabelTextClassName,
  adminSelectClassName,
  adminTextAreaClassName,
  formatAdminCurrency,
  formatAdminDate,
} from '@/features/admin/config';
import { getDisplayName } from '@/features/admin/display-utils';
import { validateChargeForm, validatePaymentForm } from '@/features/admin/form-utils';
import {
  useAdminCheckOutReservation,
  useAdminFolioCharges,
  useAdminReservations,
  useCreateFolioCharge,
  useDeleteFolioCharge,
  useGenerateInvoice,
} from '@/features/admin/hooks';
import { printInvoiceDocument } from '@/lib/print-documents';

const today = new Date();
const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, -1);

const createChargeDraft = () => ({
  chargeType: 'food',
  description: '',
  unitPrice: '',
  quantity: '1',
});

const createPaymentDraft = () => ({
  amount: '',
  method: 'card',
  referenceNumber: '',
  notes: '',
});

const isSameDepartureWindow = (value) => {
  const checkOutDate = new Date(value);
  return checkOutDate >= startOfToday && checkOutDate <= endOfToday;
};

export const AdminCheckOutMonitorPage = () => {
  const [search, setSearch] = useState('');
  const [expandedReservationId, setExpandedReservationId] = useState(null);
  const [invoicePreview, setInvoicePreview] = useState({});
  const [chargeDrafts, setChargeDrafts] = useState({});
  const [paymentDrafts, setPaymentDrafts] = useState({});

  const checkedInReservationsQuery = useAdminReservations({
    status: 'checked_in',
    limit: 60,
  });
  const folioChargesQuery = useAdminFolioCharges(expandedReservationId ? { reservationId: expandedReservationId, limit: 50 } : {});

  const generateInvoiceMutation = useGenerateInvoice();
  const addChargeMutation = useCreateFolioCharge();
  const deleteChargeMutation = useDeleteFolioCharge();
  const checkOutMutation = useAdminCheckOutReservation();

  const reservations = useMemo(
    () =>
      (checkedInReservationsQuery.data ?? [])
        .filter((reservation) => {
          const haystack = [
            reservation.reservationCode,
            getDisplayName(reservation.guest ?? reservation.guestProfileSnapshot),
            reservation.guest?.email,
            reservation.room?.roomNumber,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return haystack.includes(search.trim().toLowerCase());
        })
        .sort((left, right) => new Date(left.checkOutDate).getTime() - new Date(right.checkOutDate).getTime()),
    [checkedInReservationsQuery.data, search],
  );

  const summary = useMemo(
    () => ({
      checkedIn: reservations.length,
      departuresToday: reservations.filter((reservation) => isSameDepartureWindow(reservation.checkOutDate)).length,
      previewsReady: Object.keys(invoicePreview).length,
      expandedFolios: expandedReservationId ? 1 : 0,
    }),
    [expandedReservationId, invoicePreview, reservations],
  );

  const folioCharges = folioChargesQuery.data ?? [];

  const handlePrintPreview = (reservation, preview) => {
    if (!preview) {
      toast.error('Generate an invoice preview before printing it.');
      return;
    }

    printInvoiceDocument({
      brandLabel: 'LuxuryStay Admin',
      invoice: {
        ...preview,
        reservation: reservation,
        guest: reservation.guest ?? reservation.guestProfileSnapshot,
      },
      charges: expandedReservationId === reservation.id ? folioCharges : [],
      payments: [],
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Check-Out Monitor"
        description="Review folio charges, preview invoices, collect settlement, and move rooms into the housekeeping cycle from one admin monitor."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Checked-in stays" value={String(summary.checkedIn)} description="In-house reservations currently eligible for settlement workflows." icon={Wallet} />
        <StatsCard title="Departures today" value={String(summary.departuresToday)} description="Guests whose scheduled departure falls within today's checkout window." icon={Receipt} />
        <StatsCard title="Invoice previews" value={String(summary.previewsReady)} description="Stays with a generated invoice preview ready for final settlement." icon={Receipt} />
        <StatsCard title="Expanded folios" value={String(summary.expandedFolios)} description="Reservations currently open for charge review, invoice preview, or checkout." icon={Wallet} />
      </div>

      <AdminToolbar title="Departure queue" description="Search checked-in stays, add extra charges, preview invoices, and complete settlement in one controlled sequence.">
        <label className="relative block w-full">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            className={`${adminInputClassName} pl-11`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search reservation, guest, or room number"
          />
        </label>
      </AdminToolbar>

      <div className="grid gap-4">
        {checkedInReservationsQuery.isLoading ? (
          Array.from({ length: 2 }).map((_, index) => <Card key={index} className="h-72 animate-pulse bg-white/70" />)
        ) : reservations.length ? (
          reservations.map((reservation) => {
            const chargeDraft = chargeDrafts[reservation.id] ?? createChargeDraft();
            const paymentDraft = paymentDrafts[reservation.id] ?? createPaymentDraft();
            const preview = invoicePreview[reservation.id];

            return (
              <Card key={reservation.id} className="space-y-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge value={reservation.status} />
                      {isSameDepartureWindow(reservation.checkOutDate) ? <StatusBadge value="pending" /> : null}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">{reservation.reservationCode}</p>
                      <h2 className="mt-2 text-[30px] text-[var(--primary)] [font-family:var(--font-display)]">
                        {getDisplayName(reservation.guest ?? reservation.guestProfileSnapshot, 'In-house guest')}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        Room {reservation.room?.roomNumber ?? 'Unassigned'} | {reservation.roomType?.name ?? 'Room type'} | Departure {formatAdminDate(reservation.checkOutDate)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[380px]">
                    <div className="rounded-[22px] border border-[var(--border)] bg-white/84 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Folio state</p>
                      <p className="mt-2 text-lg font-semibold text-[var(--primary)]">{folioCharges.length && expandedReservationId === reservation.id ? folioCharges.length : 0} charges</p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">Expand the stay to review and add live billing items.</p>
                    </div>
                    <div className="rounded-[22px] border border-[var(--border)] bg-white/84 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Invoice balance</p>
                      <p className="mt-2 text-lg font-semibold text-[var(--primary)]">{preview ? formatAdminCurrency(preview.balanceAmount) : 'Preview pending'}</p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{preview ? preview.invoiceNumber : 'Generate invoice first'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        setExpandedReservationId((current) => (current === reservation.id ? null : reservation.id));
                        const invoice = await generateInvoiceMutation.mutateAsync(reservation.id);
                        setInvoicePreview((current) => ({ ...current, [reservation.id]: invoice }));
                        setPaymentDrafts((current) => ({
                          ...current,
                          [reservation.id]: {
                            ...(current[reservation.id] ?? createPaymentDraft()),
                            amount: String(invoice.balanceAmount),
                          },
                        }));
                      } catch {
                        // Mutation hook already shows a toast.
                      }
                    }}
                  >
                    <Receipt className="mr-2 h-4 w-4" />
                    {preview ? 'Generate invoice' : 'Generate invoice'}
                  </Button>
                  <Button variant="outline" onClick={() => setExpandedReservationId((current) => (current === reservation.id ? null : reservation.id))}>
                    Manage folio
                  </Button>
                  {preview ? (
                    <Button variant="outline" onClick={() => handlePrintPreview(reservation, preview)}>
                      Print invoice
                    </Button>
                  ) : null}
                </div>

                {expandedReservationId === reservation.id ? (
                  <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-4">
                      <div className="rounded-[22px] border border-[var(--border)] bg-white/82 p-5">
                        <h3 className="text-[22px] text-[var(--primary)] [font-family:var(--font-display)]">Folio charges</h3>
                        <div className="mt-4 space-y-3">
                          {folioChargesQuery.isLoading ? (
                            <div className="h-28 animate-pulse rounded-[18px] bg-white/70" />
                          ) : folioCharges.length ? (
                            folioCharges.map((charge) => (
                              <div key={charge.id} className="flex items-center justify-between rounded-[18px] border border-[var(--border)] bg-white/78 px-4 py-3 text-sm">
                                <div>
                                  <p className="font-medium text-[var(--foreground)]">{charge.description}</p>
                                  <p className="text-[var(--muted-foreground)] capitalize">{charge.chargeType}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-[var(--primary)]">{formatAdminCurrency(charge.amount)}</span>
                                  {preview?.status !== 'paid' && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (!window.confirm('Remove this charge?')) return;
                                        try {
                                          await deleteChargeMutation.mutateAsync(charge.id);
                                          const invoice = await generateInvoiceMutation.mutateAsync(reservation.id);
                                          setInvoicePreview((current) => ({ ...current, [reservation.id]: invoice }));
                                        } catch {
                                          // Error handled natively by mutation hook toast
                                        }
                                      }}
                                      className="p-1 text-[var(--red)] hover:bg-black/5 rounded-full transition-colors"
                                      title="Remove charge"
                                      disabled={deleteChargeMutation.isPending}
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-[var(--muted-foreground)]">No extra charges added yet.</p>
                          )}
                        </div>
                      </div>

                      {preview?.status !== 'paid' && (
                      <div className="rounded-[22px] border border-[var(--border)] bg-white/82 p-5">
                        <h3 className="text-[22px] text-[var(--primary)] [font-family:var(--font-display)]">Add extra charge</h3>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <label className={adminLabelClassName}>
                            <span className={adminLabelTextClassName}>Charge type</span>
                            <select
                              className={adminSelectClassName}
                              value={chargeDraft.chargeType}
                              onChange={(event) =>
                                setChargeDrafts((current) => ({
                                  ...current,
                                  [reservation.id]: { ...chargeDraft, chargeType: event.target.value },
                                }))
                              }
                            >
                              {FOLIO_CHARGE_TYPE_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className={adminLabelClassName}>
                            <span className={adminLabelTextClassName}>Description</span>
                            <input
                              className={adminInputClassName}
                              value={chargeDraft.description}
                              onChange={(event) =>
                                setChargeDrafts((current) => ({
                                  ...current,
                                  [reservation.id]: { ...chargeDraft, description: event.target.value },
                                }))
                              }
                            />
                          </label>
                          <label className={adminLabelClassName}>
                            <span className={adminLabelTextClassName}>Unit price</span>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              className={adminInputClassName}
                              value={chargeDraft.unitPrice}
                              onChange={(event) =>
                                setChargeDrafts((current) => ({
                                  ...current,
                                  [reservation.id]: { ...chargeDraft, unitPrice: event.target.value },
                                }))
                              }
                            />
                          </label>
                          <label className={adminLabelClassName}>
                            <span className={adminLabelTextClassName}>Quantity</span>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              className={adminInputClassName}
                              value={chargeDraft.quantity}
                              onChange={(event) =>
                                setChargeDrafts((current) => ({
                                  ...current,
                                  [reservation.id]: { ...chargeDraft, quantity: event.target.value },
                                }))
                              }
                            />
                          </label>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <Button
                            variant="outline"
                            onClick={async () => {
                              const validationMessage = validateChargeForm({
                                reservationId: reservation.id,
                                chargeType: chargeDraft.chargeType,
                                description: chargeDraft.description,
                                unitPrice: chargeDraft.unitPrice,
                                quantity: chargeDraft.quantity,
                                chargeDate: new Date().toISOString().slice(0, 10),
                              });
                              if (validationMessage) {
                                toast.error(validationMessage);
                                return;
                              }

                              try {
                                await addChargeMutation.mutateAsync({
                                  reservationId: reservation.id,
                                  chargeType: chargeDraft.chargeType,
                                  description: chargeDraft.description.trim(),
                                  unitPrice: Number(chargeDraft.unitPrice),
                                  quantity: Number(chargeDraft.quantity),
                                });
                                setChargeDrafts((current) => ({
                                  ...current,
                                  [reservation.id]: createChargeDraft(),
                                }));
                                const invoice = await generateInvoiceMutation.mutateAsync(reservation.id);
                                setInvoicePreview((current) => ({ ...current, [reservation.id]: invoice }));
                              } catch {
                                // Mutation hook already shows a toast.
                              }
                            }}
                            disabled={addChargeMutation.isPending}
                          >
                            Add charge
                          </Button>
                        </div>
                      </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[22px] border border-[var(--border)] bg-white/82 p-5">
                        <h3 className="text-[22px] text-[var(--primary)] [font-family:var(--font-display)]">Invoice summary</h3>
                        {preview ? (
                          <div className="mt-4 space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-[var(--muted-foreground)]">Subtotal</span>
                              <span>{formatAdminCurrency(preview.subtotal)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[var(--muted-foreground)]">Tax</span>
                              <span>{formatAdminCurrency(preview.taxAmount)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[var(--muted-foreground)]">Paid</span>
                              <span>{formatAdminCurrency(preview.paidAmount)}</span>
                            </div>
                            <div className="flex items-center justify-between text-base font-semibold text-[var(--primary)]">
                              <span>Balance</span>
                              <span>{formatAdminCurrency(preview.balanceAmount)}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-4 text-sm text-[var(--muted-foreground)]">Generate an invoice to preview settlement details.</p>
                        )}
                      </div>

                      <div className="rounded-[22px] border border-[var(--border)] bg-white/82 p-5">
                        <h3 className="text-[22px] text-[var(--primary)] [font-family:var(--font-display)]">Settlement</h3>
                        <div className="mt-4 grid gap-4">
                          <label className={adminLabelClassName}>
                            <span className={adminLabelTextClassName}>Payment amount</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className={adminInputClassName}
                              value={paymentDraft.amount}
                              onChange={(event) =>
                                setPaymentDrafts((current) => ({
                                  ...current,
                                  [reservation.id]: { ...paymentDraft, amount: event.target.value },
                                }))
                              }
                            />
                          </label>
                          <label className={adminLabelClassName}>
                            <span className={adminLabelTextClassName}>Method</span>
                            <select
                              className={adminSelectClassName}
                              value={paymentDraft.method}
                              onChange={(event) =>
                                setPaymentDrafts((current) => ({
                                  ...current,
                                  [reservation.id]: { ...paymentDraft, method: event.target.value },
                                }))
                              }
                            >
                              {PAYMENT_METHOD_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className={adminLabelClassName}>
                            <span className={adminLabelTextClassName}>Reference number</span>
                            <input
                              className={adminInputClassName}
                              value={paymentDraft.referenceNumber}
                              onChange={(event) =>
                                setPaymentDrafts((current) => ({
                                  ...current,
                                  [reservation.id]: { ...paymentDraft, referenceNumber: event.target.value },
                                }))
                              }
                            />
                          </label>
                          <label className={adminLabelClassName}>
                            <span className={adminLabelTextClassName}>Checkout note</span>
                            <textarea
                              rows={3}
                              className={adminTextAreaClassName}
                              value={paymentDraft.notes}
                              onChange={(event) =>
                                setPaymentDrafts((current) => ({
                                  ...current,
                                  [reservation.id]: { ...paymentDraft, notes: event.target.value },
                                }))
                              }
                            />
                          </label>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <Button
                            variant="secondary"
                            onClick={() => {
                              const previewInvoice = invoicePreview[reservation.id] ?? null;
                              const paymentPayload =
                                paymentDraft.amount && Number(paymentDraft.amount) > 0
                                  ? {
                                      invoiceId: previewInvoice?.id ?? '',
                                      amount: paymentDraft.amount,
                                      status: 'success',
                                    }
                                  : null;
                              const validationMessage = paymentPayload ? validatePaymentForm(paymentPayload, previewInvoice) : null;

                              if (!previewInvoice) {
                                toast.error('Generate an invoice preview before checkout.');
                                return;
                              }

                              if (validationMessage) {
                                toast.error(validationMessage);
                                return;
                              }

                              checkOutMutation.mutate({
                                reservationId: reservation.id,
                                payload: {
                                  notes: paymentDraft.notes.trim() || null,
                                  payment:
                                    paymentDraft.amount && Number(paymentDraft.amount) > 0
                                      ? {
                                          amount: Number(paymentDraft.amount),
                                          method: paymentDraft.method,
                                          referenceNumber: paymentDraft.referenceNumber.trim() || null,
                                          notes: paymentDraft.notes.trim() || null,
                                          status: 'success',
                                        }
                                      : undefined,
                                },
                              });
                            }}
                            disabled={checkOutMutation.isPending}
                          >
                            <Wallet className="mr-2 h-4 w-4" />
                            {checkOutMutation.isPending ? 'Checking out...' : 'Finalize check-out'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </Card>
            );
          })
        ) : (
          <Card className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--primary)]">No checked-in guests to settle</h2>
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">
              In-house reservations will appear here for folio review, invoice generation, payment collection, and checkout settlement.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
