import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { Order } from '../../../core/models/order.model';
import { OrderService } from '../../../core/services/order.service';

interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  menu_name: string;
  quantity: number;
  price: number;
  total: number;
  created_at: string;
}

interface OrderWithItems extends Order {
  items: OrderItem[];
  loadingItems?: boolean;
}

@Component({
  selector: 'app-active-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './active-orders.component.html',
  styleUrl: './active-orders.component.scss',
})
export class ActiveOrdersComponent implements OnInit {
  private orderService = inject(OrderService);

  // =========================================================
  // STATE
  // =========================================================

  orders = signal<OrderWithItems[]>([]);

  filteredOrders = signal<OrderWithItems[]>([]);

  loading = signal(true);

  errorMessage = signal('');

  selectedOrder = signal<OrderWithItems | null>(null);

  showViewModal = signal(false);

  // =========================================================
  // FILTERS
  // =========================================================

  searchTerm = signal('');

  selectedOrderType = signal('All');

  selectedPayment = signal('All');

  selectedDate = signal('All');

  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {
    this.loadOrders();
  }

  // =========================================================
  // LOAD ORDERS
  // =========================================================

  async loadOrders(): Promise<void> {
    this.loading.set(true);

    this.errorMessage.set('');

    try {
      const orders = await this.orderService.getOrders();

      const ordersWithItems: OrderWithItems[] = orders.map((order) => ({
        ...order,
        items: [],
        loadingItems: true,
      }));

      this.orders.set(ordersWithItems);

      this.filteredOrders.set(ordersWithItems);

      // Load items for every order

      await Promise.all(
        ordersWithItems.map((order) => this.loadOrderItems(order.id)),
      );

      this.applyFilters();
    } catch (error: any) {
      console.error('LOAD ACTIVE ORDERS ERROR:', error);

      this.errorMessage.set(error?.message || 'Unable to load orders.');
    } finally {
      this.loading.set(false);
    }
  }

  // =========================================================
  // LOAD ORDER ITEMS
  // =========================================================

  async loadOrderItems(orderId: number): Promise<void> {
    try {
      const items = await this.orderService.getOrderItems(orderId);

      this.orders.update((orders) =>
        orders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                items,
                loadingItems: false,
              }
            : order,
        ),
      );

