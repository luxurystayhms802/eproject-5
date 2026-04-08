const currencyFormatter = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  minimumFractionDigits: 2,
});

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatCurrency = (value) => currencyFormatter.format(Number(value ?? 0));

const formatDate = (value) => {
  if (!value) {
    return 'n/a';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'n/a';
  }

  return parsed.toLocaleString();
};

const formatLabel = (value, fallback = 'n/a') => escapeHtml(value || fallback);

const getGuestName = (value) =>
  value?.fullName
  || [value?.firstName, value?.lastName].filter(Boolean).join(' ').trim()
  || value?.email
  || 'Guest record';

const getReceiverName = (value) =>
  value?.fullName
  || [value?.firstName, value?.lastName].filter(Boolean).join(' ').trim()
  || value?.email
  || 'Hotel desk';

const buildLineItemsTable = (charges = []) => {
  if (!charges.length) {
    return `
      <div class="empty-state">No additional folio charges were recorded for this document.</div>
    `;
  }

  return `
    <table>
      <thead>
        <tr>
          <th>Charge type</th>
          <th>Description</th>
          <th>Date</th>
          <th>Qty</th>
          <th>Unit price</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${charges
          .map(
            (charge) => `
              <tr>
                <td>${formatLabel(charge.chargeType)}</td>
                <td>${formatLabel(charge.description)}</td>
                <td>${formatDate(charge.chargeDate)}</td>
                <td>${escapeHtml(charge.quantity ?? 0)}</td>
                <td>${formatCurrency(charge.unitPrice)}</td>
                <td>${formatCurrency(charge.amount)}</td>
              </tr>
            `,
          )
          .join('')}
      </tbody>
    </table>
  `;
};

const buildPaymentsTable = (payments = []) => {
  if (!payments.length) {
    return `
      <div class="empty-state">No payment activity has been recorded for this document yet.</div>
    `;
  }

  return `
    <table>
      <thead>
        <tr>
          <th>Status</th>
          <th>Method</th>
          <th>Paid at</th>
          <th>Reference</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${payments
          .map(
            (payment) => `
              <tr>
                <td>${formatLabel(payment.status)}</td>
                <td>${formatLabel(payment.method)}</td>
                <td>${formatDate(payment.paidAt)}</td>
                <td>${formatLabel(payment.referenceNumber, 'n/a')}</td>
                <td>${formatCurrency(payment.amount)}</td>
              </tr>
            `,
          )
          .join('')}
      </tbody>
    </table>
  `;
};

const baseStyles = `
  :root {
    color-scheme: light;
    --ink: #10243f;
    --muted: #5d6b7e;
    --line: #d9e2ec;
    --accent: #b88c4a;
    --paper: #fffdf9;
    --soft: #f6efe3;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    padding: 32px;
    background: var(--paper);
    color: var(--ink);
    font-family: Georgia, "Times New Roman", serif;
  }

  .sheet {
    max-width: 980px;
    margin: 0 auto;
    border: 1px solid var(--line);
    border-radius: 24px;
    overflow: hidden;
    background: white;
  }

  .header {
    padding: 28px 32px 20px;
    border-bottom: 1px solid var(--line);
    background: linear-gradient(135deg, #ffffff 0%, var(--soft) 100%);
  }

  .eyebrow {
    margin: 0 0 10px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--accent);
    font-family: Arial, sans-serif;
  }

  h1 {
    margin: 0;
    font-size: 38px;
    line-height: 1.08;
    font-weight: 600;
  }

  .copy {
    margin: 12px 0 0;
    color: var(--muted);
    font-family: Arial, sans-serif;
    font-size: 14px;
    line-height: 1.7;
  }

  .section {
    padding: 24px 32px;
    border-bottom: 1px solid var(--line);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .card {
    border: 1px solid var(--line);
    border-radius: 18px;
    padding: 16px 18px;
    background: #ffffff;
  }

  .card-label {
    margin: 0;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--muted);
    font-family: Arial, sans-serif;
  }

  .card-value {
    margin: 10px 0 0;
    font-size: 22px;
    font-weight: 600;
  }

  .card-copy {
    margin: 8px 0 0;
    color: var(--muted);
    font-family: Arial, sans-serif;
    font-size: 13px;
    line-height: 1.6;
  }

  h2 {
    margin: 0 0 14px;
    font-size: 22px;
    font-weight: 600;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-family: Arial, sans-serif;
  }

  th,
  td {
    border: 1px solid var(--line);
    padding: 12px 14px;
    text-align: left;
    vertical-align: top;
    font-size: 13px;
    line-height: 1.6;
  }

  th {
    background: #f8fafc;
    color: var(--muted);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
  }

  .totals {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  .empty-state {
    border: 1px dashed var(--line);
    border-radius: 16px;
    padding: 18px;
    color: var(--muted);
    font-family: Arial, sans-serif;
    font-size: 13px;
    line-height: 1.7;
    background: #fbfdff;
  }

  .footer {
    padding: 18px 32px 28px;
    color: var(--muted);
    font-family: Arial, sans-serif;
    font-size: 12px;
    line-height: 1.8;
  }

  @media print {
    body { padding: 0; background: white; }
    .sheet { border: 0; border-radius: 0; }
  }
`;

