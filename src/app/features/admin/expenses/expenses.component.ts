import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Expense {
  id: number;
  title: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  time: string;
  payment: PaymentMethod;
}

type ExpenseCategory =
  | 'Inventory'
  | 'Utilities'
  | 'Supplies'
  | 'Rent'
  | 'Payroll'
  | 'Transportation'
  | 'Maintenance'
  | 'Other';

type PaymentMethod = 'Cash' | 'GCash' | 'Bank Transfer' | 'Card';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss',
})
export class ExpensesComponent {
  // =========================================================
  // FILTERS
  // =========================================================

  expenseFilters = [
    'All',
    'Inventory',
    'Utilities',
    'Supplies',
    'Payroll',
    'Other',
  ];

  activeFilter = 'All';
  searchTerm = '';

  // =========================================================
  // PAGINATION
  // =========================================================

  currentPage = 1;
  itemsPerPage = 8;

  // =========================================================
  // MODAL
  // =========================================================

  showModal = false;
  editingExpense: Expense | null = null;

  openMenuId: number | null = null;

  // =========================================================
  // FORM
  // =========================================================

  form = {
    title: '',
    description: '',
    category: 'Inventory' as ExpenseCategory,
    amount: 0,
    date: this.getToday(),
    payment: 'Cash' as PaymentMethod,
  };

  // =========================================================
  // OPTIONS
  // =========================================================

  categories: ExpenseCategory[] = [
    'Inventory',
    'Utilities',
    'Supplies',
    'Rent',
    'Payroll',
    'Transportation',
    'Maintenance',
    'Other',
  ];

  paymentMethods: PaymentMethod[] = ['Cash', 'GCash', 'Bank Transfer', 'Card'];

  // =========================================================
  // SAMPLE DATA
  // =========================================================

  expenses: Expense[] = [
    {
      id: 1,
      title: 'Rice Supply',
      description: '25kg premium rice',
      category: 'Inventory',
      amount: 1850,
      date: '2026-09-07',
      time: '09:30 AM',
      payment: 'Cash',
    },
    {
      id: 2,
      title: 'Electricity Bill',
      description: 'Monthly electricity bill',
      category: 'Utilities',
      amount: 4250,
      date: '2026-09-06',
      time: '02:15 PM',
      payment: 'GCash',
    },
    {
      id: 3,
      title: 'Cooking Oil',
      description: '5 liters cooking oil',
      category: 'Inventory',
      amount: 920,
      date: '2026-09-05',
      time: '10:20 AM',
      payment: 'Cash',
    },
    {
      id: 4,
      title: 'Paper Packaging',
      description: 'Takeout containers and paper bags',
      category: 'Supplies',
      amount: 1350,
      date: '2026-09-04',
      time: '11:45 AM',
      payment: 'Bank Transfer',
    },
    {
      id: 5,
      title: 'Staff Transportation',
      description: 'Delivery and supply pickup',
      category: 'Transportation',
      amount: 650,
      date: '2026-09-03',
      time: '04:10 PM',
      payment: 'Cash',
    },
    {
      id: 6,
      title: 'Cleaning Supplies',
      description: 'Dishwashing liquid and disinfectant',
      category: 'Supplies',
      amount: 780,
      date: '2026-09-02',
      time: '01:20 PM',
      payment: 'GCash',
    },
    {
      id: 7,
      title: 'Gas Refill',
      description: 'LPG refill',
      category: 'Utilities',
      amount: 1100,
      date: '2026-09-01',
      time: '09:10 AM',
      payment: 'Cash',
    },
    {
      id: 8,
      title: 'Kitchen Repair',
      description: 'Minor kitchen equipment repair',
      category: 'Maintenance',
      amount: 1500,
      date: '2026-08-30',
      time: '03:40 PM',
      payment: 'Cash',
    },
  ];

  // =========================================================
  // FILTERED EXPENSES
  // =========================================================

  get filteredExpenses(): Expense[] {
    let result = [...this.expenses];

    if (this.activeFilter !== 'All') {
      result = result.filter(
        (expense) => expense.category === this.activeFilter,
      );
    }

    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase().trim();

      result = result.filter(
        (expense) =>
          expense.title.toLowerCase().includes(search) ||
          expense.description.toLowerCase().includes(search) ||
          expense.category.toLowerCase().includes(search) ||
          expense.payment.toLowerCase().includes(search),
      );
    }

