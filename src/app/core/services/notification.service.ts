import {
  Injectable,
  inject,
  OnDestroy,
} from '@angular/core';

import { SupabaseService } from './supabase.service';

export type NotificationType =
  | 'order'
  | 'stock'
  | 'system'
  | 'user';

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  reference_id?: string | null;
  user_id?: string | null;
  read: boolean;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService implements OnDestroy {
  private readonly supabase = inject(SupabaseService);

  private notificationChannel: any = null;

  // =========================================================
  // GET NOTIFICATIONS
  // =========================================================

  async getNotifications(): Promise<AppNotification[]> {
    const { data, error } =
      await this.supabase.client
        .from('notifications')
        .select('*')
        .order('created_at', {
          ascending: false,
        })
        .limit(100);

    if (error) {
      console.error(
        'GET NOTIFICATIONS ERROR:',
        error,
      );

      throw error;
    }

    return (data ?? []) as AppNotification[];
  }

  // =========================================================
  // GET UNREAD COUNT
  // =========================================================

  async getUnreadCount(): Promise<number> {
    const { count, error } =
      await this.supabase.client
        .from('notifications')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq('read', false);

    if (error) {
      console.error(
        'GET UNREAD COUNT ERROR:',
        error,
      );

      throw error;
    }

    return count ?? 0;
  }

  // =========================================================
  // REALTIME NOTIFICATIONS
  // =========================================================

  subscribeToNotifications(
    callback: (
      notification: AppNotification,
    ) => void,
  ): void {
    // Prevent duplicate subscriptions
    this.unsubscribeFromNotifications();

    this.notificationChannel =
      this.supabase.client
        .channel('notifications-realtime')

        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
          },
          (payload) => {
            console.log(
              'REALTIME NEW NOTIFICATION:',
              payload.new,
            );

            callback(
              payload.new as AppNotification,
            );
          },
        )

        .subscribe((status) => {
          console.log(
            'NOTIFICATION REALTIME STATUS:',
            status,
          );
        });
  }

  // =========================================================
  // UNSUBSCRIBE REALTIME
  // =========================================================

  unsubscribeFromNotifications(): void {
    if (!this.notificationChannel) {
      return;
    }

    this.supabase.client.removeChannel(
      this.notificationChannel,
    );

    this.notificationChannel = null;
  }

  // =========================================================
  // CREATE NOTIFICATION
  // =========================================================

  async createNotification(payload: {
    type: NotificationType;
    title: string;
    message: string;
    referenceId?: string | number | null;
    userId?: string | null;
  }): Promise<AppNotification> {
    const { data, error } =
      await this.supabase.client
        .from('notifications')
        .insert({
          type: payload.type,

          title: payload.title,

          message: payload.message,

          reference_id:
            payload.referenceId != null
              ? String(payload.referenceId)
              : null,

          user_id:
            payload.userId ?? null,

          read: false,
        })
        .select()
        .single();

    if (error) {
      console.error(
        'CREATE NOTIFICATION ERROR:',
        error,
      );

      throw error;
    }

    return data as AppNotification;
  }

  // =========================================================
  // MARK AS READ
  // =========================================================

  async markAsRead(
    id: number,
  ): Promise<void> {
    const { error } =
      await this.supabase.client
        .from('notifications')
        .update({
          read: true,
        })
        .eq('id', id);

    if (error) {
      console.error(
        'MARK NOTIFICATION READ ERROR:',
        error,
      );

      throw error;
    }
  }

  // =========================================================
  // MARK ALL AS READ
  // =========================================================

  async markAllAsRead(): Promise<void> {
    const { error } =
      await this.supabase.client
        .from('notifications')
        .update({
          read: true,
        })
        .eq('read', false);

    if (error) {
      console.error(
        'MARK ALL NOTIFICATIONS READ ERROR:',
        error,
      );

      throw error;
    }
  }

  // =========================================================
  // DELETE READ NOTIFICATIONS
  // =========================================================

  async clearReadNotifications(): Promise<void> {
    const { error } =
      await this.supabase.client
        .from('notifications')
        .delete()
        .eq('read', true);

    if (error) {
      console.error(
        'CLEAR READ NOTIFICATIONS ERROR:',
        error,
      );

      throw error;
    }
  }

  // =========================================================
  // LOGIN NOTIFICATION
  // =========================================================

  async createLoginNotification(
    userId: string,
    userName: string,
    role: string,
  ): Promise<void> {
    await this.createNotification({
      type: 'user',

      title: 'Staff logged in',

      message:
        `${userName} logged in as ${role}.`,

      userId,
    });
  }

  // =========================================================
  // NEW STAFF NOTIFICATION
  // =========================================================

  async createStaffNotification(
    userId: string,
    userName: string,
    role: string,
  ): Promise<void> {
    await this.createNotification({
      type: 'user',

      title: 'New staff account created',

      message:
        `${userName} was added as ${role}.`,

      referenceId: userId,

      userId,
    });
  }

  // =========================================================
  // STATUS NOTIFICATION
  // =========================================================

  async createStatusNotification(
    userId: string,
    userName: string,
    status: string,
  ): Promise<void> {
    await this.createNotification({
      type: 'user',

      title: 'Staff status updated',

      message:
        `${userName}'s account is now ${status}.`,

      referenceId: userId,

      userId,
    });
  }

  // =========================================================
  // ORDER NOTIFICATION
  // =========================================================

  async createOrderNotification(
    orderId: number,
    total: number,
  ): Promise<void> {
    await this.createNotification({
      type: 'order',

      title: 'New order received',

      message:
        `Order #KS-${String(orderId).padStart(5, '0')} was created for ₱${total.toFixed(2)}.`,

      referenceId: orderId,
    });
  }

  // =========================================================
  // ORDER STATUS NOTIFICATION
  // =========================================================

  async createOrderStatusNotification(
    orderId: number,
    status: string,
  ): Promise<void> {
    let title = 'Order updated';

    if (status === 'Completed') {
      title = 'Order completed';
    }

    if (status === 'Cancelled') {
      title = 'Order cancelled';
    }

    if (status === 'Ready') {
      title = 'Order ready';
    }

    await this.createNotification({
      type: 'order',

      title,

      message:
        `Order #KS-${String(orderId).padStart(5, '0')} is now ${status}.`,

      referenceId: orderId,
    });
  }

  // =========================================================
  // LOW STOCK NOTIFICATION
  // =========================================================

  async createLowStockNotification(
    ingredientId: number,
    ingredientName: string,
    stock: number,
    unit: string,
  ): Promise<void> {
    await this.createNotification({
      type: 'stock',

      title: 'Low stock alert',

      message:
        `${ingredientName} is running low. Current stock: ${stock} ${unit}.`,

      referenceId: ingredientId,
    });
  }

  // =========================================================
  // STOCK IN
  // =========================================================

  async createStockInNotification(
    ingredientId: number,
    ingredientName: string,
    quantity: number,
    unit: string,
  ): Promise<void> {
    await this.createNotification({
      type: 'stock',

      title: 'Stock added',

      message:
        `${quantity} ${unit} of ${ingredientName} was added to inventory.`,

      referenceId: ingredientId,
    });
  }

  // =========================================================
  // STOCK OUT
  // =========================================================

  async createStockOutNotification(
    ingredientId: number,
    ingredientName: string,
    quantity: number,
    unit: string,
  ): Promise<void> {
    await this.createNotification({
      type: 'stock',

      title: 'Stock deducted',

      message:
        `${quantity} ${unit} of ${ingredientName} was removed from inventory.`,

      referenceId: ingredientId,
    });
  }

  // =========================================================
  // NEW INGREDIENT
  // =========================================================

  async createIngredientNotification(
    ingredientId: number,
    ingredientName: string,
    stock: number,
    unit: string,
  ): Promise<void> {
    await this.createNotification({
      type: 'stock',

      title: 'New ingredient added',

      message:
        `${ingredientName} was added to inventory with ${stock} ${unit} in stock.`,

      referenceId: ingredientId,
    });
  }

  // =========================================================
  // DESTROY
  // =========================================================

  ngOnDestroy(): void {
    this.unsubscribeFromNotifications();
  }
}