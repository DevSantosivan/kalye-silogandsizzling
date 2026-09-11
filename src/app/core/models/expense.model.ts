// =========================================================
// EXPENSE CATEGORY
// =========================================================

export type ExpenseCategory =
  | 'Inventory'
  | 'Utilities'
  | 'Supplies'
  | 'Rent'
  | 'Payroll'
  | 'Transportation'
  | 'Maintenance'
  | 'Other';

// =========================================================
// PAYMENT METHOD
// =========================================================

export type PaymentMethod = 'Cash' | 'GCash' | 'Bank Transfer' | 'Card';

// =========================================================
// EXPENSE
// =========================================================

export interface Expense {
  id: number;

  title: string;

  description: string | null;

  category: ExpenseCategory;

  amount: number;

  expenseDate: string;

  paymentMethod: PaymentMethod;

  createdAt: string;

  updatedAt: string;
}

// =========================================================
// CREATE EXPENSE PAYLOAD
// =========================================================

export interface CreateExpensePayload {
  title: string;

  description?: string;

  category: ExpenseCategory;

  amount: number;

  expenseDate: string;

  paymentMethod: PaymentMethod;
}

// =========================================================
// UPDATE EXPENSE PAYLOAD
// =========================================================

export interface UpdateExpensePayload {
  title: string;

  description?: string;

  category: ExpenseCategory;

  amount: number;

  expenseDate: string;

  paymentMethod: PaymentMethod;
}
