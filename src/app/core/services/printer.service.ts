import { Injectable } from '@angular/core';

/* =========================================================
   RECEIPT ITEM
========================================================= */

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

/* =========================================================
   RECEIPT DATA
========================================================= */

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

/* =========================================================
   PRINTER CONNECTION
========================================================= */

export type PrinterConnectionType = 'browser' | 'bluetooth';

/* =========================================================
   BLUETOOTH PRINTER
========================================================= */

export interface BluetoothPrinter {
  name: string;
  address: string;
  connected: boolean;
}

/* =========================================================
   PRINTER SETTINGS
========================================================= */

export interface PrinterSettings {
  printerName: string;

  printerAddress: string | null;

  connectionType: PrinterConnectionType;

  paperSize: '58mm' | '80mm';

  autoPrint: boolean;

  copies: number;
}

/* =========================================================
   PRINT MODE
========================================================= */

export type PrintMode = 'customer' | 'kitchen';

/* =========================================================
   ANDROID PRINTER BRIDGE
========================================================= */

interface AndroidPrinterBridge {
  isBluetoothEnabled?: () => boolean;

  scanPrinters?: () => Promise<BluetoothPrinter[]>;

  connectPrinter?: (address: string) => Promise<boolean>;

  disconnectPrinter?: () => Promise<void>;

  isConnected?: () => boolean;

  print?: (data: string, paperSize: '58mm' | '80mm') => Promise<boolean>;
}

/* =========================================================
   GLOBAL WINDOW
========================================================= */

declare global {
  interface Window {
    AndroidPrinter?: AndroidPrinterBridge;
  }
}

/* =========================================================
   SERVICE
========================================================= */

@Injectable({
  providedIn: 'root',
})
export class PrinterService {
  private readonly SETTINGS_KEY = 'kalye-silog-printer-settings';

  private readonly DEFAULT_SETTINGS: PrinterSettings = {
    printerName: 'Default Receipt Printer',

    printerAddress: null,

    connectionType: 'browser',

    paperSize: '58mm',

    autoPrint: true,

    copies: 1,
  };

  /* =======================================================
     RUNTIME BLUETOOTH STATE
  ======================================================= */

  private bluetoothConnected = false;

  private connectedPrinter: BluetoothPrinter | null = null;

  /* =======================================================
     GET SETTINGS
  ======================================================= */

  getSettings(): PrinterSettings {
    try {
      const raw = localStorage.getItem(this.SETTINGS_KEY);

      if (!raw) {
        return {
          ...this.DEFAULT_SETTINGS,
        };
      }

      const parsed = JSON.parse(raw) as Partial<PrinterSettings>;

      return {
        printerName:
          typeof parsed.printerName === 'string' && parsed.printerName.trim()
            ? parsed.printerName.trim()
            : this.DEFAULT_SETTINGS.printerName,

        printerAddress:
          typeof parsed.printerAddress === 'string' &&
          parsed.printerAddress.trim()
            ? parsed.printerAddress.trim()
            : null,

        connectionType:
          parsed.connectionType === 'bluetooth' ? 'bluetooth' : 'browser',

        paperSize: parsed.paperSize === '80mm' ? '80mm' : '58mm',

        autoPrint:
          typeof parsed.autoPrint === 'boolean'
            ? parsed.autoPrint
            : this.DEFAULT_SETTINGS.autoPrint,

        copies: this.normalizeCopies(parsed.copies),
      };
    } catch (error) {
      console.error('LOAD PRINTER SETTINGS ERROR:', error);

      return {
        ...this.DEFAULT_SETTINGS,
      };
    }
  }

  /* =======================================================
     SAVE SETTINGS
  ======================================================= */

