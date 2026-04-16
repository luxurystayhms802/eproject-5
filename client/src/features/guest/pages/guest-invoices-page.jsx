import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { guestApi } from '@/features/guest/api';
import { useGuestInvoices, useGuestPayments } from '@/features/guest/hooks';
import { printInvoiceDocument, printPaymentReceiptDocument } from '@/lib/print-documents';
const formatCurrency = (value) => `Rs ${value.toFixed(2)}`;
export const GuestInvoicesPage = () => {
    const [printingInvoiceId, setPrintingInvoiceId] = useState('');
    const invoicesQuery = useGuestInvoices();
    const paymentsQuery = useGuestPayments();
    const payments = paymentsQuery.data ?? [];

    const handlePrintInvoice = async (invoice) => {
        try {
            setPrintingInvoiceId(invoice.id);
            const charges = invoice.reservationId ? await guestApi.listFolioCharges(invoice.reservationId) : [];
            const invoicePayments = payments.filter((payment) => payment.invoiceId === invoice.id);

            printInvoiceDocument({
                brandLabel: 'LuxuryStay Guest',
                invoice,
                charges,
                payments: invoicePayments,
            });
        }
        catch {
            toast.error('Unable to prepare this invoice for downloading right now.');
        }
        finally {
            setPrintingInvoiceId('');
        }
    };

    const handlePrintReceipt = (payment) => {
        printPaymentReceiptDocument({
            brandLabel: 'LuxuryStay Guest',
            payment,
        });
    };

    return (<div className="space-y-6">
      <PageHeader title="My Invoices" description="Review billing totals, settlement status, and payment activity linked to your stays."/>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--primary)]">Invoices</h2>
          <div className="space-y-3">
            {(invoicesQuery.data ?? []).map((invoice) => (<div key={invoice.id} className="rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{invoice.invoiceNumber}</p>
                    <div className="mt-2">
                      <StatusBadge value={invoice.status}/>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--primary)]">{formatCurrency(invoice.totalAmount)}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">Balance {formatCurrency(invoice.balanceAmount)}</p>
                    <Button className="mt-2" variant="outline" onClick={() => handlePrintInvoice(invoice)} disabled={printingInvoiceId === invoice.id}>
                      {printingInvoiceId === invoice.id ? 'Preparing...' : 'Download invoice'}
                    </Button>
                  </div>
                </div>
              </div>))}
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--primary)]">Payments</h2>
          <div className="space-y-3">
            {(paymentsQuery.data ?? []).map((payment) => (<div key={payment.id} className="rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium capitalize text-[var(--foreground)]">{payment.method.replace('_', ' ')}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">{new Date(payment.paidAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--primary)]">{formatCurrency(payment.amount)}</p>
                    <p className="text-sm capitalize text-[var(--muted-foreground)]">{payment.status}</p>
                    <Button className="mt-2" variant="outline" onClick={() => handlePrintReceipt(payment)}>
                      Download receipt
                    </Button>
                  </div>
                </div>
              </div>))}
          </div>
        </Card>
      </div>
    </div>);
};
