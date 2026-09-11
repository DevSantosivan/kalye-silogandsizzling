import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { Chart, ChartConfiguration, registerables } from 'chart.js';

import { Order } from '../../../core/models/order.model';
import { OrderService } from '../../../core/services/order.service';

import { MenuService } from '../../../core/services/admin/menu.service';
import { MenuItem } from '../../../core/models/menu.model';

import { Ingredient } from '../../../core/models/ingredient.model';
import { IngredientService } from '../../../core/services/admin/inventory/ingredient.service';

Chart.register(...registerables);

interface DashboardStats {
  sales: number;
  orders: number;
  averageOrder: number;
  customers: number;

  // NEW
  inventoryItems: number;
  lowStock: number;
  outOfStock: number;

  // NEW
  staff: number;

  // NEW
  expenses: number;
}

interface BestSeller {
  rank: number;
  name: string;
  orders: number;
  price: number;
  revenue: number;
  image: string | null;
}

interface RecentOrder {
  orderNumber: string;
  customer: string;
  type: 'Dine In' | 'Take Out';
  total: number;
  status: string;
}

interface DashboardOrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  menu_name: string;
  quantity: number;
  price: number;
  total: number;
  created_at: string;
}

interface SalesPoint {
  label: string;
  value: number;
}

interface PaymentMethodPoint {
  label: string;
  value: number;
}

type DashboardPeriod =
  | 'All'
  | 'Today'
  | 'Yesterday'
  | 'This Week'
  | 'This Month'
  | 'This Year';