  saveSettings(settings: PrinterSettings): void {
    const sanitized: PrinterSettings = {
      printerName:
        settings.printerName?.trim() || this.DEFAULT_SETTINGS.printerName,

      printerAddress: settings.printerAddress?.trim() || null,

      connectionType:
        settings.connectionType === 'bluetooth' ? 'bluetooth' : 'browser',

      paperSize: settings.paperSize === '80mm' ? '80mm' : '58mm',

      autoPrint:
        typeof settings.autoPrint === 'boolean' ? settings.autoPrint : true,

      copies: this.normalizeCopies(settings.copies),
    };

    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(sanitized));
  }

  /* =======================================================
     RESET
  ======================================================= */

  resetSettings(): void {
    localStorage.removeItem(this.SETTINGS_KEY);

    this.bluetoothConnected = false;

    this.connectedPrinter = null;
  }

  /* =======================================================
     AUTO PRINT
  ======================================================= */

  shouldAutoPrint(): boolean {
    return this.getSettings().autoPrint;
  }

  /* =======================================================
     PAPER SIZE
  ======================================================= */

  getPaperSize(): '58mm' | '80mm' {
    return this.getSettings().paperSize;
  }

  /* =======================================================
     COPIES
  ======================================================= */

  getCopies(): number {
    return this.getSettings().copies;
  }

  /* =======================================================
     PRINTER NAME
  ======================================================= */

  getPrinterName(): string {
    return this.getSettings().printerName;
  }

  /* =======================================================
     ENVIRONMENT
  ======================================================= */

  isAndroidApp(): boolean {
    return typeof window !== 'undefined' && !!window.AndroidPrinter;
  }

  isBrowserPrinter(): boolean {
    return !this.isAndroidApp();
  }

  getPrintingEnvironment(): 'android' | 'browser' {
    return this.isAndroidApp() ? 'android' : 'browser';
  }

  /* =======================================================
     CURRENT CONNECTION TYPE
  ======================================================= */

  isBluetoothPrinterMode(): boolean {
    return this.getSettings().connectionType === 'bluetooth';
  }

  isBrowserPrinterMode(): boolean {
    return this.getSettings().connectionType === 'browser';
  }

  /* =======================================================
     BLUETOOTH SUPPORTED
  ======================================================= */

  isBluetoothSupported(): boolean {
    if (!this.isAndroidApp()) {
      return false;
    }

    return typeof window.AndroidPrinter?.connectPrinter === 'function';
  }

  /* =======================================================
     BLUETOOTH ENABLED
  ======================================================= */

  isBluetoothEnabled(): boolean {
    if (!this.isAndroidApp()) {
      return false;
    }

    try {
      return window.AndroidPrinter?.isBluetoothEnabled?.() ?? true;
    } catch (error) {
      console.error('BLUETOOTH ENABLE CHECK ERROR:', error);

      return false;
    }
  }

  /* =======================================================
     SCAN
  ======================================================= */

  async scanBluetoothPrinters(): Promise<BluetoothPrinter[]> {
    if (!this.isAndroidApp()) {
      throw new Error(
        'Bluetooth printing is available only in the Android POS app.',
      );
    }

    if (typeof window.AndroidPrinter?.scanPrinters !== 'function') {
      throw new Error('Android Bluetooth printer bridge is not installed.');
    }

    try {
      const printers = await window.AndroidPrinter.scanPrinters();

      return Array.isArray(printers) ? printers : [];
    } catch (error) {
      console.error('SCAN BLUETOOTH PRINTERS ERROR:', error);

      throw new Error('Unable to scan Bluetooth printers.');
    }
  }

  /* =======================================================
     CONNECT BLUETOOTH
  ======================================================= */

  async connectBluetoothPrinter(printer: BluetoothPrinter): Promise<boolean> {
    if (!this.isAndroidApp()) {
      throw new Error('Bluetooth printing requires the Android POS app.');
    }

    if (typeof window.AndroidPrinter?.connectPrinter !== 'function') {
      throw new Error('Android Bluetooth printer bridge is not installed.');
    }

    try {
      const connected = await window.AndroidPrinter.connectPrinter(
        printer.address,
      );

      if (!connected) {
        this.bluetoothConnected = false;

        this.connectedPrinter = null;

        return false;
      }

      this.bluetoothConnected = true;

      this.connectedPrinter = {
        ...printer,
        connected: true,
      };

      const settings = this.getSettings();

      this.saveSettings({
        ...settings,

        printerName: printer.name || settings.printerName,

        printerAddress: printer.address,

        connectionType: 'bluetooth',
      });

      return true;
    } catch (error) {
      console.error('CONNECT BLUETOOTH PRINTER ERROR:', error);

      this.bluetoothConnected = false;

      this.connectedPrinter = null;

      throw new Error('Unable to connect to the Bluetooth printer.');
    }
  }

  /* =======================================================
     AUTO CONNECT
  ======================================================= */

  async autoConnectBluetooth(): Promise<boolean> {
    const settings = this.getSettings();

    /*
     * Browser mode should never attempt
     * Bluetooth connection.
     */
    if (settings.connectionType !== 'bluetooth') {
      return false;
    }

    /*
     * No saved printer.
     */
    if (!settings.printerAddress) {
      return false;
    }

    /*
     * Bluetooth requires Android bridge.
     */
    if (!this.isAndroidApp()) {
      return false;
    }

    if (typeof window.AndroidPrinter?.connectPrinter !== 'function') {
      return false;
    }

    try {
      const connected = await window.AndroidPrinter.connectPrinter(
        settings.printerAddress,
      );

      if (!connected) {
        this.bluetoothConnected = false;

        this.connectedPrinter = null;

        return false;
      }

      this.bluetoothConnected = true;

      this.connectedPrinter = {
        name: settings.printerName,

        address: settings.printerAddress,

        connected: true,
      };

      return true;
    } catch (error) {
      console.error('AUTO CONNECT BLUETOOTH ERROR:', error);

      this.bluetoothConnected = false;

      this.connectedPrinter = null;

      return false;
    }
  }

  /* =======================================================
     ENSURE BLUETOOTH CONNECTION
  ======================================================= */

  async ensureBluetoothConnection(): Promise<boolean> {
    if (!this.isBluetoothPrinterMode()) {
      return false;
    }

    if (!this.isAndroidApp()) {
      return false;
    }

    /*
     * First check the actual Android printer connection.
     * Do not reconnect if the printer is already connected.
     */
    try {
      if (typeof window.AndroidPrinter?.isConnected === 'function') {
        const connected = window.AndroidPrinter.isConnected();

        if (connected) {
          this.bluetoothConnected = true;

          return true;
        }
      }
    } catch (error) {
      console.error('CHECK BLUETOOTH CONNECTION ERROR:', error);
    }

    /*
     * If not connected, use the saved printer.
     */
    const settings = this.getSettings();

    if (!settings.printerAddress) {
      return false;
    }

    if (typeof window.AndroidPrinter?.connectPrinter !== 'function') {
      return false;
    }

    try {
      const connected = await window.AndroidPrinter.connectPrinter(
        settings.printerAddress,
      );

      if (!connected) {
        this.bluetoothConnected = false;
        this.connectedPrinter = null;

        return false;
      }

      this.bluetoothConnected = true;

      this.connectedPrinter = {
        name: settings.printerName,
        address: settings.printerAddress,
        connected: true,
      };

      return true;
    } catch (error) {
      console.error('ENSURE BLUETOOTH CONNECTION ERROR:', error);

      this.bluetoothConnected = false;
      this.connectedPrinter = null;

      return false;
    }
  }
  /* =======================================================
     DISCONNECT
  ======================================================= */

  async disconnectBluetoothPrinter(): Promise<void> {
    try {
      if (
        this.isAndroidApp() &&
        typeof window.AndroidPrinter?.disconnectPrinter === 'function'
      ) {
        await window.AndroidPrinter.disconnectPrinter();
      }
    } catch (error) {
      console.error('DISCONNECT BLUETOOTH ERROR:', error);
    }

    this.bluetoothConnected = false;

    this.connectedPrinter = null;
  }

  /* =======================================================
     CONNECTION STATUS
  ======================================================= */

  async isBluetoothPrinterConnected(): Promise<boolean> {
    if (!this.isAndroidApp()) {
      return false;
    }

    try {
      if (typeof window.AndroidPrinter?.isConnected === 'function') {
        const connected = window.AndroidPrinter.isConnected();

        this.bluetoothConnected = connected;

        if (!connected) {
          this.connectedPrinter = null;
        }

        return connected;
      }
    } catch (error) {
      console.error('BLUETOOTH STATUS ERROR:', error);
    }

    return this.bluetoothConnected;
  }

  /* =======================================================
     CONNECTED PRINTER
  ======================================================= */

  getConnectedPrinter(): BluetoothPrinter | null {
    return this.connectedPrinter;
  }

  /* =======================================================
     CUSTOMER RECEIPT
  ======================================================= */

  async printCustomerOrder(receipt: ReceiptData): Promise<void> {
    const settings = this.getSettings();

    if (settings.connectionType === 'bluetooth') {
      if (!this.isAndroidApp()) {
        throw new Error(
          'Bluetooth printing is not available in the browser. Use Browser Printer or open the Kalye Silog Android POS app.',
        );
      }

      await this.printBluetoothReceipt(receipt, 'customer');

      return;
    }

    await this.printReceiptDocument(receipt, 'customer');
  }

  /* =======================================================
     KITCHEN
  ======================================================= */

  async printKitchenOrder(receipt: ReceiptData): Promise<void> {
    const settings = this.getSettings();

    if (settings.connectionType === 'bluetooth') {
      if (!this.isAndroidApp()) {
        throw new Error(
          'Bluetooth printing is not available in the browser. Use Browser Printer or open the Kalye Silog Android POS app.',
        );
      }

      await this.printBluetoothReceipt(receipt, 'kitchen');

      return;
    }

    await this.printReceiptDocument(receipt, 'kitchen');
  }

  /* =======================================================
     GENERIC PRINT
  ======================================================= */

  async printReceipt(
    receipt: ReceiptData,
    mode: PrintMode = 'customer',
  ): Promise<void> {
    if (mode === 'kitchen') {
      await this.printKitchenOrder(receipt);

      return;
    }

    await this.printCustomerOrder(receipt);
  }

  /* =======================================================
     TEST PRINT
  ======================================================= */

  async testPrint(): Promise<void> {
    const testReceipt: ReceiptData = {
      orderId: 'TEST',

      orderType: 'Dine-in',

      customerName: 'Test Customer',

      tableNumber: '01',

      paymentMethod: 'Cash',

      items: [
        {
          name: 'Tapsilog',

          quantity: 1,

          price: 85,

          total: 85,
        },
        {
          name: 'Iced Tea',

          quantity: 1,

          price: 25,

          total: 25,
        },
      ],

      subtotal: 110,

      discount: 0,

      total: 110,

      cashReceived: 200,

      change: 90,

      storeName: 'KALYE SILOG & SIZZLING',

      storeAddress: 'San Jose, Occidental Mindoro',

      storeContact: '',
    };

    const settings = this.getSettings();

    if (settings.connectionType === 'bluetooth') {
      if (!this.isAndroidApp()) {
        throw new Error(
          'Bluetooth printing is not available in the browser. Use the Android POS app.',
        );
      }

      await this.printBluetoothReceipt(testReceipt, 'customer');

      return;
    }

    await this.printReceiptDocument(testReceipt, 'customer', false);
  }

  /* =======================================================
     BLUETOOTH PRINT
  ======================================================= */

  private async printBluetoothReceipt(
    receipt: ReceiptData,
    mode: PrintMode,
  ): Promise<void> {
    if (!this.isAndroidApp()) {
      throw new Error('Bluetooth printing requires the Android POS app.');
    }

    /*
     * Make sure the saved printer is connected.
     */
    const connected = await this.ensureBluetoothConnection();

    if (!connected) {
      throw new Error(
        'Bluetooth printer is unavailable. Please check that the printer is turned on and nearby.',
      );
    }

    if (typeof window.AndroidPrinter?.print !== 'function') {
      throw new Error('Android printer print bridge is not installed.');
    }

    const settings = this.getSettings();

    const receiptText =
      mode === 'kitchen'
        ? this.buildKitchenEscPos(receipt)
        : this.buildCustomerEscPos(receipt);

    const copies = this.normalizeCopies(settings.copies);

    for (let copy = 0; copy < copies; copy++) {
      const success = await window.AndroidPrinter.print(
        receiptText,
        settings.paperSize,
      );

      if (!success) {
        throw new Error('Bluetooth printer failed to print.');
      }

      if (copy < copies - 1) {
        await this.delay(400);
      }
    }
  }

  /* =======================================================
     CUSTOMER ESC/POS
  ======================================================= */

  private buildCustomerEscPos(receipt: ReceiptData): string {
    const storeName = receipt.storeName?.trim() || 'KALYE SILOG & SIZZLING';

    const address = receipt.storeAddress?.trim() || '';

    const customer = receipt.customerName?.trim() || 'Walk-in Customer';

    const table = receipt.tableNumber?.trim() || '';

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

    let output = '';

    output += '\x1B\x40';

    output += '\x1B\x61\x01';

    output += '\x1B\x45\x01';

    output += `${storeName}\n`;

    output += '\x1B\x45\x00';

    if (address) {
      output += `${address}\n`;
    }

    if (receipt.storeContact?.trim()) {
      output += `${receipt.storeContact.trim()}\n`;
    }

    output += '\n';

    output += '\x1B\x61\x00';

    output += '--------------------------------\n';

    output += `Order #: ${receipt.orderId}\n`;

    output += `Date: ${dateText}\n`;

    output += `Time: ${timeText}\n`;

    output += `Type: ${receipt.orderType}\n`;

    if (table) {
      output += `Table: ${table}\n`;
    }

    output += `Customer: ${customer}\n`;

    output += '--------------------------------\n';

    for (const item of receipt.items) {
      output += `${item.name}\n`;

      output +=
        `${item.quantity} x P${this.money(item.price)}` +
        `                 P${this.money(item.total)}\n`;
    }

    output += '--------------------------------\n';

    output += `Subtotal                 P${this.money(receipt.subtotal)}\n`;

    if (receipt.discount > 0) {
      output += `Discount                -P${this.money(receipt.discount)}\n`;
    }

    output += `TOTAL                    P${this.money(receipt.total)}\n`;

    output += '--------------------------------\n';

    output += `Payment: ${receipt.paymentMethod}\n`;

    if (receipt.paymentMethod === 'Cash') {
      output += `Cash                     P${this.money(receipt.cashReceived)}\n`;

      output += `Change                   P${this.money(receipt.change)}\n`;
    }

    output += '\n';

    output += '\x1B\x61\x01';

    output += '\x1B\x45\x01';

    output += 'THANK YOU!\n';

    output += '\x1B\x45\x00';

    output += 'Please come again.\n';

    output += '\n\n\n';

    output += '\x1D\x56\x00';

    return output;
  }

  /* =======================================================
     KITCHEN ESC/POS
  ======================================================= */

  private buildKitchenEscPos(receipt: ReceiptData): string {
    const customer = receipt.customerName?.trim() || 'Walk-in Customer';

    const table = receipt.tableNumber?.trim() || '';

    let output = '';

    output += '\x1B\x40';

    output += '\x1B\x61\x01';

    output += '\x1B\x45\x01';

    output += 'KITCHEN ORDER\n';

    output += '\x1B\x45\x00';

    output += '\n';

    output += '\x1B\x61\x00';

    output += '--------------------------------\n';

    output += '\x1B\x45\x01';

    output += `ORDER #${receipt.orderId}\n`;

    output += '\x1B\x45\x00';

    output += `Type: ${receipt.orderType}\n`;

    if (table) {
      output += `Table: ${table}\n`;
    }

    output += `Customer: ${customer}\n`;

    output += '--------------------------------\n';

    for (const item of receipt.items) {
      output += '\x1B\x45\x01';

      output += `${item.quantity} x\n`;

      output += `${item.name}\n`;

      output += '\x1B\x45\x00';

      output += '\n';
    }

    output += '--------------------------------\n';

    output += '\x1B\x61\x01';

    output += '\x1B\x45\x01';

    output += 'PREPARE ORDER\n';

    output += '\x1B\x45\x00';

    output += '\n\n\n';

    output += '\x1D\x56\x00';

    return output;
  }

  /* =======================================================
     BROWSER PRINT
  ======================================================= */

  private async printReceiptDocument(
    receipt: ReceiptData,
    mode: PrintMode,
    includeKitchenWithCustomer = true,
  ): Promise<void> {
    const settings = this.getSettings();

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

    const paperSize = settings.paperSize;

    let content = '';

    if (mode === 'customer') {
      content = this.buildCustomerReceiptHtml(receipt);

      if (includeKitchenWithCustomer) {
        content += this.buildKitchenOrderHtml(receipt);
      }
    } else {
      content = this.buildKitchenOrderHtml(receipt);
    }

    documentRef.open();

    documentRef.write(`
      <!DOCTYPE html>

      <html>

        <head>

          <meta charset="UTF-8">

          <title>
            Order #${this.escapeHtml(String(receipt.orderId))}
          </title>

          <style>

            @page {
              size: ${paperSize} auto;
              margin: 0;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              width: ${paperSize};
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

            .print-copy {
              width: ${paperSize};

              page-break-after:
                always;

              break-after:
                page;
            }

            .print-copy:last-child {
              page-break-after:
                auto;

              break-after:
                auto;
            }

            .receipt {
              width: ${paperSize};

              padding:
                4mm 3mm;
            }

            .center {
              text-align: center;
            }

            .store-name {
              font-size: 18px;

              font-weight: 800;

              margin-bottom: 2px;
            }

            .store-info {
              font-size: 9px;

              line-height: 1.3;
            }

            .divider {
              border-top:
                1px dashed #000;

              margin: 7px 0;
            }

            .order-info {
              font-size: 10px;
            }

            .info-row {
              display: flex;

              justify-content:
                space-between;

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
              margin-bottom: 6px;
            }

            .item-name {
              font-weight: 700;

              word-break:
                break-word;
            }

            .item-row {
              display: flex;

              justify-content:
                space-between;

              gap: 5px;
            }

            .item-price {
              white-space:
                nowrap;
            }

            .summary {
              margin-top: 4px;
            }

            .summary-row {
              display: flex;

              justify-content:
                space-between;

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

              justify-content:
                space-between;

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

            .kitchen {
              width: ${paperSize};

              padding:
                4mm 3mm;
            }

            .kitchen-title {
              text-align: center;

              font-size: 18px;

              font-weight: 900;

              margin-bottom: 8px;
            }

            .kitchen-order {
              font-size: 15px;

              font-weight: 900;
            }

            .kitchen-meta {
              font-size: 11px;

              margin-top: 5px;

              margin-bottom: 8px;
            }

            .kitchen-meta-row {
              margin-bottom: 2px;
            }

            .kitchen-item {
              margin-bottom: 9px;

              padding-bottom: 7px;

              border-bottom:
                1px dashed #000;
            }

            .kitchen-qty {
              font-size: 18px;

              font-weight: 900;
            }

            .kitchen-name {
              font-size: 16px;

              font-weight: 900;

              margin-top: 2px;

              word-break:
                break-word;
            }

            .kitchen-footer {
              text-align: center;

              margin-top: 10px;

              font-size: 10px;

              font-weight: 700;
            }

            @media print {

              html,
              body {
                width:
                  ${paperSize};
              }

              .print-copy {
                page-break-after:
                  always;
              }

              .print-copy:last-child {
                page-break-after:
                  auto;
              }

            }

          </style>

        </head>

        <body>

          ${content}

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

    await this.delay(200);

    const copies = this.normalizeCopies(settings.copies);

    for (let copy = 0; copy < copies; copy++) {
      printWindow.print();

      if (copy < copies - 1) {
        await this.delay(400);
      }
    }

    setTimeout(() => {
      iframe.remove();
    }, 1500);
  }

  /* =======================================================
     CUSTOMER HTML
  ======================================================= */

  private buildCustomerReceiptHtml(receipt: ReceiptData): string {
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
                  ${item.quantity}
                  ×
                  ₱${this.money(item.price)}
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
      <div class="print-copy">

        <div class="receipt">

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

          <div class="order-info">

            <div class="info-row">
              <span>Order #</span>

              <span>
                ${this.escapeHtml(String(receipt.orderId))}
              </span>
            </div>

            <div class="info-row">
              <span>Date</span>

              <span>
                ${dateText}
              </span>
            </div>

            <div class="info-row">
              <span>Time</span>

              <span>
                ${timeText}
              </span>
            </div>

            <div class="info-row">
              <span>Type</span>

              <span>
                ${this.escapeHtml(receipt.orderType)}
              </span>
            </div>

            ${
              tableNumber
                ? `
                  <div class="info-row">
                    <span>Table</span>

                    <span>
                      ${this.escapeHtml(tableNumber)}
                    </span>
                  </div>
                `
                : ''
            }

            <div class="info-row">
              <span>Customer</span>

              <span>
                ${this.escapeHtml(customerName)}
              </span>
            </div>

          </div>

          <div class="divider"></div>

          <div class="items">

            ${itemsHtml}

          </div>

          <div class="divider"></div>

          <div class="summary">

            <div class="summary-row">

              <span>
                Subtotal
              </span>

              <span>
                ₱${this.money(receipt.subtotal)}
              </span>

            </div>

            ${
              receipt.discount > 0
                ? `
                  <div class="summary-row">

                    <span>
                      Discount
                    </span>

                    <span>
                      -₱${this.money(receipt.discount)}
                    </span>

                  </div>
                `
                : ''
            }

            <div class="summary-row total">

              <span>
                TOTAL
              </span>

              <span>
                ₱${this.money(receipt.total)}
              </span>

            </div>

          </div>

          <div class="divider"></div>

          <div class="payment">

            <div class="payment-row">

              <span>
                Payment
              </span>

              <span>
                ${this.escapeHtml(receipt.paymentMethod)}
              </span>

            </div>

            ${
              receipt.paymentMethod === 'Cash'
                ? `
                  <div class="payment-row">

                    <span>
                      Cash
                    </span>

                    <span>
                      ₱${this.money(receipt.cashReceived)}
                    </span>

                  </div>

                  <div class="payment-row change">

                    <span>
                      Change
                    </span>

                    <span>
                      ₱${this.money(receipt.change)}
                    </span>

                  </div>
                `
                : ''
            }

          </div>

          <div class="divider"></div>

          <div class="footer">

            <div class="thank-you">
              THANK YOU!
            </div>

            <div>
              Please come again.
            </div>

          </div>

        </div>

      </div>
    `;
  }

  /* =======================================================
     KITCHEN HTML
  ======================================================= */

  private buildKitchenOrderHtml(receipt: ReceiptData): string {
    const customerName = receipt.customerName?.trim() || 'Walk-in Customer';

    const tableNumber = receipt.tableNumber?.trim() || '';

    const itemsHtml = receipt.items
      .map(
        (item) => `
            <div class="kitchen-item">

              <div class="kitchen-qty">
                ${item.quantity} ×
              </div>

              <div class="kitchen-name">
                ${this.escapeHtml(item.name)}
              </div>

            </div>
          `,
      )
      .join('');

    return `
      <div class="print-copy">

        <div class="kitchen">

          <div class="kitchen-title">
            KITCHEN ORDER
          </div>

          <div class="divider"></div>

          <div class="kitchen-order">
            ORDER #
            ${this.escapeHtml(String(receipt.orderId))}
          </div>

          <div class="kitchen-meta">

            <div class="kitchen-meta-row">

              Type:
              ${this.escapeHtml(receipt.orderType)}

            </div>

            ${
              tableNumber
                ? `
                  <div class="kitchen-meta-row">

                    Table:
                    ${this.escapeHtml(tableNumber)}

                  </div>
                `
                : ''
            }

            <div class="kitchen-meta-row">

              Customer:
              ${this.escapeHtml(customerName)}

            </div>

          </div>

          <div class="divider"></div>

          ${itemsHtml}

          <div class="kitchen-footer">
            PREPARE ORDER
          </div>

        </div>

      </div>
    `;
  }

  /* =======================================================
     WAIT
  ======================================================= */

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

  /* =======================================================
     COPIES
  ======================================================= */

  private normalizeCopies(value: unknown): number {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
      return 1;
    }

    return Math.min(3, Math.max(1, Math.floor(numberValue)));
  }

  /* =======================================================
     MONEY
  ======================================================= */

  private money(value: number): string {
    return Number(value || 0).toFixed(2);
  }

  /* =======================================================
     ESCAPE HTML
  ======================================================= */

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* =======================================================
     DELAY
  ======================================================= */

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