      this.applyFilters();
    } catch (error) {
      console.error(`LOAD ORDER ITEMS ERROR [${orderId}]:`, error);

      this.orders.update((orders) =>
        orders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                loadingItems: false,
              }
            : order,
        ),
      );

      this.applyFilters();
    }
  }

  // =========================================================
  // FILTERING
  // =========================================================

  private applyFilters(): void {
    const search = this.searchTerm().trim().toLowerCase();

    const orderType = this.selectedOrderType();

    const payment = this.selectedPayment();

    const date = this.selectedDate();

    const filtered = this.orders().filter((order) => {
      // ---------------------------------------------------
      // SEARCH
      // ---------------------------------------------------

      const customerName = order.customerName || 'Walk-in Customer';

      const matchesSearch =
        !search ||
        String(order.id).toLowerCase().includes(search) ||
        customerName.toLowerCase().includes(search);

      // ---------------------------------------------------
      // ORDER TYPE
      // ---------------------------------------------------

      const matchesOrderType =
        orderType === 'All' ||
        this.normalizeValue(order.orderType) === this.normalizeValue(orderType);

      // ---------------------------------------------------
      // PAYMENT
      // ---------------------------------------------------

      const matchesPayment =
        payment === 'All' ||
        this.normalizeValue(order.paymentMethod) ===
          this.normalizeValue(payment);

      // ---------------------------------------------------
      // DATE
      // ---------------------------------------------------

      const matchesDate = this.matchesDateFilter(order.createdAt, date);

      return matchesSearch && matchesOrderType && matchesPayment && matchesDate;
    });

    this.filteredOrders.set(filtered);
  }

  // =========================================================
  // SEARCH
  // =========================================================

  onSearchChange(value: string): void {
    this.searchTerm.set(value);

    this.applyFilters();
  }

  // =========================================================
  // ORDER TYPE
  // =========================================================

  onOrderTypeChange(value: string): void {
    this.selectedOrderType.set(value);

    this.applyFilters();
  }

  // =========================================================
  // PAYMENT
  // =========================================================

  onPaymentChange(value: string): void {
    this.selectedPayment.set(value);

    this.applyFilters();
  }

  // =========================================================
  // DATE
  // =========================================================

  onDateChange(value: string): void {
    this.selectedDate.set(value);

    this.applyFilters();
  }

  // =========================================================
  // DATE FILTER
  // =========================================================

  private matchesDateFilter(
    createdAt: string | null | undefined,

    filter: string,
  ): boolean {
    if (filter === 'All' || !createdAt) {
      return true;
    }

    const orderDate = new Date(createdAt);

    const now = new Date();

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const startOfYesterday = new Date(startOfToday);

    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    // -------------------------------------------------------
    // TODAY
    // -------------------------------------------------------

    if (filter === 'Today') {
      return orderDate >= startOfToday;
    }

    // -------------------------------------------------------
    // YESTERDAY
    // -------------------------------------------------------

    if (filter === 'Yesterday') {
      return orderDate >= startOfYesterday && orderDate < startOfToday;
    }

    // -------------------------------------------------------
    // THIS WEEK
    // -------------------------------------------------------

    if (filter === 'This Week') {
      const day = startOfToday.getDay();

      const startOfWeek = new Date(startOfToday);

      startOfWeek.setDate(startOfWeek.getDate() - (day === 0 ? 6 : day - 1));

      return orderDate >= startOfWeek;
    }

    // -------------------------------------------------------
    // THIS MONTH
    // -------------------------------------------------------

    if (filter === 'This Month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      return orderDate >= startOfMonth;
    }

    return true;
  }

  // =========================================================
  // NORMALIZE FILTER VALUE
  // =========================================================

  private normalizeValue(value: string | null | undefined): string {
    return (value || '').trim().toLowerCase().replace(/[_-]/g, ' ');
  }

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  clearFilters(): void {
    this.searchTerm.set('');

    this.selectedOrderType.set('All');

    this.selectedPayment.set('All');

    this.selectedDate.set('All');

    this.applyFilters();
  }

  // =========================================================
  // ACTIVE FILTER CHECK
  // =========================================================

  get hasActiveFilters(): boolean {
    return (
      this.searchTerm().trim() !== '' ||
      this.selectedOrderType() !== 'All' ||
      this.selectedPayment() !== 'All' ||
      this.selectedDate() !== 'All'
    );
  }

  // =========================================================
  // VIEW ORDER
  // =========================================================

  viewOrder(order: OrderWithItems): void {
    this.selectedOrder.set(order);

    this.showViewModal.set(true);
  }

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  closeViewModal(): void {
    this.showViewModal.set(false);

    this.selectedOrder.set(null);
  }

  // =========================================================
  // ITEM COUNT
  // =========================================================

  getItemCount(order: OrderWithItems): number {
    return (
      order.items?.reduce((total, item) => total + Number(item.quantity), 0) ??
      0
    );
  }

  // =========================================================
  // ORDER TYPE
  // =========================================================

  formatOrderType(type: string | null | undefined): string {
    if (!type) {
      return '—';
    }

    return type
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  // =========================================================
  // PAYMENT
  // =========================================================

  formatPaymentMethod(method: string | null | undefined): string {
    if (!method) {
      return '—';
    }

    return method
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  // =========================================================
  // DATE
  // =========================================================

  formatDate(date: string | null | undefined): string {
    if (!date) {
      return '—';
    }

    return new Date(date).toLocaleString('en-PH', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  // =========================================================
  // TRACK BY
  // =========================================================

  trackByOrderId(index: number, order: OrderWithItems): number {
    return order.id;
  }

  trackByItemId(index: number, item: OrderItem): number {
    return item.id;
  }
}
