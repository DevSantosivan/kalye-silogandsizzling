import { Injectable, inject } from '@angular/core';

import {
  CreateExpensePayload,
  Expense,
  UpdateExpensePayload,
} from '../models/expense.model';

import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class ExpensesService {
  private supabaseService = inject(SupabaseService);

  // =========================================================
  // GET ALL EXPENSES
  // =========================================================

  async getExpenses(): Promise<Expense[]> {
    const { data, error } = await this.supabaseService.client
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading expenses:', error);
      throw error;
    }

    return (data ?? []).map((expense) => this.mapExpense(expense));
  }

  // =========================================================
  // CREATE EXPENSE
  // =========================================================

  async createExpense(payload: CreateExpensePayload): Promise<Expense> {
    const { data, error } = await this.supabaseService.client
      .from('expenses')
      .insert({
        title: payload.title,
        description: payload.description || null,
        category: payload.category,
        amount: payload.amount,
        expense_date: payload.expenseDate,
        payment_method: payload.paymentMethod,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating expense:', error);
      throw error;
    }

    return this.mapExpense(data);
  }

  // =========================================================
  // UPDATE EXPENSE
  // =========================================================

  async updateExpense(
    id: number,
    payload: UpdateExpensePayload,
  ): Promise<Expense> {
    const { data, error } = await this.supabaseService.client
      .from('expenses')
      .update({
        title: payload.title,
        description: payload.description || null,
        category: payload.category,
        amount: payload.amount,
        expense_date: payload.expenseDate,
        payment_method: payload.paymentMethod,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating expense:', error);
      throw error;
    }

    return this.mapExpense(data);
  }

  // =========================================================
  // DELETE EXPENSE
  // =========================================================

  async deleteExpense(id: number): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  // =========================================================
  // MAP DATABASE DATA
  // =========================================================

  private mapExpense(expense: any): Expense {
    return {
      id: Number(expense.id),

      title: expense.title,

      description: expense.description,

      category: expense.category,

      amount: Number(expense.amount),

      expenseDate: expense.expense_date,

      paymentMethod: expense.payment_method,

      createdAt: expense.created_at,

      updatedAt: expense.updated_at,
    };
  }
}
