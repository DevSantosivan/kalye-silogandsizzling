import { Component, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  Order,
  OrderType,
  PaymentMethod,
} from '../../../core/models/order.model';

import { OrderService } from '../../../core/services/order.service';

interface SaleTransaction {
  id: string;
  orderId: number;
  customer: string;
  type: 'Dine In' | 'Take Out';
  payment: PaymentMethod;
  amount: number;
  time: string;
  status: 'Completed' | 'Refunded';
}

interface TopItem {
  name: string;
  category: string;
  sold: number;
  revenue: number;
}

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

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss',
})
export class SalesComponent implements OnInit {
  private orderService = inject(OrderService);

  // =========================================================
  // STATE
  // =========================================================

  selectedPeriod = 'Monthly';

  periods = ['Daily', 'Weekly', 'Monthly'];

  loading = false;
  errorMessage = '';

  orders: Order[] = [];
  orderItems: OrderItem[] = [];

  // =========================================================
  // STATS
  // =========================================================

  stats = {
    today: 0,
    week: 0,
    month: 0,
    year: 0,
  };

  // =========================================================
  // CHART
  // =========================================================

  salesData: {
    label: string;
    value: number;
  }[] = [];

  // =========================================================
  // ORDER TYPE
  // =========================================================

  orderTypeData = {
    dineIn: 0,
    takeOut: 0,
  };

  // =========================================================
  // PAYMENT
  // =========================================================

  paymentData = {
    cash: 0,
    gcash: 0,
    card: 0,
  };

  // =========================================================
  // TOP ITEMS
  // =========================================================

  topItems: TopItem[] = [];

  // =========================================================
  // TRANSACTIONS
  // =========================================================

  transactions: SaleTransaction[] = [];

  currentPage = 1;
  pageSize = 6;

  // =========================================================
  // INIT
  // =========================================================

  async ngOnInit(): Promise<void> {
    await this.loadSales();
  }

  // =========================================================
  // LOAD SALES
  // =========================================================

  async loadSales(): Promise<void> {
    try {
      this.loading = true;
      this.errorMessage = '';

      // Get all orders from Supabase
      this.orders = await this.orderService.getOrders();

      // Only completed orders are considered sales
      const completedOrders = this.orders.filter(
        (order) => order.status === 'Completed',
      );

      // Build transactions
      this.transactions = completedOrders.map((order) =>
        this.mapOrderToTransaction(order),
      );

      // Load order items for completed orders
      await this.loadOrderItems(completedOrders);

      // Calculate everything
      this.calculateStats();
      this.calculateOrderTypes();
      this.calculatePayments();
      this.calculateTopItems();
      this.calculateChart();

      // Reset pagination
      this.currentPage = 1;
    } catch (error: any) {
      console.error('LOAD SALES ERROR:', error);

      this.errorMessage = error?.message || 'Unable to load sales data.';
    } finally {
      this.loading = false;
    }
  }

  // =========================================================
  // LOAD ORDER ITEMS
  // =========================================================

  private async loadOrderItems(completedOrders: Order[]): Promise<void> {
    if (!completedOrders.length) {
      this.orderItems = [];
      return;
    }

    try {
      const results = await Promise.all(
        completedOrders.map((order) =>
          this.orderService.getOrderItems(order.id),
        ),
      );

      this.orderItems = results.flat() as OrderItem[];
    } catch (error) {
      console.error('LOAD ORDER ITEMS ERROR:', error);

      this.orderItems = [];
    }
  }

  // =========================================================
  // MAP ORDER → TRANSACTION
  // =========================================================

  private mapOrderToTransaction(order: Order): SaleTransaction {
    return {
      id: `#KS-${String(order.id).padStart(5, '0')}`,

      orderId: order.id,

      customer: order.customerName?.trim() || 'Walk-in Customer',

      type: order.orderType === 'Dine-in' ? 'Dine In' : 'Take Out',

      payment: order.paymentMethod,

      amount: Number(order.total ?? 0),

      time: this.formatTime(order.createdAt),

      status: 'Completed',
    };
  }

  // =========================================================
  // STATS
  // =========================================================

