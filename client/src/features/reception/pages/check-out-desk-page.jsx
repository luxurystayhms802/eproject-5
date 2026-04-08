import { useMemo, useState } from 'react';
import { Receipt, Wallet, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDisplayName } from '@/features/admin/display-utils';
import { validateChargeForm, validatePaymentForm } from '@/features/admin/form-utils';
import {
  chargeTypeOptions,
  formatReceptionCurrency,
  paymentMethodOptions,
  receptionFieldClassName,
  receptionTextAreaClassName,
} from '@/features/reception/config';
import {
  useAddFolioCharge,
  useCheckOutReservation,
  useCheckedInReservations,
  useDeleteFolioCharge,
  useFolioCharges,
  useGenerateInvoice,
} from '@/features/reception/hooks';
import { printInvoiceDocument } from '@/lib/print-documents';

export const CheckOutDeskPage = () => {
  const checkedInReservationsQuery = useCheckedInReservations();
  const generateInvoiceMutation = useGenerateInvoice();
  const addChargeMutation = useAddFolioCharge();
  const deleteChargeMutation = useDeleteFolioCharge();
  const checkOutMutation = useCheckOutReservation();

  const [expandedReservationId, setExpandedReservationId] = useState(null);
  const [invoicePreview, setInvoicePreview] = useState({});
  const [chargeDrafts, setChargeDrafts] = useState({});
  const [paymentDrafts, setPaymentDrafts] = useState({});

  const folioChargesQuery = useFolioCharges(expandedReservationId);
  const reservations = useMemo(
    () =>
      (checkedInReservationsQuery.data ?? []).sort(
        (left, right) => new Date(left.checkOutDate).getTime() - new Date(right.checkOutDate).getTime(),
      ),
    [checkedInReservationsQuery.data],
  );
  const folioCharges = folioChargesQuery.data ?? [];

  const handlePrintPreview = (reservation, preview) => {
    if (!preview) {
      return;
    }

    printInvoiceDocument({
      brandLabel: 'LuxuryStay Reception',
      invoice: {
        ...preview,
        reservation,
        guest: reservation.guest,
      },
      charges: expandedReservationId === reservation.id ? folioCharges : [],
      payments: [],
    });
  };

  const handlePreviewInvoice = async (reservation, paymentDraft) => {
    setExpandedReservationId(reservation.id);
    const invoice = await generateInvoiceMutation.mutateAsync(reservation.id);
    setInvoicePreview((current) => ({ ...current, [reservation.id]: invoice }));
    setPaymentDrafts((current) => ({
      ...current,
      [reservation.id]: {
        ...(current[reservation.id] ?? paymentDraft),
        amount: String(invoice.balanceAmount),
      },
    }));
  };

  const handleAddCharge = async (reservation, chargeDraft) => {
    const validationMessage = validateChargeForm({
      reservationId: reservation.id,
      chargeType: chargeDraft.chargeType,
      description: chargeDraft.description,
      unitPrice: chargeDraft.unitPrice,
      quantity: chargeDraft.quantity,
      chargeDate: new Date().toISOString(),
    });

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    await addChargeMutation.mutateAsync({
      reservationId: reservation.id,
      chargeType: chargeDraft.chargeType,
      description: chargeDraft.description.trim(),
      unitPrice: Number(chargeDraft.unitPrice),
      quantity: Number(chargeDraft.quantity),
      chargeDate: new Date().toISOString(),
    });

    const invoice = await generateInvoiceMutation.mutateAsync(reservation.id);
    setInvoicePreview((current) => ({ ...current, [reservation.id]: invoice }));
    setPaymentDrafts((current) => ({
      ...current,
      [reservation.id]: {
        ...(current[reservation.id] ?? {}),
        amount: String(invoice.balanceAmount),
        method: current[reservation.id]?.method ?? 'card',
        referenceNumber: current[reservation.id]?.referenceNumber ?? '',
        notes: current[reservation.id]?.notes ?? '',
      },
    }));
    setChargeDrafts((current) => ({
      ...current,
      [reservation.id]: {
        chargeType: chargeDraft.chargeType,
        description: '',
        unitPrice: '',
        quantity: '1',
      },
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Check-Out Desk" description="Settle folios, capture payments, and complete departures cleanly." />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Checked-in stays</p>
          <p className="text-3xl font-semibold text-[var(--primary)]">{reservations.length}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Invoice previews</p>
          <p className="text-3xl font-semibold text-[var(--primary)]">{Object.keys(invoicePreview).length}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Expanded folios</p>
          <p className="text-3xl font-semibold text-[var(--primary)]">{expandedReservationId ? 1 : 0}</p>
        </Card>
      </div>

      <div className="grid gap-4">
        {checkedInReservationsQuery.isLoading ? (
          Array.from({ length: 2 }).map((_, index) => <Card key={index} className="h-60 animate-pulse bg-white/70" />)
        ) : reservations.length > 0 ? (
          reservations.map((reservation) => {
            const chargeDraft = chargeDrafts[reservation.id] ?? {
              chargeType: 'food',
              description: '',
              unitPrice: '',
              quantity: '1',
            };
            const preview = invoicePreview[reservation.id];
            const paymentDraft = paymentDrafts[reservation.id] ?? {
              amount: preview ? String(preview.balanceAmount) : '',
              method: 'card',
              referenceNumber: '',
              notes: '',
            };

            return (
              <Card key={reservation.id} className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">{reservation.reservationCode}</p>
                    <h2 className="mt-2 text-2xl font-semibold text-[var(--primary)]">
                      {getDisplayName(reservation.guest, 'In-house guest')}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      Room {reservation.room?.roomNumber ?? 'Pending'} | {reservation.roomType?.name ?? 'Room type'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={() => handlePreviewInvoice(reservation, paymentDraft)}>
                      <Receipt className="mr-2 h-4 w-4" />
                      Invoice preview
                    </Button>
                    <Button variant="ghost" onClick={() => setExpandedReservationId((current) => (current === reservation.id ? null : reservation.id))}>
                      Manage folio
                    </Button>
                    {preview ? (
                      <Button variant="outline" onClick={() => handlePrintPreview(reservation, preview)}>
                        Print invoice
                      </Button>
                    ) : null}
                  </div>
                </div>

                {expandedReservationId === reservation.id ? (
                  <div className="grid gap-5 xl:grid-cols-[1.1fr,0.9fr]">
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                        <h3 className="text-lg font-semibold text-[var(--primary)]">Folio charges</h3>
                        <div className="mt-4 space-y-3">
                          {folioCharges.length > 0 ? (
                            folioCharges.map((charge) => (
                              <div key={charge.id} className="flex items-center justify-between rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-sm">
                                <div>
                                  <p className="font-medium text-[var(--foreground)]">{charge.description}</p>
                                  <p className="text-[var(--muted-foreground)] capitalize">{charge.chargeType}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-[var(--primary)]">{formatReceptionCurrency(charge.amount)}</span>
                                  {preview?.status !== 'paid' && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (!window.confirm('Remove this charge?')) return;
                                        try {
                                          await deleteChargeMutation.mutateAsync(charge.id);
                                          const invoice = await generateInvoiceMutation.mutateAsync(reservation.id);
                                          setInvoicePreview((current) => ({ ...current, [reservation.id]: invoice }));
                                          setPaymentDrafts((current) => ({
                                            ...current,
                                            [reservation.id]: {
                                              ...(current[reservation.id] ?? {}),
                                              amount: String(invoice.balanceAmount),
                                            },
                                          }));
                                        } catch {
                                          // Mutation hooks handle errors
                                        }
                                      }}
                                      className="p-1 text-red-500 hover:bg-black/5 rounded-full transition-colors"
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
                      <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                        <h3 className="text-lg font-semibold text-[var(--primary)]">Add charge</h3>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <select
                            className={receptionFieldClassName}
                            name={`chargeType-${reservation.id}`}
                            value={chargeDraft.chargeType}
                            onChange={(event) => setChargeDrafts((current) => ({ ...current, [reservation.id]: { ...chargeDraft, chargeType: event.target.value } }))}
                          >
                            {chargeTypeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <input
                            className={receptionFieldClassName}
                            name={`chargeDescription-${reservation.id}`}
                            value={chargeDraft.description}
                            onChange={(event) => setChargeDrafts((current) => ({ ...current, [reservation.id]: { ...chargeDraft, description: event.target.value } }))}
                            placeholder="Description"
                          />
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            className={receptionFieldClassName}
                            name={`chargeAmount-${reservation.id}`}
                            value={chargeDraft.unitPrice}
                            onChange={(event) => setChargeDrafts((current) => ({ ...current, [reservation.id]: { ...chargeDraft, unitPrice: event.target.value } }))}
                            placeholder="Unit price"
                          />
                          <input
                            type="number"
                            min={1}
                            step={1}
                            className={receptionFieldClassName}
                            name={`chargeQuantity-${reservation.id}`}
                            value={chargeDraft.quantity}
                            onChange={(event) => setChargeDrafts((current) => ({ ...current, [reservation.id]: { ...chargeDraft, quantity: event.target.value } }))}
                            placeholder="Quantity"
                          />
                        </div>
                        <div className="mt-4 flex justify-end">
                          <Button variant="outline" onClick={() => handleAddCharge(reservation, chargeDraft)} disabled={addChargeMutation.isPending}>
                            Add charge
                          </Button>
                        </div>
                      </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                        <h3 className="text-lg font-semibold text-[var(--primary)]">Invoice summary</h3>
                        {preview ? (
                          <div className="mt-4 space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-[var(--muted-foreground)]">Subtotal</span>
                              <span>{formatReceptionCurrency(preview.subtotal)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[var(--muted-foreground)]">Tax</span>
                              <span>{formatReceptionCurrency(preview.taxAmount)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[var(--muted-foreground)]">Paid</span>
                              <span>{formatReceptionCurrency(preview.paidAmount)}</span>
                            </div>
                            <div className="flex items-center justify-between text-base font-semibold text-[var(--primary)]">
                              <span>Balance</span>
                              <span>{formatReceptionCurrency(preview.balanceAmount)}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-4 text-sm text-[var(--muted-foreground)]">Generate an invoice to preview settlement details.</p>
                        )}
                      </div>

                      <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                        <h3 className="text-lg font-semibold text-[var(--primary)]">Payment collection</h3>
                        <div className="mt-4 grid gap-3">
                          <input
                            type="number"
                            className={receptionFieldClassName}
                            name={`paymentAmount-${reservation.id}`}
                            value={paymentDraft.amount}
                            onChange={(event) => setPaymentDrafts((current) => ({ ...current, [reservation.id]: { ...paymentDraft, amount: event.target.value } }))}
                            placeholder="Payment amount"
                          />
                          <select
                            className={receptionFieldClassName}
                            name={`paymentMethod-${reservation.id}`}
                            value={paymentDraft.method}
                            onChange={(event) => setPaymentDrafts((current) => ({ ...current, [reservation.id]: { ...paymentDraft, method: event.target.value } }))}
                          >
                            {paymentMethodOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <input
                            className={receptionFieldClassName}
                            name={`referenceNumber-${reservation.id}`}
                            value={paymentDraft.referenceNumber}
                            onChange={(event) => setPaymentDrafts((current) => ({ ...current, [reservation.id]: { ...paymentDraft, referenceNumber: event.target.value } }))}
                            placeholder="Reference number"
                          />
                          <textarea
                            rows={3}
                            className={receptionTextAreaClassName}
                            name={`checkoutNotes-${reservation.id}`}
                            value={paymentDraft.notes}
                            onChange={(event) => setPaymentDrafts((current) => ({ ...current, [reservation.id]: { ...paymentDraft, notes: event.target.value } }))}
                            placeholder="Checkout note"
                          />
                        </div>
                        <div className="mt-4 flex justify-end">
                          <Button
                            onClick={() => {
                              if (preview && paymentDraft.amount && Number(paymentDraft.amount) > 0) {
                                const validationMessage = validatePaymentForm(
                                  {
                                    invoiceId: preview.id,
                                    amount: Number(paymentDraft.amount),
                                    status: 'success',
                                  },
                                  preview,
                                );
                                if (validationMessage) {
                                  toast.error(validationMessage);
                                  return;
                                }
                              }

                              checkOutMutation.mutate(
                                {
                                  reservationId: reservation.id,
                                  notes: paymentDraft.notes,
                                  payment:
                                    paymentDraft.amount && Number(paymentDraft.amount) > 0
                                      ? {
                                          amount: Number(paymentDraft.amount),
                                          method: paymentDraft.method,
                                          referenceNumber: paymentDraft.referenceNumber,
                                          notes: paymentDraft.notes,
                                          status: 'success',
                                        }
                                      : undefined,
                                },
                                {
                                  onSuccess: () => {
                                    setExpandedReservationId(null);
                                  },
                                },
                              );
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
            <h2 className="text-xl font-semibold text-[var(--primary)]">No in-house stays to settle</h2>
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">Checked-in reservations will appear here for folio, invoice, and departure settlement.</p>
          </Card>
        )}
      </div>
    </div>
  );
};
