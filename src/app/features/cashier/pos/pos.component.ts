import {
  Component,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { MenuItem } from '../../../core/models/menu.model';
import { MenuService } from '../../../core/services/admin/menu.service';

import { OrderType, PaymentMethod } from '../../../core/models/order.model';

import { OrderService } from '../../../core/services/order.service';

import {
  PrinterService,
  ReceiptData,
} from '../../../core/services/printer.service';

import Swal from 'sweetalert2';

interface CartItem {
  menu: MenuItem;
  quantity: number;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.scss',
})
export class PosComponent implements OnInit {
  private menuService = inject(MenuService);
  private orderService = inject(OrderService);

  // =========================================================
  // PRINTER
  // =========================================================

  private printerService = inject(PrinterService);

  // =========================================================
  // STATE
  // =========================================================

  menus = signal<MenuItem[]>([]);
  cart = signal<CartItem[]>([]);

  selectedCategory = signal<string>('All');
  searchTerm = signal<string>('');

  loading = signal<boolean>(true);
  errorMessage = signal<string>('');

  isFullscreen = false;
  bestSellerIds = signal<Set<number>>(new Set());

  // =========================================================
  // ORDER MODAL
  // =========================================================

  showOrderModal = signal<boolean>(false);

  orderType = signal<OrderType>('Dine-in');

  customerName = signal<string>('');
  customerContact = signal<string>('');
  tableNumber = signal<string>('');

  paymentMethod = signal<PaymentMethod>('Cash');

  cashReceived = signal<number>(0);

  processingOrder = signal<boolean>(false);

  // =========================================================
  // DISCOUNT
  // =========================================================

  discount = signal<number>(0);

  isBestSeller(menu: MenuItem): boolean {
    return this.bestSellerIds().has(menu.id);
  }

  // =========================================================
  // CATEGORIES
  // =========================================================

  categories = computed(() => {
    const categories = this.menus()
      .map((menu) => menu.category)
      .filter((category): category is string => !!category);

    return ['All', ...new Set(categories)];
  });

  filteredMenus = computed(() => {
    const category = this.selectedCategory();
    const search = this.searchTerm().trim().toLowerCase();
    const bestSellerIds = this.bestSellerIds();

    return this.menus()
      .filter((menu) => {
        const categoryMatch = category === 'All' || menu.category === category;

        const searchMatch =
          !search ||
          menu.name.toLowerCase().includes(search) ||
          menu.category?.toLowerCase().includes(search);

        return categoryMatch && searchMatch && menu.available;
      })
      .sort((a, b) => {
        const aBestSeller = bestSellerIds.has(a.id);
        const bBestSeller = bestSellerIds.has(b.id);

        // Best sellers first
        if (aBestSeller && !bBestSeller) {
          return -1;
        }

        if (!aBestSeller && bBestSeller) {
          return 1;
        }

        // Within best sellers, highest sold first
        if (aBestSeller && bBestSeller) {
          return Number(b.sold) - Number(a.sold);
        }

        return 0;
      });
  });
  // =========================================================
  // CART TOTALS
  // =========================================================

  itemCount = computed(() => {
    return this.cart().reduce((total, item) => total + item.quantity, 0);
  });

  subtotal = computed(() => {
    return this.cart().reduce(
      (total, item) => total + Number(item.menu.price) * item.quantity,
      0,
    );
  });

  total = computed(() => {
    return Math.max(0, this.subtotal() - this.discount());
  });

  change = computed(() => {
    if (this.paymentMethod() !== 'Cash') {
      return 0;
    }

    return Math.max(0, this.cashReceived() - this.total());
  });

  cashIsEnough = computed(() => {
    if (this.paymentMethod() !== 'Cash') {
      return true;
    }

    return this.cashReceived() >= this.total();
  });

  // =========================================================
  // INIT
  // =========================================================

  async ngOnInit(): Promise<void> {
    await this.loadMenus();
  }

  // =========================================================
  // FULL VIEW
  // =========================================================

  // =========================================================
  // FULLSCREEN
  // =========================================================

  async toggleFullscreen(): Promise<void> {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        this.isFullscreen = true;
      } else {
        await document.exitFullscreen();
        this.isFullscreen = false;
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }

  onFullscreenChange(): void {
    this.isFullscreen = !!document.fullscreenElement;
  }