// =========================================================
// COMPONENT
// =========================================================

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  // =========================================================
  // SERVICES
  // =========================================================

  private orderService = inject(OrderService);

  private menuService = inject(MenuService);

  // NEW
  private ingredientService = inject(IngredientService);

  // =========================================================
  // CHART THEME
  // =========================================================

  private readonly CHART_BLACK = '#292724';

  private readonly CHART_BLACK_HOVER = '#44413c';

  private readonly TEXT_PRIMARY = '#292724';

  private readonly TEXT_MUTED = '#918b83';

  private readonly GRID_COLOR = '#eeeae4';

  private readonly WHITE = '#ffffff';

  // =========================================================
  // CHARTS
  // =========================================================

  @ViewChild('salesChart')
  private salesChartElement?: ElementRef<HTMLCanvasElement>;

  @ViewChild('paymentChart')
  private paymentChartElement?: ElementRef<HTMLCanvasElement>;

  private salesChart?: Chart;

  private paymentChart?: Chart;

  // =========================================================
  // STATE
  // =========================================================

  loading = false;

  errorMessage = '';

  orders: Order[] = [];

  orderItems: DashboardOrderItem[] = [];

  menuItems: MenuItem[] = [];

  // =========================================================
  // INVENTORY
  // =========================================================

  ingredients: Ingredient[] = [];

  // =========================================================
  // PERIOD
  // =========================================================

  periods: DashboardPeriod[] = [
    'All',
    'Today',
    'Yesterday',
    'This Week',
    'This Month',
    'This Year',
  ];

  selectedPeriod: DashboardPeriod = 'All';

  isPeriodDropdownOpen = false;

  // =========================================================
  // STATS
  // =========================================================

  stats: DashboardStats = {
    sales: 0,
    orders: 0,
    averageOrder: 0,
    customers: 0,

    // INVENTORY
    inventoryItems: 0,
    lowStock: 0,
    outOfStock: 0,

    // STAFF
    staff: 0,

    // EXPENSES
    expenses: 0,
  };

  // =========================================================
  // ORDER TYPE
  // =========================================================

  orderType = {
    dineIn: 0,
    takeOut: 0,
    dineInPercent: 0,
    takeOutPercent: 0,
    total: 0,
  };

  // =========================================================
  // PAYMENT METHOD
  // =========================================================

  paymentMethodData: PaymentMethodPoint[] = [];

  paymentMethodTotal = 0;

  // =========================================================
  // BEST SELLERS
  // =========================================================

  bestSellers: BestSeller[] = [];

  // =========================================================
  // RECENT ORDERS
  // =========================================================

  recentOrders: RecentOrder[] = [];

  // =========================================================
  // SALES DATA
  // =========================================================

  salesData: SalesPoint[] = [];

  // =========================================================
  // INIT
  // =========================================================

  async ngOnInit(): Promise<void> {
    await this.loadDashboard();
  }

  // =========================================================
  // AFTER VIEW INIT
  // =========================================================

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.renderCharts();
    });
  }

  // =========================================================
  // DESTROY
  // =========================================================

  ngOnDestroy(): void {
    this.salesChart?.destroy();

    this.paymentChart?.destroy();
  }

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  async loadDashboard(): Promise<void> {
    this.loading = true;

    this.errorMessage = '';

    try {
      // =====================================================
      // LOAD MAIN DATA
      // =====================================================

      const [orders, menuItems, ingredients] = await Promise.all([
        this.orderService.getOrders(),

        this.menuService.getMenus(),

        this.ingredientService.getIngredients(),
      ]);

      // =====================================================
      // ORDERS
      // =====================================================

      this.orders = orders ?? [];

      // =====================================================
      // MENU
      // =====================================================

      this.menuItems = (menuItems ?? []).map((item: any) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        description: item.description ?? '',
        price: Number(item.price) || 0,
        sold: Number(item.sold) || 0,
        available: Boolean(item.available),
        image: item.image ?? null,
      }));

      // =====================================================
      // INVENTORY
      // =====================================================

      this.ingredients = ingredients ?? [];

      // =====================================================
      // ORDER ITEMS
      // =====================================================

      await this.loadOrderItems();

      // =====================================================
      // CALCULATE
      // =====================================================

      this.calculateStats();

      this.calculateInventoryStats();

      this.calculateOrderType();

      this.calculatePaymentMethods();

      this.calculateBestSellers();

      this.calculateRecentOrders();

      this.calculateSalesChartData();

      // =====================================================
      // CHART
      // =====================================================

      setTimeout(() => {
        this.renderCharts();
      });
    } catch (error: any) {
      console.error('DASHBOARD LOAD ERROR:', error);

      this.errorMessage = error?.message || 'Unable to load dashboard data.';
    } finally {
      this.loading = false;
    }
  }

  // =========================================================
  // LOAD ORDER ITEMS
  // =========================================================

  private async loadOrderItems(): Promise<void> {
    if (!this.orders.length) {
      this.orderItems = [];

      return;
    }

    try {
      const results = await Promise.all(
        this.orders.map((order) => this.orderService.getOrderItems(order.id)),
      );

      this.orderItems = results.flat() as DashboardOrderItem[];
    } catch (error) {
      console.error('FAILED TO LOAD ORDER ITEMS:', error);

      this.orderItems = [];
    }
  }

  // =========================================================
  // INVENTORY STATS
  // =========================================================

  private calculateInventoryStats(): void {
    const inventoryItems = this.ingredients.length;

    const lowStock = this.ingredients.filter(
      (item) => item.stock > 0 && item.stock <= item.reorderLevel,
    ).length;

    const outOfStock = this.ingredients.filter(
      (item) => item.stock <= 0,
    ).length;

    this.stats = {
      ...this.stats,

      inventoryItems,

      lowStock,

      outOfStock,
    };
  }

  // =========================================================
  // PERIOD DROPDOWN
  // =========================================================

  togglePeriodDropdown(): void {
    this.isPeriodDropdownOpen = !this.isPeriodDropdownOpen;
  }

  // =========================================================
  // SELECT PERIOD
  // =========================================================

  selectPeriod(period: DashboardPeriod): void {
    this.selectedPeriod = period;

    this.isPeriodDropdownOpen = false;

    this.calculateStats();

    this.calculateInventoryStats();

    this.calculateOrderType();

    this.calculatePaymentMethods();

    this.calculateBestSellers();

    this.calculateRecentOrders();

    this.calculateSalesChartData();

    setTimeout(() => {
      this.renderCharts();
    });
  }

  // =========================================================
  // FILTER ORDERS
  // =========================================================

  private getFilteredOrders(): Order[] {
    if (this.selectedPeriod === 'All') {
      return [...this.orders];
    }

    return this.orders.filter((order) =>
      this.isOrderInPeriod(order, this.selectedPeriod),
    );
  }

  // =========================================================
  // CHECK PERIOD
  // =========================================================

  private isOrderInPeriod(order: Order, period: DashboardPeriod): boolean {
    if (!order.createdAt) {
      return false;
    }

    const orderDate = new Date(order.createdAt);

    if (Number.isNaN(orderDate.getTime())) {
      return false;
    }

    const now = new Date();

    switch (period) {
      case 'Today':
        return this.isSameDate(orderDate, now);

      case 'Yesterday': {
        const yesterday = new Date(now);

        yesterday.setDate(yesterday.getDate() - 1);

        return this.isSameDate(orderDate, yesterday);
      }

      case 'This Week':
        return this.isThisWeek(orderDate);

      case 'This Month':
        return (
          orderDate.getFullYear() === now.getFullYear() &&
          orderDate.getMonth() === now.getMonth()
        );

      case 'This Year':
        return orderDate.getFullYear() === now.getFullYear();

      case 'All':

      default:
        return true;
    }
  }

  // =========================================================
  // SAME DATE
  // =========================================================

  private isSameDate(first: Date, second: Date): boolean {
    return (
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate()
    );
  }

  // =========================================================
  // THIS WEEK
  // =========================================================

  private isThisWeek(date: Date): boolean {
    const now = new Date();

    const startOfWeek = this.getStartOfWeek(now);

    const endOfWeek = new Date(startOfWeek);

    endOfWeek.setDate(endOfWeek.getDate() + 7);

    return date >= startOfWeek && date < endOfWeek;
  }

  // =========================================================
  // START OF WEEK
  // =========================================================

  private getStartOfWeek(date: Date): Date {
    const start = new Date(date);

    const day = start.getDay();

    const difference = day === 0 ? 6 : day - 1;

    start.setDate(start.getDate() - difference);

    start.setHours(0, 0, 0, 0);

    return start;
  }

  // =========================================================
  // STATS
  // =========================================================

  private calculateStats(): void {
    const filteredOrders = this.getFilteredOrders();

    const completedOrders = filteredOrders.filter(
      (order) => order.status === 'Completed',
    );

    const sales = completedOrders.reduce(
      (total, order) => total + Number(order.total ?? 0),
      0,
    );

    const averageOrder =
      completedOrders.length > 0 ? sales / completedOrders.length : 0;

    const customers = new Set(
      completedOrders.map(
        (order) => order.customerName?.trim() || 'Walk-in Customer',
      ),
    );

    this.stats = {
      ...this.stats,

      sales,

      orders: completedOrders.length,

      averageOrder,

      customers: customers.size,
    };
  }

  // =========================================================
  // ORDER TYPE
  // =========================================================

  private calculateOrderType(): void {
    const completedOrders = this.getFilteredOrders().filter(
      (order) => order.status === 'Completed',
    );

    const dineIn = completedOrders.filter(
      (order) => order.orderType === 'Dine-in',
    ).length;

    const takeOut = completedOrders.filter(
      (order) => order.orderType === 'Take-out',
    ).length;

    const total = dineIn + takeOut;

    this.orderType = {
      dineIn,

      takeOut,

      total,

      dineInPercent: total > 0 ? Math.round((dineIn / total) * 100) : 0,

      takeOutPercent: total > 0 ? Math.round((takeOut / total) * 100) : 0,
    };
  }

  // =========================================================
  // PAYMENT METHODS
  // =========================================================

  private calculatePaymentMethods(): void {
    const completedOrders = this.getFilteredOrders().filter(
      (order) => order.status === 'Completed',
    );

    const paymentMap = new Map<string, number>();

    for (const order of completedOrders) {
      const method =
        String(order.paymentMethod ?? 'Unknown').trim() || 'Unknown';

      paymentMap.set(method, (paymentMap.get(method) ?? 0) + 1);
    }

    this.paymentMethodData = Array.from(paymentMap.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([label, value]) => ({
        label,
        value,
      }));

    this.paymentMethodTotal = completedOrders.length;
  }

  // =========================================================
  // BEST SELLERS
  // =========================================================

  private calculateBestSellers(): void {
    const completedOrders = this.getFilteredOrders().filter(
      (order) => order.status === 'Completed',
    );

    const orderIds = new Set(completedOrders.map((order) => order.id));

    const filteredItems = this.orderItems.filter((item) =>
      orderIds.has(item.order_id),
    );

    const itemMap = new Map<
      number,
      {
        name: string;
        orders: number;
        revenue: number;
        price: number;
      }
    >();

    for (const item of filteredItems) {
      const quantity = Number(item.quantity ?? 0);

      const total = Number(item.total ?? 0);

      const price = Number(item.price ?? 0);

      const existing = itemMap.get(item.menu_item_id);

      if (existing) {
        existing.orders += quantity;

        existing.revenue += total;
      } else {
        itemMap.set(item.menu_item_id, {
          name: item.menu_name,

          orders: quantity,

          revenue: total,

          price,
        });
      }
    }

    this.bestSellers = Array.from(itemMap.entries())
      .sort((a, b) => b[1].orders - a[1].orders)
      .slice(0, 5)
      .map(([menuItemId, item], index) => {
        const menu = this.menuItems.find(
          (menuItem) => menuItem.id === menuItemId,
        );

        return {
          rank: index + 1,

          name: item.name,

          orders: item.orders,

          price: item.price,

          revenue: item.revenue,

          image: menu?.image ?? null,
        };
      });
  }

  // =========================================================
  // RECENT ORDERS
  // =========================================================

  private calculateRecentOrders(): void {
    const filteredOrders = this.getFilteredOrders();

    this.recentOrders = [...filteredOrders]

      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )

      .slice(0, 5)

      .map((order) => ({
        orderNumber: `KS-${String(order.id).padStart(5, '0')}`,

        customer: order.customerName?.trim() || 'Walk-in Customer',

        type: order.orderType === 'Dine-in' ? 'Dine In' : 'Take Out',

        total: Number(order.total ?? 0),

        status: order.status,
      }));
  }

  // =========================================================
  // SALES CHART DATA
  // =========================================================

  private calculateSalesChartData(): void {
    switch (this.selectedPeriod) {
      case 'Today':
        this.calculateTodayChart();
        break;

      case 'Yesterday':
        this.calculateYesterdayChart();
        break;

      case 'This Week':
        this.calculateWeeklyChart();
        break;

      case 'This Month':
        this.calculateMonthlyChart();
        break;

      case 'This Year':
        this.calculateYearlyChart();
        break;

      case 'All':

      default:
        this.calculateAllChart();
        break;
    }
  }

  // =========================================================
  // ALL
  // =========================================================

  private calculateAllChart(): void {
    const completedOrders = this.orders.filter(
      (order) => order.status === 'Completed',
    );

    const grouped = new Map<string, number>();

    for (const order of completedOrders) {
      const date = new Date(order.createdAt);

      if (Number.isNaN(date.getTime())) {
        continue;
      }

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        '0',
      )}`;

      grouped.set(key, (grouped.get(key) ?? 0) + Number(order.total ?? 0));
    }

    const entries = Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12);

    this.salesData = entries.map(([key, value]) => {
      const [year, month] = key.split('-');

      const date = new Date(Number(year), Number(month) - 1, 1);

      return {
        label: new Intl.DateTimeFormat('en-PH', {
          month: 'short',
          year: 'numeric',
        }).format(date),

        value,
      };
    });
  }

  // =========================================================
  // TODAY
  // =========================================================

  private calculateTodayChart(): void {
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
        this.isSameDate(new Date(order.createdAt), new Date()),
    );

    for (const order of todayOrders) {
      const date = new Date(order.createdAt);

      const index = Math.floor(date.getHours() / 2);

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
  // YESTERDAY
  // =========================================================

  private calculateYesterdayChart(): void {
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

    const yesterday = new Date();

    yesterday.setDate(yesterday.getDate() - 1);

    const orders = this.orders.filter(
      (order) =>
        order.status === 'Completed' &&
        this.isSameDate(new Date(order.createdAt), yesterday),
    );

    for (const order of orders) {
      const date = new Date(order.createdAt);

      const index = Math.floor(date.getHours() / 2);

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
  // WEEK
  // =========================================================

  private calculateWeeklyChart(): void {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const values = new Array(7).fill(0);

    const startOfWeek = this.getStartOfWeek(new Date());

    const orders = this.orders.filter((order) => {
      if (order.status !== 'Completed') {
        return false;
      }

      const date = new Date(order.createdAt);

      return date >= startOfWeek;
    });

    for (const order of orders) {
      const date = new Date(order.createdAt);

      const index = date.getDay() === 0 ? 6 : date.getDay() - 1;

      values[index] += Number(order.total ?? 0);
    }

    this.salesData = labels.map((label, index) => ({
      label,
      value: values[index],
    }));
  }

  // =========================================================
  // MONTH
  // =========================================================

  private calculateMonthlyChart(): void {
    const now = new Date();

    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();

    const values = new Array(daysInMonth).fill(0);

    const orders = this.orders.filter((order) => {
      if (order.status !== 'Completed') {
        return false;
      }

      const date = new Date(order.createdAt);

      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    });

    for (const order of orders) {
      const date = new Date(order.createdAt);

      values[date.getDate() - 1] += Number(order.total ?? 0);
    }

    this.salesData = values.map((value, index) => ({
      label: String(index + 1),

      value,
    }));
  }

  // =========================================================
  // YEAR
  // =========================================================

  private calculateYearlyChart(): void {
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

    const year = new Date().getFullYear();

    const orders = this.orders.filter(
      (order) =>
        order.status === 'Completed' &&
        new Date(order.createdAt).getFullYear() === year,
    );

    for (const order of orders) {
      const month = new Date(order.createdAt).getMonth();

      values[month] += Number(order.total ?? 0);
    }

    this.salesData = labels.map((label, index) => ({
      label,
      value: values[index],
    }));
  }

  // =========================================================
  // RENDER CHARTS
  // =========================================================

  private renderCharts(): void {
    this.renderSalesChart();

    this.renderPaymentChart();
  }

  // =========================================================
  // SALES BAR CHART
  // =========================================================

  private renderSalesChart(): void {
    const canvas = this.salesChartElement?.nativeElement;

    if (!canvas) {
      return;
    }

    this.salesChart?.destroy();

    const labels = this.salesData.map((item) => item.label);

    const values = this.salesData.map((item) => item.value);

    const configuration: ChartConfiguration<'bar'> = {
      type: 'bar',

      data: {
        labels,

        datasets: [
          {
            label: 'Sales',

            data: values,

            backgroundColor: this.CHART_BLACK,

            borderColor: this.CHART_BLACK,

            borderWidth: 0,

            borderRadius: 4,

            borderSkipped: false,

            maxBarThickness: 32,

            hoverBackgroundColor: this.CHART_BLACK_HOVER,
          },
        ],
      },

      options: {
        responsive: true,

        maintainAspectRatio: false,

        animation: {
          duration: 450,
        },

        interaction: {
          mode: 'index',
          intersect: false,
        },

        plugins: {
          legend: {
            display: false,
          },

          tooltip: {
            backgroundColor: this.TEXT_PRIMARY,

            titleColor: this.WHITE,

            bodyColor: this.WHITE,

            padding: 12,

            displayColors: false,

            cornerRadius: 6,

            callbacks: {
              label: (context) => {
                const value = Number(context.parsed.y ?? 0);

                return `Sales: ${this.formatCurrency(value)}`;
              },
            },
          },
        },

        scales: {
          x: {
            grid: {
              display: false,
            },

            border: {
              display: false,
            },

            ticks: {
              color: this.TEXT_MUTED,

              font: {
                size: 10,
              },

              maxRotation: 0,

              autoSkip: true,

              maxTicksLimit: 12,

              padding: 6,
            },
          },

          y: {
            beginAtZero: true,

            border: {
              display: false,
            },

            grid: {
              color: this.GRID_COLOR,

              lineWidth: 1,
            },

            ticks: {
              color: this.TEXT_MUTED,

              font: {
                size: 10,
              },

              padding: 8,

              callback: (value) => {
                const numeric = Number(value);

                if (numeric >= 1000) {
                  return (
                    '₱' +
                    (numeric / 1000).toFixed(numeric % 1000 === 0 ? 0 : 1) +
                    'k'
                  );
                }

                return '₱' + numeric.toLocaleString('en-PH');
              },
            },
          },
        },
      },
    };

    this.salesChart = new Chart(canvas, configuration);
  }

  // =========================================================
  // PAYMENT PIE CHART
  // =========================================================

  private renderPaymentChart(): void {
    const canvas = this.paymentChartElement?.nativeElement;

    if (!canvas) {
      return;
    }

    this.paymentChart?.destroy();

    const labels = this.paymentMethodData.map((item) => item.label);

    const values = this.paymentMethodData.map((item) => item.value);

    if (!values.length) {
      return;
    }

    const paymentColors = [
      '#292724',
      '#44413c',
      '#5a5650',
      '#706b64',
      '#918b83',
    ];

    const configuration: ChartConfiguration<'pie'> = {
      type: 'pie',

      data: {
        labels,

        datasets: [
          {
            data: values,

            backgroundColor: values.map(
              (_, index) => paymentColors[index % paymentColors.length],
            ),

            borderColor: this.WHITE,

            borderWidth: 3,

            hoverOffset: 4,
          },
        ],
      },

      options: {
        responsive: true,

        maintainAspectRatio: false,

        animation: {
          duration: 450,
        },

        plugins: {
          legend: {
            display: false,
          },

          tooltip: {
            backgroundColor: this.TEXT_PRIMARY,

            titleColor: this.WHITE,

            bodyColor: this.WHITE,

            padding: 12,

            cornerRadius: 6,

            callbacks: {
              label: (context) => {
                const value = Number(context.parsed ?? 0);

                const total = values.reduce((sum, current) => sum + current, 0);

                const percentage =
                  total > 0 ? Math.round((value / total) * 100) : 0;

                return `${context.label}: ${value} orders (${percentage}%)`;
              },
            },
          },
        },
      },
    };

    this.paymentChart = new Chart(canvas, configuration);
  }

  // =========================================================
  // PAYMENT PERCENTAGE
  // =========================================================

  getPaymentPercentage(value: number): number {
    if (this.paymentMethodTotal === 0) {
      return 0;
    }

    return Math.round((value / this.paymentMethodTotal) * 100);
  }

  // =========================================================
  // CURRENCY
  // =========================================================

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',

      currency: 'PHP',

      maximumFractionDigits: 0,
    }).format(value);
  }

  // =========================================================
  // REFRESH
  // =========================================================

  async refresh(): Promise<void> {
    await this.loadDashboard();
  }
}
