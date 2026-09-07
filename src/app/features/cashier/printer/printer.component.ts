import { Component, OnInit, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  BluetoothPrinter,
  PrinterConnectionType,
  PrinterService,
  PrinterSettings,
} from '../../../core/services/printer.service';

@Component({
  selector: 'app-printer',

  standalone: true,

  imports: [FormsModule],

  templateUrl: './printer.component.html',

  styleUrl: './printer.component.scss',
})
export class PrinterComponent implements OnInit {
  private printerService = inject(PrinterService);

  /* =======================================================
     UI STATE
  ======================================================= */

  testing = signal(false);

  saved = signal(false);

  errorMessage = signal('');

  scanning = signal(false);

  connecting = signal(false);

  disconnecting = signal(false);

  /* =======================================================
     BLUETOOTH STATE
  ======================================================= */

  bluetoothConnected = signal(false);

  bluetoothEnabled = signal(false);

  availablePrinters = signal<BluetoothPrinter[]>([]);

  /* =======================================================
     SETTINGS
  ======================================================= */

  printerName = 'Default Receipt Printer';

  printerAddress: string | null = null;

  connectionType: PrinterConnectionType = 'browser';

  paperSize: '58mm' | '80mm' = '58mm';

  autoPrint = true;

  copies = 1;

  /* =======================================================
     ANDROID
  ======================================================= */

  isAndroidApp = signal(false);

  /* =======================================================
     INIT
  ======================================================= */

  async ngOnInit(): Promise<void> {
    this.loadSettings();

    this.isAndroidApp.set(this.printerService.isAndroidApp());

    if (this.connectionType === 'bluetooth') {
      await this.initializeBluetooth();
    }
  }

  /* =======================================================
     LOAD SETTINGS
  ======================================================= */

  private loadSettings(): void {
    const settings = this.printerService.getSettings();

    this.applySettings(settings);
  }

  /* =======================================================
     APPLY SETTINGS
  ======================================================= */

  private applySettings(settings: PrinterSettings): void {
    this.printerName = settings.printerName;

    this.printerAddress = settings.printerAddress;

    this.connectionType = settings.connectionType;

    this.paperSize = settings.paperSize;

    this.autoPrint = settings.autoPrint;

    this.copies = settings.copies;
  }

  /* =======================================================
     INITIALIZE BLUETOOTH
  ======================================================= */

  private async initializeBluetooth(): Promise<void> {
    if (!this.printerService.isAndroidApp()) {
      return;
    }

    this.bluetoothEnabled.set(this.printerService.isBluetoothEnabled());

    if (!this.bluetoothEnabled()) {
      return;
    }

    /*
     * IMPORTANT:
     *
     * If there is already a saved printer,
     * try to reconnect automatically.
     */
    if (this.printerAddress) {
      const connected = await this.printerService.autoConnectBluetooth();

      this.bluetoothConnected.set(connected);
    }
  }

  /* =======================================================
     CONNECTION TYPE
  ======================================================= */

  async setConnectionType(type: PrinterConnectionType): Promise<void> {
    this.connectionType = type;

    this.errorMessage.set('');

    if (type === 'browser') {
      await this.printerService.disconnectBluetoothPrinter();

      this.bluetoothConnected.set(false);

      this.printerAddress = null;

      return;
    }

    this.bluetoothEnabled.set(this.printerService.isBluetoothEnabled());

    /*
     * Automatically attempt to reconnect
     * to the saved printer.
     */
    if (this.printerAddress && this.isAndroidApp()) {
      const connected = await this.printerService.autoConnectBluetooth();

      this.bluetoothConnected.set(connected);
    }
  }

  /* =======================================================
     SCAN
  ======================================================= */

  async scanPrinters(): Promise<void> {
    if (this.scanning()) {
      return;
    }

    this.errorMessage.set('');

    if (!this.isAndroidApp()) {
      this.errorMessage.set(
        'Bluetooth printer scanning is available in the Android POS app.',
      );

      return;
    }

    if (!this.printerService.isBluetoothSupported()) {
      this.errorMessage.set(
        'Bluetooth printer support is not installed in this Android build yet.',
      );

      return;
    }

    if (!this.printerService.isBluetoothEnabled()) {
      this.bluetoothEnabled.set(false);

      this.errorMessage.set('Please turn on Bluetooth on the tablet.');

      return;
    }

    this.scanning.set(true);

    try {
      const printers = await this.printerService.scanBluetoothPrinters();

      this.availablePrinters.set(printers);
    } catch (error: any) {
      console.error('SCAN PRINTER ERROR:', error);

      this.errorMessage.set(
        error?.message || 'Unable to find Bluetooth printers.',
      );
    } finally {
      this.scanning.set(false);
    }
  }

