import { Component, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { OrderService } from '../../../core/services/order.service';

import {
  Order,
  OrderStatus,
  OrderType,
  PaymentMethod,
} from '../../../core/models/order.model';

/* =========================================================
   ORDER ROW
   UI MODEL FOR ORDERS TABLE
========================================================= */

interface OrderRow {
  id: string;
  numericId: number;

  customer: string;

  type: 'Dine In' | 'Take Out';

  items: number;

  total: number;

  cashReceived: number;

  changeAmount: number;

  subtotal: number;

  discount: number;

  paymentMethod: PaymentMethod;

  payment: 'Paid' | 'Pending';

  status: OrderStatus;

  time: string;

  createdAt: string;

  updatedAt: string;
}

@Component({
  selector: 'app-orders',

  standalone: true,

  imports: [CommonModule],

  templateUrl: './orders.component.html',

  styleUrl: './orders.component.scss',
})
export class OrdersComponent implements OnInit {
  private orderService = inject(OrderService);

  /* =========================================================
     ORDERS
  ========================================================= */

  orders: OrderRow[] = [];

  /* =========================================================
     STATE
  ========================================================= */

  loading = false;

  errorMessage = '';

  /* =========================================================
     FILTER
  ========================================================= */

  activeFilter = 'All';

  filters = ['All', 'Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

  /* =========================================================
     SEARCH
  ========================================================= */

  searchTerm = '';

  /* =========================================================
     PAGINATION
  ========================================================= */

  currentPage = 1;

  pageSize = 5;

  /* =========================================================
     INIT
  ========================================================= */

  ngOnInit(): void {
    this.loadOrders();
  }

  /* =========================================================
     LOAD ORDERS
  ========================================================= */

  async loadOrders(): Promise<void> {
    this.loading = true;

    this.errorMessage = '';

    try {
      const serviceOrders = await this.orderService.getOrders();

      const rows: OrderRow[] = await Promise.all(
        serviceOrders.map(async (order: Order) => {
          let itemCount = 0;

          try {
            const items = await this.orderService.getOrderItems(order.id);

            itemCount = items.length;
          } catch (error) {
            console.error(`Failed to load items for order ${order.id}`, error);
          }

          return this.mapOrder(order, itemCount);
        }),
      );

      this.orders = rows;

      this.currentPage = 1;
    } catch (error: any) {
      console.error('GET ORDERS ERROR:', error);

      this.errorMessage = error?.message || 'Unable to load orders.';
    } finally {
      this.loading = false;
    }
  }

  /* =========================================================
     MAP ORDER
  ========================================================= */

  private mapOrder(order: Order, itemCount: number): OrderRow {
    return {
      id: `#KS-${String(order.id).padStart(5, '0')}`,

      numericId: order.id,

      customer: order.customerName?.trim() || 'Walk-in Customer',

      type: this.mapOrderType(order.orderType),

      items: itemCount,

      total: Number(order.total ?? 0),

      cashReceived: Number(order.cashReceived ?? 0),

      changeAmount: Number(order.changeAmount ?? 0),

      subtotal: Number(order.subtotal ?? 0),

      discount: Number(order.discount ?? 0),

      paymentMethod: order.paymentMethod,

      payment: this.getPaymentStatus(order.paymentMethod),

      status: order.status,

      time: this.formatTime(order.createdAt),

      createdAt: order.createdAt,

      updatedAt: order.updatedAt,
    };
  }

  /* =========================================================
     ORDER TYPE
  ========================================================= */

  private mapOrderType(type: OrderType): 'Dine In' | 'Take Out' {
    if (type === 'Dine-in') {
      return 'Dine In';
    }

    return 'Take Out';
  }

  /* =========================================================
     PAYMENT STATUS
  ========================================================= */

  private getPaymentStatus(paymentMethod: PaymentMethod): 'Paid' | 'Pending' {
    if (
      paymentMethod === 'Cash' ||
      paymentMethod === 'GCash' ||
      paymentMethod === 'Card'
    ) {
      return 'Paid';
    }

    return 'Pending';
  }

  /* =========================================================
     FORMAT TIME
  ========================================================= */

  private formatTime(createdAt: string): string {
    if (!createdAt) {
      return '-';
    }

    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return new Intl.DateTimeFormat('en-PH', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  formatDate(createdAt: string): string {
    if (!createdAt) {
      return '-';
    }

    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return new Intl.DateTimeFormat('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  /* =========================================================
     FILTERED ORDERS
  ========================================================= */

  get filteredOrders(): OrderRow[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.orders.filter((order) => {
      const matchesFilter =
        this.activeFilter === 'All' || order.status === this.activeFilter;

      const matchesSearch =
        !search ||
        order.id.toLowerCase().includes(search) ||
        order.customer.toLowerCase().includes(search) ||
        order.type.toLowerCase().includes(search) ||
        order.status.toLowerCase().includes(search) ||
        order.paymentMethod.toLowerCase().includes(search) ||
        order.payment.toLowerCase().includes(search);

      return matchesFilter && matchesSearch;
    });
  }

  /* =========================================================
     PAGINATED ORDERS
  ========================================================= */

  get paginatedOrders(): OrderRow[] {
    const start = (this.currentPage - 1) * this.pageSize;

    const end = start + this.pageSize;

    return this.filteredOrders.slice(start, end);
  }

  /* =========================================================
     TOTAL PAGES
  ========================================================= */

  get totalPages(): number {
    return Math.ceil(this.filteredOrders.length / this.pageSize);
  }

  /* =========================================================
     PAGE NUMBERS
  ========================================================= */

  get pageNumbers(): number[] {
    return Array.from(
      {
        length: this.totalPages,
      },
      (_, index) => index + 1,
    );
  }

  /* =========================================================
     SET FILTER
  ========================================================= */

  setFilter(filter: string): void {
    this.activeFilter = filter;

    this.currentPage = 1;
  }

  /* =========================================================
     SEARCH
  ========================================================= */

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.searchTerm = input.value;

    this.currentPage = 1;
  }

  /* =========================================================
     CLEAR SEARCH
  ========================================================= */

  clearSearch(): void {
    this.searchTerm = '';

    this.currentPage = 1;
  }

  /* =========================================================
     CLEAR FILTERS
  ========================================================= */

  clearFilters(): void {
    this.searchTerm = '';

    this.activeFilter = 'All';

    this.currentPage = 1;
  }

  /* =========================================================
     PAGINATION
  ========================================================= */

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  /* =========================================================
     TABLE RANGE
  ========================================================= */

  get startItem(): number {
    if (this.filteredOrders.length === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(
      this.currentPage * this.pageSize,

      this.filteredOrders.length,
    );
  }

  /* =========================================================
     TODAY'S ORDERS
  ========================================================= */

  get todayOrders(): number {
    const today = new Date();

    return this.orders.filter((order) => {
      const orderDate = new Date(order.createdAt);

      return (
        orderDate.getFullYear() === today.getFullYear() &&
        orderDate.getMonth() === today.getMonth() &&
        orderDate.getDate() === today.getDate()
      );
    }).length;
  }

  /* =========================================================
     PENDING ORDERS
  ========================================================= */

  get pendingOrders(): number {
    return this.orders.filter((order) => order.status === 'Pending').length;
  }

  /* =========================================================
     PREPARING ORDERS
  ========================================================= */

  get preparingOrders(): number {
    return this.orders.filter((order) => order.status === 'Preparing').length;
  }

  /* =========================================================
     COMPLETED ORDERS
  ========================================================= */

  get completedOrders(): number {
    return this.orders.filter((order) => order.status === 'Completed').length;
  }

  /* =========================================================
     CURRENCY
  ========================================================= */

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
