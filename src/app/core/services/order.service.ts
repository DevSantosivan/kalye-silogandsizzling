import { Injectable, inject } from '@angular/core';

import {
  CreateOrderPayload,
  Order,
} from '../models/order.model';

import { SupabaseService } from './supabase.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly supabase = inject(SupabaseService);
  private readonly notificationService = inject(NotificationService);

  // =========================================================
  // CREATE POS ORDER
  // =========================================================

  async createOrder(
    payload: CreateOrderPayload,
  ): Promise<Order> {
    const { data, error } =
      await this.supabase.client.rpc(
        'create_pos_order',
        {
          p_order_type: payload.orderType,

          p_customer_name:
            payload.customerName ?? null,

          p_customer_contact:
            payload.customerContact ?? null,

          p_table_number:
            payload.tableNumber ?? null,

          p_payment_method:
            payload.paymentMethod,

          p_cash_received:
            payload.cashReceived,

          p_discount:
            payload.discount,

          p_items:
            payload.items,
        },
      );

    // =======================================================
    // ORDER CREATION FAILED
    // =======================================================

    if (error) {
      console.error(
        'CREATE POS ORDER ERROR:',
        error,
      );

      throw new Error(
        error.message ||
          'Unable to create order.',
      );
    }

    if (!data) {
      throw new Error(
        'Order was not created.',
      );
    }

    // =======================================================
    // MAP CREATED ORDER
    // =======================================================

    const order = this.mapOrder(data);

    // =======================================================
    // CREATE NOTIFICATION
    //
    // IMPORTANT:
    // Notification failure should NOT make the
    // successful order fail.
    // =======================================================

    try {
      await this.notificationService.createOrderNotification(
        order.id,
        order.total,
      );
    } catch (notificationError) {
      console.error(
        'ORDER CREATED BUT NOTIFICATION FAILED:',
        notificationError,
      );
    }

    return order;
  }

  // =========================================================
  // GET ALL ORDERS
  // =========================================================

  async getOrders(): Promise<Order[]> {
    const { data, error } =
      await this.supabase.client
        .from('orders')
        .select('*')
        .order('created_at', {
          ascending: false,
        });

    if (error) {
      console.error(
        'GET ORDERS ERROR:',
        error,
      );

      throw error;
    }

    return (data ?? []).map(
      (item: any) =>
        this.mapOrder(item),
    );
  }

  // =========================================================
  // GET ORDER BY ID
  // =========================================================

  async getOrderById(
    id: number,
  ): Promise<Order> {
    const { data, error } =
      await this.supabase.client
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
      console.error(
        'GET ORDER ERROR:',
        error,
      );

      throw error;
    }

    return this.mapOrder(data);
  }

  // =========================================================
  // GET ALL ORDER ITEMS
  // =========================================================

  async getAllOrderItems(): Promise<any[]> {
    const { data, error } =
      await this.supabase.client
        .from('order_items')
        .select(`
          id,
          order_id,
          menu_item_id,
          menu_name,
          quantity,
          price,
          total,
          created_at
        `)
        .order('created_at', {
          ascending: false,
        });

    if (error) {
      console.error(
        'GET ALL ORDER ITEMS ERROR:',
        error,
      );

      throw error;
    }

    return data ?? [];
  }

  // =========================================================
  // UPDATE ORDER STATUS
  // =========================================================

  async updateOrderStatus(
    id: number,
    status:
      | 'Pending'
      | 'Preparing'
      | 'Ready'
      | 'Completed'
      | 'Cancelled',
  ): Promise<Order> {
    const { data, error } =
      await this.supabase.client
        .from('orders')
        .update({
          status,
          updated_at:
            new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
      console.error(
        'UPDATE ORDER STATUS ERROR:',
        error,
      );

      throw error;
    }

    const order = this.mapOrder(data);

    // =======================================================
    // STATUS NOTIFICATION
    // =======================================================

    try {
      await this.notificationService
        .createOrderStatusNotification(
          order.id,
          order.status,
        );
    } catch (notificationError) {
      console.error(
        'ORDER STATUS UPDATED BUT NOTIFICATION FAILED:',
        notificationError,
      );
    }

    return order;
  }

  // =========================================================
  // GET ORDER ITEMS
  // =========================================================

  async getOrderItems(
    orderId: number,
  ): Promise<any[]> {
    const { data, error } =
      await this.supabase.client
        .from('order_items')
        .select(`
          id,
          order_id,
          menu_item_id,
          menu_name,
          quantity,
          price,
          total,
          created_at
        `)
        .eq('order_id', orderId)
        .order('id', {
          ascending: true,
        });

    if (error) {
      console.error(
        'GET ORDER ITEMS ERROR:',
        error,
      );

      throw error;
    }

    return data ?? [];
  }

  // =========================================================
  // MAP SUPABASE → ANGULAR
  // =========================================================

  private mapOrder(item: any): Order {
    return {
      id: item.id,

      orderType:
        item.order_type,

      customerName:
        item.customer_name,

      customerContact:
        item.customer_contact,

      tableNumber:
        item.table_number,

      paymentMethod:
        item.payment_method,

      cashReceived:
        Number(
          item.cash_received ?? 0,
        ),

      changeAmount:
        Number(
          item.change_amount ?? 0,
        ),

      subtotal:
        Number(
          item.subtotal ?? 0,
        ),

      discount:
        Number(
          item.discount ?? 0,
        ),

      total:
        Number(
          item.total ?? 0,
        ),

      status:
        item.status,

      createdAt:
        item.created_at,

      updatedAt:
        item.updated_at,
    };
  }
}