  /* =======================================================
     CONNECT
  ======================================================= */

  async connectPrinter(printer: BluetoothPrinter): Promise<void> {
    if (this.connecting()) {
      return;
    }

    this.connecting.set(true);

    this.errorMessage.set('');

    try {
      const connected =
        await this.printerService.connectBluetoothPrinter(printer);

      if (!connected) {
        this.bluetoothConnected.set(false);

        this.errorMessage.set('Unable to connect to the selected printer.');

        return;
      }

      this.printerName = printer.name;

      this.printerAddress = printer.address;

      this.connectionType = 'bluetooth';

      this.bluetoothConnected.set(true);

      this.availablePrinters.update((printers) =>
        printers.map((item) => ({
          ...item,

          connected: item.address === printer.address,
        })),
      );

      this.saveSettings();
    } catch (error: any) {
      console.error('CONNECT PRINTER ERROR:', error);

      this.bluetoothConnected.set(false);

      this.errorMessage.set(error?.message || 'Unable to connect to printer.');
    } finally {
      this.connecting.set(false);
    }
  }

  /* =======================================================
     DISCONNECT
  ======================================================= */

  async disconnectPrinter(): Promise<void> {
    if (this.disconnecting()) {
      return;
    }

    this.disconnecting.set(true);

    try {
      await this.printerService.disconnectBluetoothPrinter();

      this.bluetoothConnected.set(false);
    } catch (error) {
      console.error('DISCONNECT PRINTER ERROR:', error);
    } finally {
      this.disconnecting.set(false);
    }
  }

  /* =======================================================
     SAVE
  ======================================================= */

  saveSettings(): void {
    const settings: PrinterSettings = {
      printerName: this.printerName.trim() || 'Default Receipt Printer',

      printerAddress: this.printerAddress?.trim() || null,

      connectionType: this.connectionType,

      paperSize: this.paperSize,

      autoPrint: this.autoPrint,

      copies: this.normalizeCopies(this.copies),
    };

    this.applySettings(settings);

    try {
      this.printerService.saveSettings(settings);

      this.saved.set(true);

      this.errorMessage.set('');

      setTimeout(() => {
        this.saved.set(false);
      }, 2000);
    } catch (error) {
      console.error('SAVE PRINTER SETTINGS ERROR:', error);

      this.errorMessage.set('Unable to save printer settings.');
    }
  }

  /* =======================================================
     TEST PRINT
  ======================================================= */

  async testPrint(): Promise<void> {
    if (this.testing()) {
      return;
    }

    /*
     * Save current configuration
     * before testing.
     */
    this.saveSettings();

    this.testing.set(true);

    this.errorMessage.set('');

    try {
      await this.printerService.testPrint();
    } catch (error: any) {
      console.error('TEST PRINT ERROR:', error);

      this.errorMessage.set(error?.message || 'Unable to print test receipt.');
    } finally {
      this.testing.set(false);
    }
  }

  /* =======================================================
     RESET
  ======================================================= */

  resetSettings(): void {
    this.printerService.resetSettings();

    const defaults = this.printerService.getSettings();

    this.applySettings(defaults);

    this.bluetoothConnected.set(false);

    this.availablePrinters.set([]);

    this.saved.set(false);

    this.errorMessage.set('');
  }

  /* =======================================================
     COPIES
  ======================================================= */

  decreaseCopies(): void {
    if (this.copies > 1) {
      this.copies--;
    }
  }

  increaseCopies(): void {
    if (this.copies < 3) {
      this.copies++;
    }
  }

  /* =======================================================
     NORMALIZE
  ======================================================= */

  private normalizeCopies(value: unknown): number {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
      return 1;
    }

    return Math.min(3, Math.max(1, Math.floor(numberValue)));
  }
}
