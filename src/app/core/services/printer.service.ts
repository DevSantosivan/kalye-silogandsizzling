import { Injectable } from '@angular/core';

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ReceiptData {
  orderId: number | string;
  orderType: string;
  customerName?: string | null;
  tableNumber?: string | null;
  paymentMethod: string;

  items: ReceiptItem[];

  subtotal: number;
  discount: number;
  total: number;

  cashReceived: number;
  change: number;

  storeName?: string;
  storeAddress?: string;
  storeContact?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PrinterService {
  /**
   * Print a POS receipt.
   *
   * Browser:
   * Opens the browser/system print dialog.
   *
   * Android tablet:
   * The Android print system can be used to select
   * an available thermal/Bluetooth printer.
   */
  async printReceipt(receipt: ReceiptData): Promise<void> {
    const iframe = document.createElement('iframe');

    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';

    document.body.appendChild(iframe);

    const documentRef = iframe.contentDocument;

    if (!documentRef) {
      iframe.remove();
      throw new Error('Unable to create print document.');
    }

    documentRef.open();

    documentRef.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">

          <title>Receipt #${this.escapeHtml(String(receipt.orderId))}</title>

          <style>
            @page {
              size: 58mm auto;
              margin: 0;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              width: 58mm;
              background: #fff;
              color: #000;
            }

            body {
              font-family:
                Arial,
                Helvetica,
                sans-serif;

              font-size: 11px;
              line-height: 1.35;
            }

            .receipt {
              width: 58mm;
              padding: 4mm 3mm;
            }

            .center {
              text-align: center;
            }

            .store-name {
              font-size: 18px;
              font-weight: 800;
              letter-spacing: 0.3px;
              margin-bottom: 2px;
            }

            .store-info {
              font-size: 9px;
              line-height: 1.3;
            }

            .divider {
              border-top: 1px dashed #000;
              margin: 7px 0;
            }

            .order-info {
              font-size: 10px;
            }

            .info-row {
              display: flex;
              justify-content: space-between;
              gap: 8px;
              margin-bottom: 2px;
            }

            .info-row span:last-child {
              text-align: right;
            }

            .items {
              margin-top: 5px;
            }

            .item {
              margin-bottom: 5px;
            }

            .item-name {
              font-weight: 700;
              word-break: break-word;
            }

            .item-row {
              display: flex;
              justify-content: space-between;
              gap: 5px;
            }

            .item-price {
              white-space: nowrap;
            }

            .summary {
              margin-top: 4px;
            }

            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
            }

            .summary-row.total {
              font-size: 14px;
              font-weight: 800;
              margin-top: 4px;
            }

            .payment {
              margin-top: 5px;
            }

            .payment-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
            }

            .change {
              font-size: 13px;
              font-weight: 800;
            }

            .footer {
              text-align: center;
              margin-top: 10px;
              font-size: 9px;
            }

            .thank-you {
              font-weight: 700;
              font-size: 11px;
              margin-bottom: 3px;
            }
          </style>
        </head>

        <body>
          ${this.buildReceiptHtml(receipt)}
        </body>
      </html>
    `);

    documentRef.close();

    await this.waitForPrintDocument(iframe);

    const printWindow = iframe.contentWindow;

    if (!printWindow) {
      iframe.remove();
      throw new Error('Unable to access print window.');
    }

    printWindow.focus();

    // Small delay gives the browser time to finish
    // rendering the receipt before opening print.
    await this.delay(150);

    printWindow.print();

    // Give the browser time to process the print request
    // before removing the iframe.
    setTimeout(() => {
      iframe.remove();
    }, 1000);
  }

  /**
   * Build receipt HTML.
   */
  private buildReceiptHtml(receipt: ReceiptData): string {
    const storeName = receipt.storeName?.trim() || 'KALYE SILOG & SIZZLING';

    const storeAddress = receipt.storeAddress?.trim() || '';

    const storeContact = receipt.storeContact?.trim() || '';

    const customerName = receipt.customerName?.trim() || 'Walk-in Customer';

    const tableNumber = receipt.tableNumber?.trim() || '';

    const date = new Date();

    const dateText = date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const timeText = date.toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const itemsHtml = receipt.items
      .map(
        (item) => `
          <div class="item">

            <div class="item-name">
              ${this.escapeHtml(item.name)}
            </div>

            <div class="item-row">

              <span>
                ${item.quantity} × ₱${this.money(item.price)}
              </span>

              <span class="item-price">
                ₱${this.money(item.total)}
              </span>

            </div>

          </div>
        `,
      )
      .join('');

    return `
      <div class="receipt">

        <!-- STORE -->

        <div class="center">

          <div class="store-name">
            ${this.escapeHtml(storeName)}
          </div>

          ${
            storeAddress
              ? `
                <div class="store-info">
                  ${this.escapeHtml(storeAddress)}
                </div>
              `
              : ''
          }

          ${
            storeContact
              ? `
                <div class="store-info">
                  ${this.escapeHtml(storeContact)}
                </div>
              `
              : ''
          }

        </div>

        <div class="divider"></div>

        <!-- ORDER INFORMATION -->

        <div class="order-info">

          <div class="info-row">
            <span>Order #</span>
            <span>${this.escapeHtml(String(receipt.orderId))}</span>
          </div>

          <div class="info-row">
            <span>Date</span>
            <span>${dateText}</span>
          </div>

          <div class="info-row">
            <span>Time</span>
            <span>${timeText}</span>
          </div>

          <div class="info-row">
            <span>Type</span>
            <span>${this.escapeHtml(receipt.orderType)}</span>
          </div>

          ${
            tableNumber
              ? `
                <div class="info-row">
                  <span>Table</span>
                  <span>${this.escapeHtml(tableNumber)}</span>
                </div>
              `
              : ''
          }

          <div class="info-row">
            <span>Customer</span>
            <span>${this.escapeHtml(customerName)}</span>
          </div>

        </div>

        <div class="divider"></div>

        <!-- ITEMS -->

        <div class="items">
          ${itemsHtml}
        </div>

        <div class="divider"></div>

        <!-- TOTAL -->

        <div class="summary">

          <div class="summary-row">
            <span>Subtotal</span>
            <span>₱${this.money(receipt.subtotal)}</span>
          </div>

          ${
            receipt.discount > 0
              ? `
                <div class="summary-row">
                  <span>Discount</span>
                  <span>-₱${this.money(receipt.discount)}</span>
                </div>
              `
              : ''
          }

          <div class="summary-row total">
            <span>TOTAL</span>
            <span>₱${this.money(receipt.total)}</span>
          </div>

        </div>

        <div class="divider"></div>

        <!-- PAYMENT -->

        <div class="payment">

          <div class="payment-row">
            <span>Payment</span>
            <span>${this.escapeHtml(receipt.paymentMethod)}</span>
          </div>

          ${
            receipt.paymentMethod === 'Cash'
              ? `
                <div class="payment-row">
                  <span>Cash</span>
                  <span>₱${this.money(receipt.cashReceived)}</span>
                </div>

                <div class="payment-row change">
                  <span>Change</span>
                  <span>₱${this.money(receipt.change)}</span>
                </div>
              `
              : ''
          }

        </div>

        <div class="divider"></div>

        <!-- FOOTER -->

        <div class="footer">

          <div class="thank-you">
            THANK YOU!
          </div>

          <div>
            Please come again.
          </div>

        </div>

      </div>
    `;
  }

  /**
   * Wait until receipt document is rendered.
   */
  private async waitForPrintDocument(iframe: HTMLIFrameElement): Promise<void> {
    await new Promise<void>((resolve) => {
      const doc = iframe.contentDocument;

      if (!doc) {
        resolve();
        return;
      }

      if (doc.readyState === 'complete') {
        resolve();
        return;
      }

      iframe.onload = () => resolve();

      setTimeout(() => resolve(), 500);
    });
  }

  /**
   * Format money.
   */
  private money(value: number): string {
    return Number(value || 0).toFixed(2);
  }

  /**
   * Prevent HTML injection in receipt values.
   */
  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