    return result;
  }

  // =========================================================
  // PAGINATED EXPENSES
  // =========================================================

  get paginatedExpenses(): Expense[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;

    const end = start + this.itemsPerPage;

    return this.filteredExpenses.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredExpenses.length / this.itemsPerPage);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get startItem(): number {
    if (this.filteredExpenses.length === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endItem(): number {
    return Math.min(
      this.currentPage * this.itemsPerPage,
      this.filteredExpenses.length,
    );
  }

  // =========================================================
  // SUMMARY
  // =========================================================

  get totalExpenses(): number {
    return this.expenses.reduce((total, expense) => total + expense.amount, 0);
  }

  get averageExpense(): number {
    if (!this.expenses.length) {
      return 0;
    }

    return this.totalExpenses / this.expenses.length;
  }

  get topCategory(): string {
    if (!this.expenses.length) {
      return '—';
    }

    const totals: Record<string, number> = {};

    for (const expense of this.expenses) {
      totals[expense.category] =
        (totals[expense.category] || 0) + expense.amount;
    }

    return Object.entries(totals).sort((a, b) => b[1] - a[1])[0][0];
  }

  get topCategoryAmount(): number {
    if (!this.expenses.length) {
      return 0;
    }

    const totals: Record<string, number> = {};

    for (const expense of this.expenses) {
      totals[expense.category] =
        (totals[expense.category] || 0) + expense.amount;
    }

    return Math.max(...Object.values(totals));
  }

  // =========================================================
  // FILTER
  // =========================================================

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.currentPage = 1;
    this.openMenuId = null;
  }

  // =========================================================
  // SEARCH
  // =========================================================

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.searchTerm = input.value;
    this.currentPage = 1;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.activeFilter = 'All';
    this.currentPage = 1;
  }

  // =========================================================
  // PAGINATION
  // =========================================================

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

  goToPage(page: number): void {
    this.currentPage = page;
  }

  // =========================================================
  // ACTION MENU
  // =========================================================

  toggleActionMenu(id: number): void {
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  // =========================================================
  // ADD EXPENSE
  // =========================================================

  openAddExpense(): void {
    this.editingExpense = null;

    this.form = {
      title: '',
      description: '',
      category: 'Inventory',
      amount: 0,
      date: this.getToday(),
      payment: 'Cash',
    };

    this.showModal = true;
    this.openMenuId = null;
  }

  // =========================================================
  // EDIT EXPENSE
  // =========================================================

  editExpense(expense: Expense): void {
    this.editingExpense = expense;

    this.form = {
      title: expense.title,
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      payment: expense.payment,
    };

    this.showModal = true;
    this.openMenuId = null;
  }

  // =========================================================
  // VIEW EXPENSE
  // =========================================================

  viewExpense(expense: Expense): void {
    alert(
      `${expense.title}\n\n` +
        `Category: ${expense.category}\n` +
        `Amount: ${this.formatCurrency(expense.amount)}\n` +
        `Date: ${expense.date}\n` +
        `Payment: ${expense.payment}\n\n` +
        `${expense.description}`,
    );

    this.openMenuId = null;
  }

  // =========================================================
  // DELETE
  // =========================================================

  deleteExpense(expense: Expense): void {
    const confirmed = confirm(`Delete "${expense.title}"?`);

    if (!confirmed) {
      return;
    }

    this.expenses = this.expenses.filter((item) => item.id !== expense.id);

    this.openMenuId = null;

    if (this.currentPage > this.totalPages && this.currentPage > 1) {
      this.currentPage--;
    }
  }

  // =========================================================
  // SAVE
  // =========================================================

  saveExpense(): void {
    if (!this.form.title.trim() || this.form.amount <= 0 || !this.form.date) {
      alert('Please complete the required fields.');

      return;
    }

    if (this.editingExpense) {
      this.editingExpense.title = this.form.title.trim();

      this.editingExpense.description = this.form.description.trim();

      this.editingExpense.category = this.form.category;

      this.editingExpense.amount = Number(this.form.amount);

      this.editingExpense.date = this.form.date;

      this.editingExpense.payment = this.form.payment;
    } else {
      const newExpense: Expense = {
        id: this.getNextId(),

        title: this.form.title.trim(),

        description: this.form.description.trim(),

        category: this.form.category,

        amount: Number(this.form.amount),

        date: this.form.date,

        time: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),

        payment: this.form.payment,
      };

      this.expenses.unshift(newExpense);
    }

    this.closeModal();
  }

  // =========================================================
  // MODAL
  // =========================================================

  closeModal(): void {
    this.showModal = false;
    this.editingExpense = null;
  }

  // =========================================================
  // HELPERS
  // =========================================================

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(value);
  }

  getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  getNextId(): number {
    if (!this.expenses.length) {
      return 1;
    }

    return Math.max(...this.expenses.map((expense) => expense.id)) + 1;
  }

  getCategoryIcon(category: ExpenseCategory): string {
    switch (category) {
      case 'Inventory':
        return 'bx-package';

      case 'Utilities':
        return 'bx-bulb';

      case 'Supplies':
        return 'bx-box';

      case 'Rent':
        return 'bx-home';

      case 'Payroll':
        return 'bx-group';

      case 'Transportation':
        return 'bx-car';

      case 'Maintenance':
        return 'bx-wrench';

      default:
        return 'bx-receipt';
    }
  }

  getPaymentIcon(payment: PaymentMethod): string {
    switch (payment) {
      case 'Cash':
        return 'bx-money';

      case 'GCash':
        return 'bx-mobile';

      case 'Bank Transfer':
        return 'bx-transfer';

      case 'Card':
        return 'bx-credit-card';

      default:
        return 'bx-wallet';
    }
  }
}
