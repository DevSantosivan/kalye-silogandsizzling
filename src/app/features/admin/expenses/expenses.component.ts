import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import {
  Expense,
  ExpenseCategory,
  PaymentMethod,
} from '../../../core/models/expense.model';

import { ExpensesService } from '../../../core/services/expenses.service';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss',
})
export class ExpensesComponent implements OnInit {
  private expensesService = inject(ExpensesService);

  // =========================================================
  // DATA
  // =========================================================

  expenses: Expense[] = [];

  loading = false;
  deletingId: number | null = null;
  errorMessage = '';

  // =========================================================
  // ADD EXPENSE MODAL
  // =========================================================

  showAddExpenseModal = false;
  savingExpense = false;

  expenseCategories: ExpenseCategory[] = [
    'Inventory',
    'Utilities',
    'Supplies',
    'Rent',
    'Payroll',
    'Transportation',
    'Maintenance',
    'Other',
  ];

  paymentMethodOptions: PaymentMethod[] = [
    'Cash',
    'GCash',
    'Bank Transfer',
    'Card',
  ];

  newExpense: {
    title: string;
    description: string;
    category: ExpenseCategory;
    amount: number | null;
    expenseDate: string;
    paymentMethod: PaymentMethod;
  } = this.getEmptyExpense();

  // =========================================================
  // PERIOD
  // =========================================================

  selectedPeriod: 'Monthly' | 'Weekly' | 'Daily' = 'Monthly';

  periods: Array<'Monthly' | 'Weekly' | 'Daily'> = [
    'Monthly',
    'Weekly',
    'Daily',
  ];

  // =========================================================
  // PAGINATION
  // =========================================================

  currentPage = 1;
  pageSize = 10;

  // =========================================================
  // SUMMARY
  // =========================================================

  stats = {
    today: 0,
    week: 0,
    month: 0,
    year: 0,
  };

  // =========================================================
  // CATEGORY BREAKDOWN
  // =========================================================

  categoryBreakdown: {
    category: string;
    description: string;
    amount: number;
    percentage: number;
    icon: string;
    className: string;
  }[] = [];

  // =========================================================
  // PAYMENT METHODS
  // =========================================================

  paymentMethods: {
    method: PaymentMethod;
    amount: number;
    percentage: number;
    icon: string;
    description: string;
  }[] = [];

  // =========================================================
  // CHART
  // =========================================================

  chartData: {
    label: string;
    value: number;
    amount: number;
  }[] = [];

  chartTotal = 0;

  // =========================================================
  // TOP EXPENSES
  // =========================================================

  topExpenses: Expense[] = [];

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  async ngOnInit(): Promise<void> {
    await this.loadExpenses();
  }

  // =========================================================
  // GET EXPENSES
  // =========================================================