  // =========================================================
  // ESCAPE
  // =========================================================

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.processingOrder()) {
      return;
    }

    if (this.showOrderModal()) {
      this.closeOrderModal();
      return;
    }
  }
  // =========================================================
  // LOAD MENU
  // =========================================================

  async loadMenus(): Promise<void> {
    try {
      this.loading.set(true);
      this.errorMessage.set('');

      const menus = await this.menuService.getMenus();

      // =====================================================
      // SAVE MENUS
      // =====================================================

      this.menus.set(menus);

      // =====================================================
      // BEST SELLERS
      // Based on `sold`
      // TOP 4 ONLY
      // =====================================================

      const bestSellerIds = [...menus]
        .filter((menu) => Number(menu.sold) > 0)
        .sort((a, b) => {
          return Number(b.sold) - Number(a.sold);
        })
        .slice(0, 4)
        .map((menu) => menu.id);

      this.bestSellerIds.set(new Set(bestSellerIds));

      console.log('BEST SELLERS:', bestSellerIds);
    } catch (error) {
      console.error('POS MENU ERROR:', error);

      this.errorMessage.set('Unable to load menu items.');

      this.bestSellerIds.set(new Set());
    } finally {
      this.loading.set(false);
    }
  }

  // =========================================================
  // CATEGORY
  // =========================================================

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  // =========================================================
  // SEARCH
  // =========================================================

  search(value: string): void {
    this.searchTerm.set(value);
  }

  // =========================================================
  // ADD TO CART
  // =========================================================

  addToCart(menu: MenuItem): void {
    if (!menu.available) {
      return;
    }

    const items = this.cart().map((item) => ({
      ...item,
    }));

    const existing = items.find((item) => item.menu.id === menu.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      items.push({
        menu,
        quantity: 1,
      });
    }

    this.cart.set(items);
  }

  // =========================================================
  // INCREASE
  // =========================================================

  increase(menuId: number): void {
    const items = this.cart().map((item) => ({
      ...item,
    }));

    const item = items.find((item) => item.menu.id === menuId);

    if (!item) {
      return;
    }

    item.quantity += 1;

    this.cart.set(items);
  }

  // =========================================================
  // DECREASE
  // =========================================================

  decrease(menuId: number): void {
    const items = this.cart().map((item) => ({
      ...item,
    }));

    const index = items.findIndex((item) => item.menu.id === menuId);

    if (index === -1) {
      return;
    }

    if (items[index].quantity <= 1) {
      items.splice(index, 1);
    } else {
      items[index].quantity -= 1;
    }

    this.cart.set(items);
  }

  // =========================================================
  // REMOVE
  // =========================================================

  removeItem(menuId: number): void {
    this.cart.update((items) =>
      items.filter((item) => item.menu.id !== menuId),
    );
  }

  // =========================================================
  // CLEAR
  // =========================================================

  clearCart(): void {
    if (this.processingOrder()) {
      return;
    }

    this.cart.set([]);
    this.discount.set(0);

    this.resetOrderDetails();
  }

  // =========================================================
  // ORDER MODAL
  // =========================================================

  openOrderModal(): void {
    if (this.cart().length === 0) {
      return;
    }

    this.showOrderModal.set(true);

    document.body.classList.add('pos-modal-open');
  }

  closeOrderModal(): void {
    if (this.processingOrder()) {
      return;
    }

    this.showOrderModal.set(false);

    document.body.classList.remove('pos-modal-open');
  }

  // =========================================================
  // ORDER TYPE
  // =========================================================

  setOrderType(type: OrderType): void {
    this.orderType.set(type);

    if (type === 'Take-out') {
      this.tableNumber.set('');
    }
  }

  // =========================================================
  // CUSTOMER
  // =========================================================

  setCustomerName(value: string): void {
    this.customerName.set(value);
  }

  setCustomerContact(value: string): void {
    this.customerContact.set(value);
  }

  setTableNumber(value: string): void {
    this.tableNumber.set(value);
  }

  // =========================================================
  // PAYMENT
  // =========================================================

  setPaymentMethod(method: PaymentMethod): void {
    this.paymentMethod.set(method);

    if (method !== 'Cash') {
      this.cashReceived.set(0);
    }
  }

  setCashReceived(value: string): void {
    const amount = Number(value);

    this.cashReceived.set(Number.isFinite(amount) && amount >= 0 ? amount : 0);
  }

  // =========================================================
  // DISCOUNT
  // =========================================================

  setDiscount(value: string): void {
    const amount = Number(value);

    this.discount.set(
      Number.isFinite(amount) && amount >= 0
        ? Math.min(amount, this.subtotal())
        : 0,
    );
  }

  // =========================================================
  // CONFIRM / CREATE ORDER
  // =========================================================

  async confirmOrder(): Promise<void> {
    // -------------------------------------------------------
    // EMPTY CART
    // -------------------------------------------------------

    if (this.cart().length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Empty Order',
        text: 'Please add at least one menu item.',
        confirmButtonText: 'Okay',

        customClass: {
          confirmButton: 'pos-swal-confirm',
        },

        buttonsStyling: false,
      });

      return;
    }

    // -------------------------------------------------------
    // TABLE VALIDATION
    // -------------------------------------------------------

    if (this.orderType() === 'Dine-in' && !this.tableNumber().trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Table Number Required',
        text: 'Please enter the table number for dine-in orders.',
        confirmButtonText: 'Okay',

        customClass: {
          confirmButton: 'pos-swal-confirm',
        },

        buttonsStyling: false,
      });

      return;
    }

    // -------------------------------------------------------
    // CASH VALIDATION
    // -------------------------------------------------------

    if (!this.cashIsEnough()) {
      await Swal.fire({
        icon: 'error',
        title: 'Insufficient Cash',

        html: `
          <div class="pos-validation-content">

            <div class="pos-validation-row">
              <span>Total</span>

              <strong>
                ₱${this.total().toFixed(2)}
              </strong>
            </div>

            <div class="pos-validation-row">
              <span>Cash received</span>

              <strong>
                ₱${this.cashReceived().toFixed(2)}
              </strong>
            </div>

            <div class="pos-validation-message">
              Please enter enough cash to complete the order.
            </div>

          </div>
        `,

        confirmButtonText: 'Okay',

        customClass: {
          popup: 'pos-swal-popup',

          title: 'pos-swal-title',

          htmlContainer: 'pos-swal-html',

          confirmButton: 'pos-swal-confirm',
        },

        buttonsStyling: false,
      });

      return;
    }

    // =======================================================
    // SNAPSHOT RECEIPT DATA
    // =======================================================
    //
    // IMPORTANT:
    // We create this BEFORE resetting the POS.
    //
    // =======================================================

    const receiptData: ReceiptData = {
      orderId: 'PENDING',

      orderType: this.orderType(),

      customerName: this.customerName().trim() || null,

      tableNumber:
        this.orderType() === 'Dine-in' ? this.tableNumber().trim() : null,

      paymentMethod: this.paymentMethod(),

      items: this.cart().map((item) => ({
        name: item.menu.name,

        quantity: item.quantity,

        price: Number(item.menu.price),

        total: Number(item.menu.price) * item.quantity,
      })),

      subtotal: this.subtotal(),

      discount: this.discount(),

      total: this.total(),

      cashReceived:
        this.paymentMethod() === 'Cash' ? this.cashReceived() : this.total(),

      change: this.change(),

      storeName: 'KALYE SILOG & SIZZLING',

      storeAddress: '',

      storeContact: '',
    };

    // =======================================================
    // PREPARE ORDER DATA
    // =======================================================

    const orderData = {
      orderType: this.orderType(),

      customerName: this.customerName().trim() || null,

      customerContact: this.customerContact().trim() || null,

      tableNumber:
        this.orderType() === 'Dine-in' ? this.tableNumber().trim() : null,

      paymentMethod: this.paymentMethod(),

      cashReceived:
        this.paymentMethod() === 'Cash' ? this.cashReceived() : this.total(),

      discount: this.discount(),

      items: this.cart().map((item) => ({
        menuItemId: item.menu.id,

        name: item.menu.name,

        quantity: item.quantity,

        price: Number(item.menu.price),

        total: Number(item.menu.price) * item.quantity,
      })),
    };

    // =======================================================
    // CLOSE CHECKOUT MODAL
    // =======================================================

    this.showOrderModal.set(false);

    document.body.classList.remove('pos-modal-open');

    // =======================================================
    // WAIT FOR MODAL TO DISAPPEAR
    // =======================================================

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });

    // =======================================================
    // PROCESSING
    // =======================================================

    this.processingOrder.set(true);

    Swal.fire({
      title: 'Processing Order',

      text: 'Saving order and updating inventory...',

      allowOutsideClick: false,
      allowEscapeKey: false,

      showConfirmButton: false,

      customClass: {
        popup: 'pos-swal-popup',

        title: 'pos-swal-title',
      },

      didOpen: () => {
        Swal.showLoading();
      },
    });

    // =======================================================
    // CREATE ORDER
    // =======================================================

    try {
      const order = await this.orderService.createOrder(orderData);

      // =====================================================
      // CLOSE PROCESSING
      // =====================================================

      Swal.close();

      // =====================================================
      // UPDATE RECEIPT ORDER ID
      // =====================================================

      receiptData.orderId = order.id;

      // =====================================================
      // PRINT RECEIPT
      // =====================================================
      //
      // THIS IS THE IMPORTANT PART:
      //
      // Order saved successfully
      //          ↓
      // Print receipt immediately
      //
      // =====================================================

      try {
        await this.printerService.printReceipt(receiptData);
      } catch (printError) {
        console.error('PRINT RECEIPT ERROR:', printError);

        await Swal.fire({
          icon: 'warning',

          title: 'Order Saved, But Print Failed',

          text: 'The order was saved successfully, but the receipt could not be printed.',

          confirmButtonText: 'Okay',

          customClass: {
            popup: 'pos-swal-popup',

            title: 'pos-swal-title',

            confirmButton: 'pos-swal-confirm',
          },

          buttonsStyling: false,
        });
      }

      // =====================================================
      // SUCCESS
      // =====================================================

      await Swal.fire({
        icon: 'success',

        title: 'Order Created!',

        html: `
          <div class="pos-success-content">

            <p class="pos-success-message">
              Order has been successfully saved.
            </p>

            <div class="pos-success-total">

              <span>
                Order #${order.id}
              </span>

              <strong>
                ₱${Number(order.total).toFixed(2)}
              </strong>

            </div>

            <div class="pos-success-payment">

              <div>

                <span>
                  Payment
                </span>

                <strong>
                  ${order.paymentMethod}
                </strong>

              </div>

              ${
                this.paymentMethod() === 'Cash'
                  ? `
                    <div>

                      <span>
                        Cash
                      </span>

                      <strong>
                        ₱${this.cashReceived().toFixed(2)}
                      </strong>

                    </div>

                    <div class="change">

                      <span>
                        Change
                      </span>

                      <strong>
                        ₱${this.change().toFixed(2)}
                      </strong>

                    </div>
                  `
                  : ''
              }

            </div>

          </div>
        `,

        showConfirmButton: false,

        timer: 2000,

        timerProgressBar: true,

        allowOutsideClick: false,

        allowEscapeKey: false,

        customClass: {
          popup: 'pos-swal-popup pos-success-popup',

          title: 'pos-swal-title',

          htmlContainer: 'pos-swal-html',
        },

        buttonsStyling: false,
      });

      // =====================================================
      // RESET POS
      // =====================================================

      this.cart.set([]);

      this.showOrderModal.set(false);

      document.body.classList.remove('pos-modal-open');

      this.resetOrderDetails();

      // =====================================================
      // REFRESH MENU / INVENTORY
      // =====================================================

      await this.loadMenus();
    } catch (error: any) {
      console.error('CREATE ORDER ERROR:', error);

      // =====================================================
      // CLOSE PROCESSING
      // =====================================================

      Swal.close();

      // =====================================================
      // ERROR
      // =====================================================

      await Swal.fire({
        icon: 'error',

        title: 'Order Failed',

        text:
          error?.message ||
          error?.details ||
          'Unable to create order. Please try again.',

        confirmButtonText: 'Okay',

        customClass: {
          popup: 'pos-swal-popup',

          title: 'pos-swal-title',

          confirmButton: 'pos-swal-confirm',
        },

        buttonsStyling: false,
      });
    } finally {
      // =====================================================
      // PROCESSING COMPLETE
      // =====================================================

      this.processingOrder.set(false);

      document.body.classList.remove('pos-modal-open');
    }
  }

  // =========================================================
  // MANUAL PRINT
  // =========================================================
  //
  // Reusable method if later you want:
  //
  // Print Again
  // Reprint from Orders
  // Reprint from Sales
  //
  // =========================================================

  async printReceipt(receipt: ReceiptData): Promise<void> {
    try {
      await this.printerService.printReceipt(receipt);
    } catch (error) {
      console.error('MANUAL PRINT ERROR:', error);

      await Swal.fire({
        icon: 'error',

        title: 'Unable to Print',

        text: 'The receipt could not be printed.',

        confirmButtonText: 'Okay',

        customClass: {
          popup: 'pos-swal-popup',

          title: 'pos-swal-title',

          confirmButton: 'pos-swal-confirm',
        },

        buttonsStyling: false,
      });
    }
  }

  // =========================================================
  // RESET ORDER DETAILS
  // =========================================================

  resetOrderDetails(): void {
    this.orderType.set('Dine-in');

    this.customerName.set('');

    this.customerContact.set('');

    this.tableNumber.set('');

    this.paymentMethod.set('Cash');

    this.cashReceived.set(0);

    this.discount.set(0);
  }

  // =========================================================
  // FORMAT CATEGORY
  // =========================================================

  formatCategory(category: string): string {
    if (!category) {
      return '';
    }

    return category
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  // =========================================================
  // TRACK BY
  // =========================================================

  trackByMenuId(_index: number, menu: MenuItem): number {
    return menu.id;
  }

  trackByCartId(_index: number, item: CartItem): number {
    return item.menu.id;
  }
}
