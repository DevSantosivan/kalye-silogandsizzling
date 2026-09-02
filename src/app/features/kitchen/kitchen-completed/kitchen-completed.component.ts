import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-kitchen-completed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kitchen-completed.component.html',
  styleUrl: './kitchen-completed.component.scss',
})
export class KitchenCompletedComponent implements OnInit {
  private orderService = inject(OrderService);

  orders = signal<Order[]>([]);
  loading = signal(true);
  error = signal('');
  searchTerm = signal('');

  completedOrders = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();

    return this.orders()
      .filter((order) => order.status === 'Completed')
      .filter((order) => {
        if (!search) return true;

        return (
          String(order.id).includes(search) ||
          (order.customerName ?? '').toLowerCase().includes(search) ||
          (order.orderType ?? '').toLowerCase().includes(search) ||
          String(order.tableNumber ?? '').includes(search)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt ?? b.createdAt).getTime() -
          new Date(a.updatedAt ?? a.createdAt).getTime(),
      );
  });

  completedCount = computed(() => {
    return this.orders().filter((order) => order.status === 'Completed').length;
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  async loadOrders(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const orders = await this.orderService.getOrders();
      this.orders.set(orders);
    } catch (error: any) {
      console.error('LOAD COMPLETED ORDERS ERROR:', error);

      this.error.set(error?.message || 'Unable to load completed orders.');
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  formatTime(date: string | null | undefined): string {
    if (!date) return '--';

    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '--';

    return new Date(date).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  getOrderTypeLabel(order: Order): string {
    return order.orderType || 'Order';
  }

  trackByOrderId(index: number, order: Order): number {
    return order.id;
  }
}
