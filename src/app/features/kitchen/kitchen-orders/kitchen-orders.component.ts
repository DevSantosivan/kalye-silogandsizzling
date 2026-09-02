import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { Order, OrderType } from '../../../core/models/order.model';
import { OrderService } from '../../../core/services/order.service';

interface KitchenOrder extends Order {
  items: any[];
  loadingItems?: boolean;
  updating?: boolean;
}

@Component({
  selector: 'app-kitchen-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kitchen-orders.component.html',
  styleUrl: './kitchen-orders.component.scss',
})
export class KitchenOrdersComponent implements OnInit, OnDestroy {
  private orderService = inject(OrderService);

  // =========================================================
  // STATE
  // =========================================================

  orders = signal<KitchenOrder[]>([]);

  loading = signal<boolean>(true);

  refreshing = signal<boolean>(false);

  errorMessage = signal<string>('');

  lastUpdated = signal<Date | null>(null);

  private refreshTimer?: ReturnType<typeof setInterval>;

  // =========================================================
  // FILTERED ORDERS
  // =========================================================

  pendingOrders = computed(() =>
    this.orders()
      .filter((order) => order.status === 'Pending')
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
  );

  preparingOrders = computed(() =>
    this.orders()
      .filter((order) => order.status === 'Preparing')
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
  );

  readyOrders = computed(() =>
    this.orders()
      .filter((order) => order.status === 'Ready')
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
  );

  // =========================================================
  // COUNTS
  // =========================================================

  pendingCount = computed(() => this.pendingOrders().length);

  preparingCount = computed(() => this.preparingOrders().length);

  readyCount = computed(() => this.readyOrders().length);

  // =========================================================
  // INIT
  // =========================================================

  async ngOnInit(): Promise<void> {
    await this.loadOrders();

    // Auto refresh every 5 seconds
    this.refreshTimer = setInterval(() => {
      this.refreshOrders();
    }, 5000);
  }

  // =========================================================
  // DESTROY
  // =========================================================

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  // =========================================================
  // LOAD ORDERS
  // =========================================================

  async loadOrders(): Promise<void> {
    try {
      this.loading.set(true);
      this.errorMessage.set('');

      const orders = await this.orderService.getOrders();

      const kitchenOrders: KitchenOrder[] = orders
        .filter((order) =>
          ['Pending', 'Preparing', 'Ready'].includes(order.status),
        )
        .map((order) => ({
          ...order,
          items: [],
        }));

      // Oldest first
      kitchenOrders.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

      this.orders.set(kitchenOrders);

      this.lastUpdated.set(new Date());

      // Load order items
      await this.loadItems(kitchenOrders);
    } catch (error) {
      console.error('KITCHEN LOAD ORDERS ERROR:', error);

      this.errorMessage.set('Unable to load kitchen orders.');
    } finally {
      this.loading.set(false);
    }
  }

  // =========================================================
  // REFRESH
  // =========================================================

  async refreshOrders(): Promise<void> {
    if (this.loading()) {
      return;
    }

    try {
      this.refreshing.set(true);

      const orders = await this.orderService.getOrders();

      const currentOrders = this.orders();

      const kitchenOrders: KitchenOrder[] = orders
        .filter((order) =>
          ['Pending', 'Preparing', 'Ready'].includes(order.status),
        )
        .map((order) => {
          const existing = currentOrders.find((item) => item.id === order.id);

          return {
            ...order,

            // Preserve already loaded items
            items: existing?.items ?? [],
          };
        });

      kitchenOrders.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

      this.orders.set(kitchenOrders);

      this.lastUpdated.set(new Date());

      await this.loadItems(
        kitchenOrders.filter((order) => order.items.length === 0),
      );
    } catch (error) {
      console.error('KITCHEN REFRESH ERROR:', error);
    } finally {
      this.refreshing.set(false);
    }
  }

  // =========================================================
  // LOAD ITEMS
  // =========================================================

  async loadItems(orders: KitchenOrder[]): Promise<void> {
    await Promise.all(
      orders.map(async (order) => {
        try {
          const items = await this.orderService.getOrderItems(order.id);

          this.orders.update((current) =>
            current.map((item) =>
              item.id === order.id
                ? {
                    ...item,
                    items,
                  }
                : item,
            ),
          );
        } catch (error) {
          console.error(`LOAD ITEMS ERROR #${order.id}:`, error);
        }
      }),
    );
  }

  // =========================================================
  // START PREPARING
  // =========================================================

  async startPreparing(order: KitchenOrder): Promise<void> {
    // First come first serve
    const firstOrder = this.pendingOrders()[0];

    if (!firstOrder) {
      return;
    }

    if (firstOrder.id !== order.id) {
      return;
    }

    await this.changeStatus(order, 'Preparing');
  }

  // =========================================================
  // MARK READY
  // =========================================================

  async markReady(order: KitchenOrder): Promise<void> {
    await this.changeStatus(order, 'Ready');
  }

  // =========================================================
  // COMPLETE
  // =========================================================

  async completeOrder(order: KitchenOrder): Promise<void> {
    await this.changeStatus(order, 'Completed');
  }

  // =========================================================
  // STATUS UPDATE
  // =========================================================

  private async changeStatus(
    order: KitchenOrder,
    status: 'Pending' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled',
  ): Promise<void> {
    if (order.updating) {
      return;
    }

    this.setOrderUpdating(order.id, true);

    try {
      const updated = await this.orderService.updateOrderStatus(
        order.id,
        status,
      );

      if (status === 'Completed') {
        this.orders.update((orders) =>
          orders.filter((item) => item.id !== order.id),
        );

        return;
      }

      this.orders.update((orders) =>
        orders.map((item) =>
          item.id === order.id
            ? {
                ...item,
                ...updated,
                items: item.items,
                updating: false,
              }
            : item,
        ),
      );
    } catch (error) {
      console.error('KITCHEN STATUS UPDATE ERROR:', error);

      this.setOrderUpdating(order.id, false);
    }
  }

  // =========================================================
  // UPDATING STATE
  // =========================================================

  private setOrderUpdating(orderId: number, value: boolean): void {
    this.orders.update((orders) =>
      orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              updating: value,
            }
          : order,
      ),
    );
  }

  // =========================================================
  // HELPERS
  // =========================================================

  getOrderTypeLabel(type: OrderType): string {
    return type;
  }

  formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getOrderAge(date: string): string {
    const created = new Date(date).getTime();

    const now = Date.now();

    const minutes = Math.floor((now - created) / 60000);

    if (minutes < 1) {
      return 'Just now';
    }

    if (minutes === 1) {
      return '1 min ago';
    }

    return `${minutes} mins ago`;
  }

  trackByOrderId(_index: number, order: KitchenOrder): number {
    return order.id;
  }
}
