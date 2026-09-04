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

  loading = signal(true);

  errorMessage = signal('');

  selectedOrder = signal<OrderWithItems | null>(null);

  showViewModal = signal(false);

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
        loadingItems: false,
      }));

      this.orders.set(ordersWithItems);

      // Load items for every order
      await Promise.all(
        ordersWithItems.map((order) => this.loadOrderItems(order.id)),
      );
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
    }
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
  // HELPERS
  // =========================================================

  getOrderItemsText(order: OrderWithItems): string {
    if (!order.items?.length) {
      return 'No items';
    }

    return order.items
      .map((item) => `${item.quantity}× ${item.menu_name}`)
      .join(', ');
  }

  getItemCount(order: OrderWithItems): number {
    return (
      order.items?.reduce((total, item) => total + Number(item.quantity), 0) ??
      0
    );
  }

  formatOrderType(type: string | null | undefined): string {
    if (!type) {
      return '—';
    }

    return type.replace('-', ' ');
  }

  formatPaymentMethod(method: string | null | undefined): string {
    return method || '—';
  }

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

  trackByOrderId(index: number, order: OrderWithItems): number {
    return order.id;
  }

  trackByItemId(index: number, item: OrderItem): number {
    return item.id;
  }
}
