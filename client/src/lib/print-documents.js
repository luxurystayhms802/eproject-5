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
    --ink: #111827;
    --ink-light: #374151;
    --muted: #6b7280;
    --border: #e5e7eb;
    --accent: #b88c4a;
    --accent-light: rgba(184, 140, 74, 0.08);
    --paper: #ffffff;
    --surface: #f9fafb;
  }

  * { box-sizing: border-box; }

  @page {
    size: A4;
    margin: 0mm;
  }

  body {
    margin: 0;
    padding: 0;
    background: #e2e8f0;
    color: var(--ink);
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .sheet {
    max-width: 210mm;
    margin: 40px auto;
    background: var(--paper);
    padding: 40px 50px;
    border-radius: 12px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    min-height: 297mm;
  }

  .header {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding-bottom: 30px;
    border-bottom: 2px solid var(--accent-light);
    margin-bottom: 30px;
  }

  .logo {
    height: 80px;
    max-width: 200px;
    object-fit: contain;
    margin-bottom: 16px;
  }

  .eyebrow {
    margin: 0 0 12px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--accent);
  }

  h1 {
    margin: 0 0 8px;
    font-size: 32px;
    font-weight: 400;
    color: var(--ink);
    font-family: "Georgia", serif;
  }

  .copy {
    margin: 0;
    color: var(--muted);
    font-size: 13px;
    line-height: 1.6;
    max-width: 400px;
  }

  .section {
    margin-bottom: 32px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
  }

  .info-group {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px 20px;
  }

  .info-group .label {
    margin: 0 0 6px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .info-group .value {
    margin: 0 0 4px;
    font-size: 16px;
    font-weight: 600;
    color: var(--ink);
  }

  .info-group .sub-value {
    margin: 0;
    font-size: 13px;
    color: var(--ink-light);
  }

  h2 {
    margin: 0 0 16px;
    font-size: 15px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--ink);
    border-bottom: 1px solid var(--border);
    padding-bottom: 12px;
  }

  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }

  th,
  td {
    padding: 12px 16px;
    text-align: left;
    font-size: 13px;
    line-height: 1.5;
  }

  th {
    background: var(--surface);
    color: var(--muted);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 600;
    border-bottom: 1px solid var(--border);
  }

  td {
    border-bottom: 1px solid var(--border);
    color: var(--ink-light);
  }

  tr:last-child td {
    border-bottom: none;
  }

  .totals-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 24px;
  }

  .totals-box {
    width: 320px;
    background: var(--surface);
    border: 1px solid var(--accent);
    border-radius: 8px;
    padding: 20px;
  }

  .totals-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 14px;
    color: var(--ink-light);
  }

  .totals-row.grand-total {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
    font-size: 18px;
    font-weight: 700;
    color: var(--ink);
  }

  .totals-row.balance {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed var(--accent);
    font-size: 16px;
    font-weight: 700;
    color: var(--accent);
  }

  .empty-state {
    padding: 24px;
    text-align: center;
    color: var(--muted);
    font-size: 13px;
    background: var(--surface);
    border-radius: 8px;
    border: 1px dashed var(--border);
  }

  .footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid var(--border);
    text-align: center;
    color: var(--muted);
    font-size: 11px;
    line-height: 1.6;
  }

  .stamp {
    position: absolute;
    top: 60px;
    right: 50px;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.2em;
    padding: 8px 16px;
    border: 2px solid;
    border-radius: 4px;
    transform: rotate(15deg);
    opacity: 0.7;
    text-transform: uppercase;
  }

  .stamp.paid { color: #16a34a; border-color: #16a34a; }
  .stamp.void { color: #dc2626; border-color: #dc2626; }

  @media print {
    body { background: white; padding: 0; }
    .sheet { 
      margin: 15mm auto !important; 
      box-shadow: none; 
      max-width: 100%; 
      border-radius: 0; 
      padding: 0 10mm; 
    }
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
    <div class="sheet" style="position: relative;">
      ${invoice?.status === 'paid' ? '<div class="stamp paid">PAID IN FULL</div>' : ''}
      ${invoice?.status === 'void' ? '<div class="stamp void">VOIDED</div>' : ''}
      
      <section class="header">
        <img src="/invoice.png" alt="Logo" class="logo" onerror="this.src='/favicon.svg'; this.onerror=null;" />
        <p class="eyebrow">${escapeHtml(brandLabel)}</p>
        <h1>${escapeHtml(brandName)}</h1>
        <p class="copy">Professional invoice generated from the LuxuryStay hospitality billing workflow.</p>
      </section>

      <section class="section">
        <div class="grid">
          <div class="info-group">
            <p class="label">Invoice number</p>
            <p class="value">${formatLabel(invoice?.invoiceNumber, 'Invoice pending')}</p>
            <p class="sub-value">Issued ${formatDate(invoice?.issuedAt)}</p>
          </div>
          <div class="info-group">
            <p class="label">Reservation Code</p>
            <p class="value">${formatLabel(reservationCode)}</p>
            <p class="sub-value">${formatLabel(roomLabel)}</p>
          </div>
          <div class="info-group" style="grid-column: span 2;">
            <p class="label">Guest Details</p>
            <p class="value">${escapeHtml(guestName)}</p>
            <p class="sub-value">${formatLabel(invoice?.guest?.email, 'No guest email')} • ${formatLabel(invoice?.guest?.phone, 'No phone number')}</p>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>Folio charges</h2>
        ${buildLineItemsTable(charges)}
      </section>

      ${payments.length > 0 ? `
      <section class="section">
        <h2>Payment movement</h2>
        ${buildPaymentsTable(payments)}
      </section>
      ` : ''}

      <section class="section">
        <div class="totals-container">
          <div class="totals-box">
            <div class="totals-row">
              <span>Subtotal</span>
              <span>${formatCurrency(invoice?.subtotal)}</span>
            </div>
            <div class="totals-row">
              <span>Taxes</span>
              <span>${formatCurrency(invoice?.taxAmount)}</span>
            </div>
            ${Number(invoice?.discountAmount) > 0 ? `
            <div class="totals-row" style="color: #16a34a;">
              <span>Discounts Applied</span>
              <span>-${formatCurrency(invoice?.discountAmount)}</span>
            </div>
            ` : ''}
            
            <div class="totals-row grand-total">
              <span>Total Amount</span>
              <span>${formatCurrency(invoice?.totalAmount)}</span>
            </div>
            <div class="totals-row" style="margin-top: 8px;">
              <span>Amount Paid</span>
              <span>${formatCurrency(invoice?.paidAmount)}</span>
            </div>
            <div class="totals-row balance">
              <span>Balance Due</span>
              <span>${formatCurrency(invoice?.balanceAmount)}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="footer">
        <p><strong>Invoice terms:</strong> ${escapeHtml(invoiceTerms || invoice?.notes || 'All payments are subject to LuxuryStay Hospitality billing policies.')}</p>
        <p style="margin-top: 8px;">Thank you for choosing ${escapeHtml(brandName)}. We hope to welcome you back soon.</p>
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
    <div class="sheet" style="max-width: 170mm; min-height: 0;">
      <section class="header" style="padding-bottom: 24px; margin-bottom: 24px;">
        <img src="/invoice.png" alt="Logo" class="logo" onerror="this.src='/favicon.svg'; this.onerror=null;" style="height: 60px;" />
        <p class="eyebrow">${escapeHtml(brandLabel)}</p>
        <h1 style="font-size: 26px;">Official Receipt</h1>
        <p class="copy" style="font-size: 12px;">Payment acknowledged from the LuxuryStay billing and settlement workflow.</p>
      </section>

      <section class="section">
        <div class="grid">
          <div class="info-group">
            <p class="label">Invoice Reference</p>
            <p class="value">${formatLabel(invoiceLabel)}</p>
            <p class="sub-value">${formatLabel(reservationCode)}</p>
          </div>
          <div class="info-group" style="background: var(--accent-light); border-color: var(--accent);">
            <p class="label" style="color: var(--accent);">Amount Paid</p>
            <p class="value" style="color: var(--ink); font-size: 22px;">${formatCurrency(payment?.amount)}</p>
            <p class="sub-value" style="color: var(--accent); font-weight: 600;">${formatLabel(payment?.status, 'pending').toUpperCase()}</p>
          </div>
          <div class="info-group">
            <p class="label">Received From</p>
            <p class="value">${escapeHtml(guestName)}</p>
            <p class="sub-value">${formatLabel(payment?.guest?.email, 'No guest email')}</p>
          </div>
          <div class="info-group">
            <p class="label">Processed By</p>
            <p class="value">${escapeHtml(receiverName)}</p>
            <p class="sub-value">${formatDate(payment?.paidAt)}</p>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>Transaction Details</h2>
        <table>
          <tbody>
            <tr><th style="width: 30%;">Payment Method</th><td><strong style="color: var(--ink);">${formatLabel(payment?.method, 'n/a').toUpperCase()}</strong></td></tr>
            <tr><th>Reference ID</th><td style="font-family: monospace; font-size: 14px;">${formatLabel(payment?.referenceNumber, 'No reference supplied')}</td></tr>
            <tr><th>Transaction Status</th><td>${formatLabel(payment?.status, 'n/a')}</td></tr>
            <tr><th>Date & Time</th><td>${formatDate(payment?.paidAt)}</td></tr>
            ${payment?.notes ? `<tr><th>Comments</th><td>${formatLabel(payment?.notes)}</td></tr>` : ''}
          </tbody>
        </table>
      </section>

      <section class="footer" style="margin-top: 24px; padding-top: 24px; display: flex; flex-direction: column; align-items: center;">
        <div style="margin-bottom: 24px; width: 200px; text-align: center; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
          <img src="/e-sign.png" alt="Authorized Signature" style="max-height: 50px; width: auto; display: block; margin: 0 auto 8px;" onerror="this.style.display='none'" />
          <p style="margin: 0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink);">Authorized Signature</p>
        </div>
        <p style="margin: 0; max-width: 80%;">This receipt reflects the recorded payment state at print time. Please retain this alongside the corresponding invoice for your records.</p>
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
              <div class="info-group">
                <p class="label">${formatLabel(metric.label)}</p>
                <p class="value">${formatLabel(metric.value)}</p>
                <p class="sub-value">${formatLabel(metric.helper, '')}</p>
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
                        <div class="info-group">
                          <p class="label">${formatLabel(row.label)}</p>
                          <p class="value">${formatLabel(row.value)}</p>
                          <p class="sub-value">${formatLabel(row.helper, '')}</p>
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
          <div class="info-group">
            <p class="label">Report title</p>
            <p class="value">${formatLabel(title)}</p>
            <p class="sub-value">Generated ${formatDate(new Date())}</p>
          </div>
          <div class="info-group">
            <p class="label">Reporting range</p>
            <p class="value">${formatLabel(rangeLabel)}</p>
            <p class="sub-value">Prepared for management oversight and review.</p>
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