  private calculateStats(): void {
    const completedOrders = this.orders.filter(
      (order) => order.status === 'Completed',
    );

    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();

    const diffToMonday = day === 0 ? 6 : day - 1;

    startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);

    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const startOfYear = new Date(now.getFullYear(), 0, 1);

    this.stats.today = this.sumOrders(
      completedOrders.filter(
        (order) => new Date(order.createdAt) >= startOfToday,
      ),
    );

    this.stats.week = this.sumOrders(
      completedOrders.filter(
        (order) => new Date(order.createdAt) >= startOfWeek,
      ),
    );

    this.stats.month = this.sumOrders(
      completedOrders.filter(
        (order) => new Date(order.createdAt) >= startOfMonth,
      ),
    );

    this.stats.year = this.sumOrders(
      completedOrders.filter(
        (order) => new Date(order.createdAt) >= startOfYear,
      ),
    );
  }

  private sumOrders(orders: Order[]): number {
    return orders.reduce((total, order) => total + Number(order.total ?? 0), 0);
  }

  // =========================================================
  // ORDER TYPE
  // =========================================================

  private calculateOrderTypes(): void {
    const completedOrders = this.orders.filter(
      (order) => order.status === 'Completed',
    );

    const dineIn = completedOrders.filter(
      (order) => order.orderType === 'Dine-in',
    ).length;

    const takeOut = completedOrders.filter(
      (order) => order.orderType === 'Take-out',
    ).length;

    const total = dineIn + takeOut;

    if (total === 0) {
      this.orderTypeData = {
        dineIn: 0,
        takeOut: 0,
      };

      return;
    }

    this.orderTypeData = {
      dineIn: Math.round((dineIn / total) * 100),
      takeOut: Math.round((takeOut / total) * 100),
    };
  }

  // =========================================================
  // PAYMENT
  // =========================================================

  private calculatePayments(): void {
    const completedOrders = this.orders.filter(
      (order) => order.status === 'Completed',
    );

    const cash = completedOrders.filter(
      (order) => order.paymentMethod === 'Cash',
    ).length;

    const gcash = completedOrders.filter(
      (order) => order.paymentMethod === 'GCash',
    ).length;

    const card = completedOrders.filter(
      (order) => order.paymentMethod === 'Card',
    ).length;

    const total = cash + gcash + card;

    if (total === 0) {
      this.paymentData = {
        cash: 0,
        gcash: 0,
        card: 0,
      };

      return;
    }

    this.paymentData = {
      cash: Math.round((cash / total) * 100),
      gcash: Math.round((gcash / total) * 100),
      card: Math.round((card / total) * 100),
    };
  }

  // =========================================================
  // TOP ITEMS
  // =========================================================

  private calculateTopItems(): void {
    const itemMap = new Map<
      number,
      {
        name: string;
        sold: number;
        revenue: number;
      }
    >();

    for (const item of this.orderItems) {
      const existing = itemMap.get(item.menu_item_id);

      if (existing) {
        existing.sold += Number(item.quantity ?? 0);
        existing.revenue += Number(item.total ?? 0);
      } else {
        itemMap.set(item.menu_item_id, {
          name: item.menu_name,
          sold: Number(item.quantity ?? 0),
          revenue: Number(item.total ?? 0),
        });
      }
    }

    this.topItems = Array.from(itemMap.values())
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5)
      .map((item) => ({
        name: item.name,
        category: 'Menu Item',
        sold: item.sold,
        revenue: item.revenue,
      }));
  }

  // =========================================================
  // SALES CHART
  // =========================================================

  private calculateChart(): void {
    if (this.selectedPeriod === 'Daily') {
      this.calculateDailyChart();
      return;
    }

    if (this.selectedPeriod === 'Weekly') {
      this.calculateWeeklyChart();
      return;
    }

    this.calculateMonthlyChart();
  }

  // =========================================================
  // DAILY CHART
  // =========================================================

  private calculateDailyChart(): void {
    const now = new Date();

    const labels = [
      '12 AM',
      '2 AM',
      '4 AM',
      '6 AM',
      '8 AM',
      '10 AM',
      '12 PM',
      '2 PM',
      '4 PM',
      '6 PM',
      '8 PM',
      '10 PM',
    ];

    const values = new Array(12).fill(0);

    const todayOrders = this.orders.filter(
      (order) =>
        order.status === 'Completed' &&
        this.isSameDate(new Date(order.createdAt), now),
    );

    for (const order of todayOrders) {
      const date = new Date(order.createdAt);
      const hour = date.getHours();

      const index = Math.floor(hour / 2);

      if (index >= 0 && index < values.length) {
        values[index] += Number(order.total ?? 0);
      }
    }

    this.salesData = labels.map((label, index) => ({
      label,
      value: values[index],
    }));
  }

  // =========================================================
  // WEEKLY CHART
  // =========================================================

  private calculateWeeklyChart(): void {
    const now = new Date();

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const values = new Array(7).fill(0);

    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();

    const diffToMonday = day === 0 ? 6 : day - 1;

    startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);

    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyOrders = this.orders.filter(
      (order) =>
        order.status === 'Completed' &&
        new Date(order.createdAt) >= startOfWeek,
    );

    for (const order of weeklyOrders) {
      const date = new Date(order.createdAt);

      const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;

      values[dayIndex] += Number(order.total ?? 0);
    }

    this.salesData = labels.map((label, index) => ({
      label,
      value: values[index],
    }));
  }

  // =========================================================
  // MONTHLY CHART
  // =========================================================

  private calculateMonthlyChart(): void {
    const year = new Date().getFullYear();

    const labels = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const values = new Array(12).fill(0);

    const yearlyOrders = this.orders.filter((order) => {
      if (order.status !== 'Completed') {
        return false;
      }

      const date = new Date(order.createdAt);

      return date.getFullYear() === year;
    });

    for (const order of yearlyOrders) {
      const date = new Date(order.createdAt);

      const month = date.getMonth();

      values[month] += Number(order.total ?? 0);
    }

    this.salesData = labels.map((label, index) => ({
      label,
      value: values[index],
    }));
  }

  // =========================================================
  // PERIOD
  // =========================================================

  setPeriod(period: string): void {
    this.selectedPeriod = period;

    this.calculateChart();
  }

  // =========================================================
  // TRANSACTIONS
  // =========================================================

  get paginatedTransactions(): SaleTransaction[] {
    const start = (this.currentPage - 1) * this.pageSize;

    const end = start + this.pageSize;

    return this.transactions.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.transactions.length / this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from(
      {
        length: this.totalPages,
      },
      (_, index) => index + 1,
    );
  }

  get startItem(): number {
    if (this.transactions.length === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.transactions.length);
  }

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

  // =========================================================
  // SUMMARY
  // =========================================================

  get totalTransactions(): number {
    return this.transactions.length;
  }

  get completedTransactions(): number {
    return this.orders.filter((order) => order.status === 'Completed').length;
  }

  get refundedTransactions(): number {
    // Your current OrderStatus does not have "Refunded".
    // Cancelled orders are treated separately.
    return this.orders.filter((order) => order.status === 'Cancelled').length;
  }

  get cancelledTransactions(): number {
    return this.orders.filter((order) => order.status === 'Cancelled').length;
  }

  get totalTransactionValue(): number {
    return this.transactions.reduce(
      (total, transaction) => total + transaction.amount,
      0,
    );
  }

  // =========================================================
  // HELPERS
  // =========================================================

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  getPaymentIcon(payment: string): string {
    const icons: Record<string, string> = {
      Cash: 'bx-money',
      GCash: 'bx-mobile',
      Card: 'bx-credit-card',
    };

    return icons[payment] || 'bx-wallet';
  }

  getTransactionInitials(name: string): string {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  formatTime(dateString: string): string {
    return new Intl.DateTimeFormat('en-PH', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(dateString));
  }

  private isSameDate(first: Date, second: Date): boolean {
    return (
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate()
    );
  }

  // =========================================================
  // EXPORT
  // =========================================================

  exportReport(): void {
    const rows = this.transactions.map((transaction) => ({
      Order: transaction.id,
      Customer: transaction.customer,
      Type: transaction.type,
      Payment: transaction.payment,
      Amount: transaction.amount,
      Time: transaction.time,
      Status: transaction.status,
    }));

    console.table(rows);

    // CSV / Excel / PDF can be added later.
  }

  // =========================================================
  // REFRESH
  // =========================================================

  async refresh(): Promise<void> {
    await this.loadSales();
  }
}