  async loadExpenses(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      this.expenses = await this.expensesService.getExpenses();

      this.calculateAll();

      // Make sure pagination remains valid
      if (this.currentPage > this.totalPages) {
        this.currentPage = Math.max(1, this.totalPages);
      }
    } catch (error) {
      console.error('Failed to load expenses:', error);

      this.errorMessage = 'Unable to load expenses. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  // =========================================================
  // CALCULATE EVERYTHING
  // =========================================================

  private calculateAll(): void {
    this.calculateSummary();
    this.calculateCategoryBreakdown();
    this.calculatePaymentMethods();
    this.calculateChart();
    this.calculateTopExpenses();
  }

  // =========================================================
  // ADD EXPENSE MODAL
  // =========================================================

  private getEmptyExpense() {
    const today = new Date();

    const year = today.getFullYear();

    const month = String(today.getMonth() + 1).padStart(2, '0');

    const day = String(today.getDate()).padStart(2, '0');

    return {
      title: '',
      description: '',
      category: 'Inventory' as ExpenseCategory,
      amount: null,
      expenseDate: `${year}-${month}-${day}`,
      paymentMethod: 'Cash' as PaymentMethod,
    };
  }

  // =========================================================
  // OPEN ADD MODAL
  // =========================================================

  openAddExpenseModal(): void {
    this.newExpense = this.getEmptyExpense();

    this.showAddExpenseModal = true;

    document.body.style.overflow = 'hidden';
  }

  // =========================================================
  // CLOSE ADD MODAL
  // =========================================================

  closeAddExpenseModal(): void {
    if (this.savingExpense) {
      return;
    }

    this.showAddExpenseModal = false;

    document.body.style.overflow = '';

    this.newExpense = this.getEmptyExpense();
  }

  // =========================================================
  // SAVE EXPENSE
  // =========================================================

  async saveExpense(): Promise<void> {
    if (this.savingExpense) {
      return;
    }

    const title = this.newExpense.title.trim();

    const description = this.newExpense.description.trim();

    const amount = Number(this.newExpense.amount);

    const expenseDate = this.newExpense.expenseDate;

    const category = this.newExpense.category;

    const paymentMethod = this.newExpense.paymentMethod;

    // =======================================================
    // VALIDATION
    // =======================================================

    if (!title) {
      await Swal.fire({
        icon: 'warning',
        title: 'Missing title',
        text: 'Please enter an expense title.',
        confirmButtonText: 'Okay',
        confirmButtonColor: '#191919',
      });

      return;
    }

    if (!category) {
      await Swal.fire({
        icon: 'warning',
        title: 'Missing category',
        text: 'Please select an expense category.',
        confirmButtonText: 'Okay',
        confirmButtonColor: '#191919',
      });

      return;
    }

    if (!amount || amount <= 0 || !Number.isFinite(amount)) {
      await Swal.fire({
        icon: 'warning',
        title: 'Invalid amount',
        text: 'Please enter an amount greater than ₱0.00.',
        confirmButtonText: 'Okay',
        confirmButtonColor: '#191919',
      });

      return;
    }

    if (!expenseDate) {
      await Swal.fire({
        icon: 'warning',
        title: 'Missing date',
        text: 'Please select the expense date.',
        confirmButtonText: 'Okay',
        confirmButtonColor: '#191919',
      });

      return;
    }

    if (!paymentMethod) {
      await Swal.fire({
        icon: 'warning',
        title: 'Missing payment method',
        text: 'Please select a payment method.',
        confirmButtonText: 'Okay',
        confirmButtonColor: '#191919',
      });

      return;
    }

    // =======================================================
    // START SAVING
    // =======================================================

    this.savingExpense = true;

    try {
      await this.expensesService.createExpense({
        title,
        description,
        category,
        amount,
        expenseDate,
        paymentMethod,
      });

      // =====================================================
      // RESET UI
      // =====================================================

      this.showAddExpenseModal = false;

      document.body.style.overflow = '';

      this.newExpense = this.getEmptyExpense();

      // =====================================================
      // RELOAD DATA
      // =====================================================

      await this.loadExpenses();

      // =====================================================
      // SUCCESS ALERT
      // =====================================================

      await Swal.fire({
        icon: 'success',
        title: 'Expense added',
        text: 'The expense has been successfully recorded.',
        confirmButtonText: 'Done',
        confirmButtonColor: '#191919',
        timer: 2200,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error('Failed to create expense:', error);

      await Swal.fire({
        icon: 'error',
        title: 'Unable to add expense',
        text: 'Something went wrong while saving the expense. Please try again.',
        confirmButtonText: 'Okay',
        confirmButtonColor: '#191919',
      });
    } finally {
      this.savingExpense = false;
    }
  }

  // =========================================================
  // SUMMARY
  // TODAY / WEEK / MONTH / YEAR
  // =========================================================

  private calculateSummary(): void {
    const today = this.startOfDay(new Date());

    const weekStart = this.startOfWeek(today);

    const weekEnd = this.endOfWeek(today);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const monthEnd = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const yearStart = new Date(today.getFullYear(), 0, 1);

    const yearEnd = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);

    this.stats.today = this.sumExpenses(
      this.expenses.filter((expense) =>
        this.isDateBetween(expense.expenseDate, today, today),
      ),
    );

    this.stats.week = this.sumExpenses(
      this.expenses.filter((expense) =>
        this.isDateBetween(expense.expenseDate, weekStart, weekEnd),
      ),
    );

    this.stats.month = this.sumExpenses(
      this.expenses.filter((expense) =>
        this.isDateBetween(expense.expenseDate, monthStart, monthEnd),
      ),
    );

    this.stats.year = this.sumExpenses(
      this.expenses.filter((expense) =>
        this.isDateBetween(expense.expenseDate, yearStart, yearEnd),
      ),
    );
  }

  // =========================================================
  // CATEGORY BREAKDOWN
  // =========================================================

  private calculateCategoryBreakdown(): void {
    const categoryMap = new Map<string, number>();

    for (const expense of this.expenses) {
      const current = categoryMap.get(expense.category) ?? 0;

      categoryMap.set(expense.category, current + Number(expense.amount));
    }

    const total = this.expensesTotal();

    const categoryDescriptions: Record<string, string> = {
      Inventory: 'Food & inventory purchases',
      Utilities: 'Electricity, water & internet',
      Supplies: 'Restaurant supplies',
      Rent: 'Store rental costs',
      Payroll: 'Employee wages',
      Transportation: 'Delivery & transportation',
      Maintenance: 'Repairs & maintenance',
      Other: 'Miscellaneous expenses',
    };

    const categoryIcons: Record<string, string> = {
      Inventory: 'bx-package',
      Utilities: 'bx-bulb',
      Supplies: 'bx-store',
      Rent: 'bx-building',
      Payroll: 'bx-group',
      Transportation: 'bx-car',
      Maintenance: 'bx-wrench',
      Other: 'bx-dots-horizontal-rounded',
    };

    const categoryClasses: Record<string, string> = {
      Inventory: 'inventory',
      Utilities: 'utilities',
      Supplies: 'supplies',
      Rent: 'rent',
      Payroll: 'payroll',
      Transportation: 'transportation',
      Maintenance: 'maintenance',
      Other: 'other',
    };

    this.categoryBreakdown = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({
        category,
        description: categoryDescriptions[category] ?? 'Business expense',
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
        icon: categoryIcons[category] ?? 'bx-receipt',
        className: categoryClasses[category] ?? 'other',
      }));
  }

  // =========================================================
  // PAYMENT METHODS
  // =========================================================

  private calculatePaymentMethods(): void {
    const paymentMap = new Map<PaymentMethod, number>();

    for (const expense of this.expenses) {
      const current = paymentMap.get(expense.paymentMethod) ?? 0;

      paymentMap.set(expense.paymentMethod, current + Number(expense.amount));
    }

    const total = this.expensesTotal();

    const paymentIcons: Record<PaymentMethod, string> = {
      Cash: 'bx-money',
      GCash: 'bx-mobile',
      'Bank Transfer': 'bx-transfer',
      Card: 'bx-credit-card',
    };

    const paymentDescriptions: Record<PaymentMethod, string> = {
      Cash: 'Cash payments',
      GCash: 'Digital wallet payments',
      'Bank Transfer': 'Bank transactions',
      Card: 'Debit / credit card payments',
    };

    this.paymentMethods = Array.from(paymentMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([method, amount]) => ({
        method,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
        icon: paymentIcons[method],
        description: paymentDescriptions[method],
      }));
  }

  // =========================================================
  // CHART
  // =========================================================

  setPeriod(period: 'Monthly' | 'Weekly' | 'Daily'): void {
    this.selectedPeriod = period;

    this.calculateChart();
  }

  private calculateChart(): void {
    if (this.selectedPeriod === 'Monthly') {
      this.calculateMonthlyChart();

      return;
    }

    if (this.selectedPeriod === 'Weekly') {
      this.calculateWeeklyChart();

      return;
    }

    this.calculateDailyChart();
  }

  // =========================================================
  // MONTHLY CHART
  // =========================================================

  private calculateMonthlyChart(): void {
    const currentYear = new Date().getFullYear();

    const months = [
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

    const values = Array(12).fill(0);

    for (const expense of this.expenses) {
      const date = this.parseExpenseDate(expense.expenseDate);

      if (date.getFullYear() !== currentYear) {
        continue;
      }

      values[date.getMonth()] += Number(expense.amount);
    }

    this.chartTotal = values.reduce(
      (sum: number, value: number) => sum + value,
      0,
    );

    const max = Math.max(...values, 1);

    this.chartData = values.map((amount: number, index: number) => ({
      label: months[index],
      amount,
      value: (amount / max) * 100,
    }));
  }

  // =========================================================
  // WEEKLY CHART
  // =========================================================

  private calculateWeeklyChart(): void {
    const today = this.startOfDay(new Date());

    const weekStart = this.startOfWeek(today);

    const weekEnd = this.endOfWeek(today);

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const values = Array(7).fill(0);

    for (const expense of this.expenses) {
      const date = this.parseExpenseDate(expense.expenseDate);

      if (date >= weekStart && date <= weekEnd) {
        const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;

        values[dayIndex] += Number(expense.amount);
      }
    }

    this.chartTotal = values.reduce(
      (sum: number, value: number) => sum + value,
      0,
    );

    const max = Math.max(...values, 1);

    this.chartData = values.map((amount: number, index: number) => ({
      label: labels[index],
      amount,
      value: (amount / max) * 100,
    }));
  }

  // =========================================================
  // DAILY CHART
  // =========================================================

  private calculateDailyChart(): void {
    const today = this.startOfDay(new Date());

    const values = Array(24).fill(0);

    for (const expense of this.expenses) {
      const date = this.parseExpenseDate(expense.expenseDate);

      if (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
      ) {
        const hour = date.getHours();

        values[hour] += Number(expense.amount);
      }
    }

    this.chartTotal = values.reduce(
      (sum: number, value: number) => sum + value,
      0,
    );

    const max = Math.max(...values, 1);

    this.chartData = values.map((amount: number, index: number) => ({
      label: `${index}:00`,
      amount,
      value: (amount / max) * 100,
    }));
  }

  // =========================================================
  // TOP EXPENSES
  // =========================================================

  private calculateTopExpenses(): void {
    this.topExpenses = [...this.expenses]
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5);
  }

  // =========================================================
  // TOTAL EXPENSES
  // =========================================================

  expensesTotal(): number {
    return this.expenses.reduce(
      (total, expense) => total + Number(expense.amount),
      0,
    );
  }

  // =========================================================
  // CATEGORY TOTAL
  // =========================================================

  getCategoryAmount(category: ExpenseCategory): number {
    return this.expenses
      .filter((expense) => expense.category === category)
      .reduce((total, expense) => total + Number(expense.amount), 0);
  }

  // =========================================================
  // PAYMENT TOTAL
  // =========================================================

  getPaymentAmount(method: PaymentMethod): number {
    return this.expenses
      .filter((expense) => expense.paymentMethod === method)
      .reduce((total, expense) => total + Number(expense.amount), 0);
  }

  // =========================================================
  // PAGINATION
  // =========================================================

  get paginatedExpenses(): Expense[] {
    const start = (this.currentPage - 1) * this.pageSize;

    const end = start + this.pageSize;

    return this.expenses.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.expenses.length / this.pageSize);
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
    if (this.expenses.length === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.expenses.length);
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
  // DELETE
  // =========================================================

  async deleteExpense(expense: Expense): Promise<void> {
    const result = await Swal.fire({
      icon: 'warning',

      title: 'Delete expense?',

      html: `
        <p style="margin: 0;">
          Are you sure you want to delete
          <strong>"${this.escapeHtml(expense.title)}"</strong>?
        </p>

        <p
          style="
            margin: 8px 0 0;
            color: #777;
          "
        >
          This action cannot be undone.
        </p>
      `,

      showCancelButton: true,

      confirmButtonText: 'Yes, delete',

      cancelButtonText: 'Cancel',

      confirmButtonColor: '#d64545',

      cancelButtonColor: '#f1f1ef',

      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    this.deletingId = expense.id;

    try {
      await this.expensesService.deleteExpense(expense.id);

      this.expenses = this.expenses.filter((item) => item.id !== expense.id);

      if (this.currentPage > this.totalPages) {
        this.currentPage = Math.max(1, this.totalPages);
      }

      this.calculateAll();

      await Swal.fire({
        icon: 'success',

        title: 'Expense deleted',

        text: 'The expense has been removed successfully.',

        confirmButtonText: 'Done',

        confirmButtonColor: '#191919',

        timer: 1800,

        timerProgressBar: true,
      });
    } catch (error) {
      console.error('Failed to delete expense:', error);

      await Swal.fire({
        icon: 'error',

        title: 'Delete failed',

        text: 'Failed to delete the expense. Please try again.',

        confirmButtonText: 'Okay',

        confirmButtonColor: '#191919',
      });
    } finally {
      this.deletingId = null;
    }
  }

  // =========================================================
  // EXPORT CSV
  // =========================================================

  exportReport(): void {
    if (this.expenses.length === 0) {
      Swal.fire({
        icon: 'info',

        title: 'No expenses',

        text: 'There are no expenses to export.',

        confirmButtonText: 'Okay',

        confirmButtonColor: '#191919',
      });

      return;
    }

    const headers = [
      'ID',
      'Title',
      'Description',
      'Category',
      'Amount',
      'Expense Date',
      'Payment Method',
      'Created At',
    ];

    const rows = this.expenses.map((expense) => [
      expense.id,
      expense.title,
      expense.description ?? '',
      expense.category,
      expense.amount,
      expense.expenseDate,
      expense.paymentMethod,
      expense.createdAt,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => this.escapeCsvValue(value)).join(','))
      .join('\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;

    link.download = `expenses-report-${this.formatFileDate(new Date())}.csv`;

    link.click();

    URL.revokeObjectURL(url);

    Swal.fire({
      icon: 'success',

      title: 'Report exported',

      text: 'Your expense report has been downloaded.',

      confirmButtonText: 'Done',

      confirmButtonColor: '#191919',

      timer: 1800,

      timerProgressBar: true,
    });
  }

  // =========================================================
  // CSV ESCAPE
  // =========================================================

  private escapeCsvValue(value: unknown): string {
    const stringValue = String(value ?? '');

    if (
      stringValue.includes(',') ||
      stringValue.includes('"') ||
      stringValue.includes('\n')
    ) {
      return `"${stringValue.replaceAll('"', '""')}"`;
    }

    return stringValue;
  }

  // =========================================================
  // ESCAPE HTML
  // =========================================================

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  // =========================================================
  // FORMAT CURRENCY
  // =========================================================

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  // =========================================================
  // FORMAT DATE
  // =========================================================

  formatDate(date: string): string {
    const parsed = this.parseExpenseDate(date);

    return new Intl.DateTimeFormat('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(parsed);
  }

  // =========================================================
  // FORMAT TOP EXPENSE DATE
  // =========================================================

  formatRelativeDate(date: string): string {
    const expenseDate = this.startOfDay(this.parseExpenseDate(date));

    const today = this.startOfDay(new Date());

    const diff = Math.round(
      (today.getTime() - expenseDate.getTime()) / 86400000,
    );

    if (diff === 0) {
      return 'Today';
    }

    if (diff === 1) {
      return 'Yesterday';
    }

    if (diff >= 2 && diff <= 7) {
      return 'This week';
    }

    if (
      expenseDate.getMonth() === today.getMonth() &&
      expenseDate.getFullYear() === today.getFullYear()
    ) {
      return 'This month';
    }

    return this.formatDate(date);
  }

  // =========================================================
  // INITIALS
  // =========================================================

  getExpenseInitials(title: string): string {
    if (!title) {
      return 'EX';
    }

    const words = title.trim().split(/\s+/).filter(Boolean);

    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }

    return (words[0][0] + words[1][0]).toUpperCase();
  }

  // =========================================================
  // CATEGORY ICON
  // =========================================================

  getCategoryIcon(category: ExpenseCategory): string {
    const icons: Record<ExpenseCategory, string> = {
      Inventory: 'bx-package',
      Utilities: 'bx-bulb',
      Supplies: 'bx-store',
      Rent: 'bx-building',
      Payroll: 'bx-group',
      Transportation: 'bx-car',
      Maintenance: 'bx-wrench',
      Other: 'bx-dots-horizontal-rounded',
    };

    return icons[category] ?? 'bx-receipt';
  }

  // =========================================================
  // DONUT GRADIENT
  // =========================================================

  getCategoryDonut(): string {
    if (this.categoryBreakdown.length === 0) {
      return 'conic-gradient(#e9e7e3 0% 100%)';
    }

    const donutColors = ['#191919', '#6f6f6f', '#aaa8a3', '#d0cec8', '#e9e7e3'];

    let current = 0;

    const segments = this.categoryBreakdown.slice(0, 5).map((item, index) => {
      const start = current;

      current += item.percentage;

      return `${donutColors[index]} ${start}% ${current}%`;
    });

    if (current < 100) {
      segments.push(`#e9e7e3 ${current}% 100%`);
    }

    return `conic-gradient(${segments.join(', ')})`;
  }

  // =========================================================
  // DONUT CENTER
  // =========================================================

  getTopCategoryName(): string {
    return this.categoryBreakdown[0]?.category ?? 'No expenses';
  }

  getTopCategoryPercentage(): number {
    return this.categoryBreakdown[0]?.percentage ?? 0;
  }

  // =========================================================
  // DATE HELPERS
  // =========================================================

  private parseExpenseDate(value: string): Date {
    if (!value) {
      return new Date();
    }

    // Handles YYYY-MM-DD without
    // timezone shifting.

    const datePart = value.split('T')[0];

    const parts = datePart.split('-');

    if (parts.length === 3) {
      const year = Number(parts[0]);

      const month = Number(parts[1]) - 1;

      const day = Number(parts[2]);

      return new Date(year, month, day);
    }

    return new Date(value);
  }

  private startOfDay(date: Date): Date {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0,
      0,
    );
  }

  private startOfWeek(date: Date): Date {
    const result = this.startOfDay(date);

    const day = result.getDay();

    const diff = day === 0 ? -6 : 1 - day;

    result.setDate(result.getDate() + diff);

    return result;
  }

  private endOfWeek(date: Date): Date {
    const result = this.startOfWeek(date);

    result.setDate(result.getDate() + 6);

    result.setHours(23, 59, 59, 999);

    return result;
  }

  private isDateBetween(value: string, start: Date, end: Date): boolean {
    const date = this.parseExpenseDate(value);

    return date >= start && date <= end;
  }

  private sumExpenses(expenses: Expense[]): number {
    return expenses.reduce(
      (total, expense) => total + Number(expense.amount),
      0,
    );
  }

  private formatFileDate(date: Date): string {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, '0');

    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // =========================================================
  // TRACKING
  // =========================================================

  trackExpense(_index: number, expense: Expense): number {
    return expense.id;
  }

  trackChart(
    _index: number,
    item: {
      label: string;
      value: number;
      amount: number;
    },
  ): string {
    return item.label;
  }

  trackCategory(
    _index: number,
    item: {
      category: string;
      description: string;
      amount: number;
      percentage: number;
      icon: string;
      className: string;
    },
  ): string {
    return item.category;
  }

  trackPayment(
    _index: number,
    item: {
      method: PaymentMethod;
      amount: number;
      percentage: number;
      icon: string;
      description: string;
    },
  ): string {
    return item.method;
  }
}