const openPrintWindow = (title, bodyHtml) => {
  const printWindow = window.open('', '_blank', 'width=1080,height=920');

  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(title)}</title>
        <style>${baseStyles}</style>
      </head>
      <body>${bodyHtml}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => {
    printWindow.print();
  };
};

export const printInvoiceDocument = ({
  brandName = 'LuxuryStay Hospitality',
  brandLabel = 'LuxuryStay Admin',
  invoice,
  charges = [],
  payments = [],
  invoiceTerms = '',
}) => {
  const guestName = getGuestName(invoice?.guest);
  const reservationCode = invoice?.reservation?.reservationCode ?? invoice?.reservationCode ?? 'Reservation pending';
  const roomLabel = invoice?.reservation?.roomType?.name ?? invoice?.reservation?.roomTypeSnapshot?.name ?? 'Hotel stay';

  const bodyHtml = `
    <div class="sheet">
      <section class="header">
        <p class="eyebrow">${escapeHtml(brandLabel)}</p>
        <h1>${escapeHtml(brandName)}</h1>
        <p class="copy">Professional invoice generated from the LuxuryStay hospitality billing workflow.</p>
      </section>

      <section class="section">
        <div class="grid">
          <div class="card">
            <p class="card-label">Invoice number</p>
            <p class="card-value">${formatLabel(invoice?.invoiceNumber, 'Invoice pending')}</p>
            <p class="card-copy">Issued ${formatDate(invoice?.issuedAt)}</p>
          </div>
          <div class="card">
            <p class="card-label">Status</p>
            <p class="card-value">${formatLabel(invoice?.status, 'draft')}</p>
            <p class="card-copy">Balance due ${formatCurrency(invoice?.balanceAmount)}</p>
          </div>
          <div class="card">
            <p class="card-label">Guest</p>
            <p class="card-value">${escapeHtml(guestName)}</p>
            <p class="card-copy">${formatLabel(invoice?.guest?.email, 'No guest email')}</p>
          </div>
          <div class="card">
            <p class="card-label">Reservation</p>
            <p class="card-value">${formatLabel(reservationCode)}</p>
            <p class="card-copy">${formatLabel(roomLabel)}</p>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>Folio charges</h2>
        ${buildLineItemsTable(charges)}
      </section>

      <section class="section">
        <h2>Payment movement</h2>
        ${buildPaymentsTable(payments)}
      </section>

      <section class="section">
        <h2>Invoice totals</h2>
        <div class="totals">
          <div class="card">
            <p class="card-label">Subtotal</p>
            <p class="card-value">${formatCurrency(invoice?.subtotal)}</p>
          </div>
          <div class="card">
            <p class="card-label">Tax</p>
            <p class="card-value">${formatCurrency(invoice?.taxAmount)}</p>
          </div>
          <div class="card">
            <p class="card-label">Discount</p>
            <p class="card-value">${formatCurrency(invoice?.discountAmount)}</p>
          </div>
          <div class="card">
            <p class="card-label">Total due</p>
            <p class="card-value">${formatCurrency(invoice?.totalAmount)}</p>
            <p class="card-copy">Paid ${formatCurrency(invoice?.paidAmount)} | Balance ${formatCurrency(invoice?.balanceAmount)}</p>
          </div>
        </div>
      </section>

      <section class="footer">
        <strong>Invoice terms:</strong> ${escapeHtml(invoiceTerms || invoice?.notes || 'All payments are subject to LuxuryStay Hospitality billing policies and operational review.')}
      </section>
    </div>
  `;

  openPrintWindow(`${brandName} Invoice`, bodyHtml);
};

