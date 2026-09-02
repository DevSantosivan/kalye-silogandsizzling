import { Injectable, inject } from '@angular/core';

import { SupabaseService } from '../../supabase.service';
import { Movement } from '../../../models/movement.model';

@Injectable({
  providedIn: 'root',
})
export class HistoryService {
  private supabase = inject(SupabaseService);

  async getMovements(): Promise<Movement[]> {
    // ==========================================
    // FETCH STOCK IN
    // ==========================================

    const { data: stockIn, error: stockInError } = await this.supabase.client
      .from('stock_in')
      .select(
        `
        id,
        quantity,
        unit,
        supplier,
        notes,
        created_at,
        ingredient:ingredients (
          name
        )
      `,
      )
      .order('created_at', {
        ascending: false,
      });

    if (stockInError) {
      console.error('Error fetching stock-in history:', stockInError);

      throw stockInError;
    }

    // ==========================================
    // FETCH STOCK OUT
    // ==========================================

    const { data: stockOut, error: stockOutError } = await this.supabase.client
      .from('stock_out')
      .select(
        `
        id,
        quantity,
        unit,
        reason,
        notes,
        created_at,
        ingredient:ingredients (
          name
        )
      `,
      )
      .order('created_at', {
        ascending: false,
      });

    if (stockOutError) {
      console.error('Error fetching stock-out history:', stockOutError);

      throw stockOutError;
    }

    // ==========================================
    // MAP STOCK IN
    // ==========================================

    const stockInMovements: Movement[] = (stockIn ?? []).map((item: any) => ({
      id: `in-${item.id}`,

      date: item.created_at,

      ingredient: item.ingredient?.name ?? 'Unknown Ingredient',

      type: 'Stock In',

      quantity: Number(item.quantity),

      unit: item.unit,

      reason: item.supplier ? `Supplier: ${item.supplier}` : 'Stock received',
    }));

    // ==========================================
    // MAP STOCK OUT
    // ==========================================

    const stockOutMovements: Movement[] = (stockOut ?? []).map((item: any) => ({
      id: `out-${item.id}`,

      date: item.created_at,

      ingredient: item.ingredient?.name ?? 'Unknown Ingredient',

      type: 'Stock Out',

      quantity: Number(item.quantity),

      unit: item.unit,

      reason: item.reason,
    }));

    // ==========================================
    // COMBINE
    // ==========================================

    return [...stockInMovements, ...stockOutMovements].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }
}