export const printPaymentReceiptDocument = ({
  brandName = 'LuxuryStay Hospitality',
  brandLabel = 'LuxuryStay Finance',
  payment,
}) => {
  const invoiceLabel = payment?.invoice?.invoiceNumber ?? 'Invoice pending';
  const reservationCode = payment?.reservation?.reservationCode ?? 'Reservation pending';
  const guestName = getGuestName(payment?.guest);
  const receiverName = getReceiverName(payment?.receivedBy);

  const bodyHtml = `
    <div class="sheet">
      <section class="header">
        <p class="eyebrow">${escapeHtml(brandLabel)}</p>
        <h1>${escapeHtml(brandName)}</h1>
        <p class="copy">Payment receipt issued from the LuxuryStay billing and settlement workflow.</p>
      </section>

      <section class="section">
        <div class="grid">
          <div class="card">
            <p class="card-label">Invoice</p>
            <p class="card-value">${formatLabel(invoiceLabel)}</p>
            <p class="card-copy">${formatLabel(reservationCode)}</p>
          </div>
          <div class="card">
            <p class="card-label">Payment amount</p>
            <p class="card-value">${formatCurrency(payment?.amount)}</p>
            <p class="card-copy">${formatLabel(payment?.status, 'pending')} via ${formatLabel(payment?.method, 'payment')}</p>
          </div>
          <div class="card">
            <p class="card-label">Guest</p>
            <p class="card-value">${escapeHtml(guestName)}</p>
            <p class="card-copy">${formatLabel(payment?.guest?.email, 'No guest email')}</p>
          </div>
          <div class="card">
            <p class="card-label">Received by</p>
            <p class="card-value">${escapeHtml(receiverName)}</p>
            <p class="card-copy">${formatDate(payment?.paidAt)}</p>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>Receipt details</h2>
        <table>
          <tbody>
            <tr><th>Reference</th><td>${formatLabel(payment?.referenceNumber, 'No payment reference supplied')}</td></tr>
            <tr><th>Method</th><td>${formatLabel(payment?.method, 'n/a')}</td></tr>
            <tr><th>Status</th><td>${formatLabel(payment?.status, 'n/a')}</td></tr>
            <tr><th>Paid at</th><td>${formatDate(payment?.paidAt)}</td></tr>
            <tr><th>Notes</th><td>${formatLabel(payment?.notes, 'No payment notes recorded')}</td></tr>
          </tbody>
        </table>
      </section>

      <section class="footer">
        This receipt reflects the recorded payment state at print time and should be retained alongside the corresponding invoice for audit and guest-service reference.
      </section>
    </div>
  `;

  openPrintWindow(`${brandName} Payment Receipt`, bodyHtml);
};

const buildMetricCards = (metrics = []) =>
  metrics.length
    ? `
      <div class="grid">
        ${metrics
          .map(
            (metric) => `
              <div class="card">
                <p class="card-label">${formatLabel(metric.label)}</p>
                <p class="card-value">${formatLabel(metric.value)}</p>
                <p class="card-copy">${formatLabel(metric.helper, '')}</p>
              </div>
            `,
          )
          .join('')}
      </div>
    `
    : '<div class="empty-state">No metrics were supplied for this report.</div>';

const buildSummarySections = (sections = []) =>
  sections
    .map(
      (section) => `
        <section class="section">
          <h2>${formatLabel(section.title)}</h2>
          ${
            section.copy
              ? `<p class="copy" style="margin:0 0 14px">${formatLabel(section.copy, '')}</p>`
              : ''
          }
          ${
            section.rows?.length
              ? `
                <div class="grid">
                  ${section.rows
                    .map(
                      (row) => `
                        <div class="card">
                          <p class="card-label">${formatLabel(row.label)}</p>
                          <p class="card-value">${formatLabel(row.value)}</p>
                          <p class="card-copy">${formatLabel(row.helper, '')}</p>
                        </div>
                      `,
                    )
                    .join('')}
                </div>
              `
              : '<div class="empty-state">No section details are available.</div>'
          }
        </section>
      `,
    )
    .join('');

export const printManagementReportDocument = ({
  brandName = 'LuxuryStay Hospitality',
  brandLabel = 'LuxuryStay Management',
  title = 'Management report',
  subtitle = 'Operational oversight snapshot',
  rangeLabel = 'Current reporting window',
  metrics = [],
  sections = [],
}) => {
  const bodyHtml = `
    <div class="sheet">
      <section class="header">
        <p class="eyebrow">${escapeHtml(brandLabel)}</p>
        <h1>${escapeHtml(brandName)}</h1>
        <p class="copy">${escapeHtml(subtitle)}</p>
      </section>

      <section class="section">
        <div class="grid">
          <div class="card">
            <p class="card-label">Report title</p>
            <p class="card-value">${formatLabel(title)}</p>
            <p class="card-copy">Generated ${formatDate(new Date())}</p>
          </div>
          <div class="card">
            <p class="card-label">Reporting range</p>
            <p class="card-value">${formatLabel(rangeLabel)}</p>
            <p class="card-copy">Prepared for management oversight and review.</p>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>Summary metrics</h2>
        ${buildMetricCards(metrics)}
      </section>

      ${buildSummarySections(sections)}

      <section class="footer">
        This management report was prepared from the live LuxuryStay Hospitality reporting layer and is intended for operational oversight, review, and presentation use.
      </section>
    </div>
  `;

  openPrintWindow(`${brandName} ${title}`, bodyHtml);
};
