import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface SaleTransaction {
  id: string;
  customer: string;
  type: 'Dine In' | 'Take Out';
  payment: 'Cash' | 'GCash' | 'Card';
  amount: number;
  time: string;
  status: 'Completed' | 'Refunded';
}

interface TopItem {
  name: string;
  category: string;
  sold: number;
  revenue: number;
}

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss',
})
export class SalesComponent {
  selectedPeriod = 'Monthly';

  periods = ['Daily', 'Weekly', 'Monthly'];

  stats = {
    today: 12450,
    week: 78200,
    month: 318500,
    year: 3842000,
  };

  salesData = [
    { label: 'Jan', value: 62 },
    { label: 'Feb', value: 71 },
    { label: 'Mar', value: 65 },
    { label: 'Apr', value: 78 },
    { label: 'May', value: 73 },
    { label: 'Jun', value: 86 },
    { label: 'Jul', value: 81 },
    { label: 'Aug', value: 94 },
    { label: 'Sep', value: 69 },
    { label: 'Oct', value: 87 },
    { label: 'Nov', value: 79 },
    { label: 'Dec', value: 100 },
  ];

  orderTypeData = {
    dineIn: 62,
    takeOut: 38,
  };

  paymentData = {
    cash: 48,
    gcash: 37,
    card: 15,
  };

  topItems: TopItem[] = [
    {
      name: 'Tapsilog',
      category: 'Silog Meals',
      sold: 128,
      revenue: 20480,
    },
    {
      name: 'Iced Coffee',
      category: 'Drinks',
      sold: 143,
      revenue: 12155,
    },
    {
      name: 'Longsilog',
      category: 'Silog Meals',
      sold: 96,
      revenue: 14400,
    },
    {
      name: 'Extra Egg',
      category: 'Add-ons',
      sold: 112,
      revenue: 2800,
    },
    {
      name: 'Bangsilog',
      category: 'Silog Meals',
      sold: 82,
      revenue: 13940,
    },
  ];

  transactions: SaleTransaction[] = [
    {
      id: '#KS-00125',
      customer: 'Juan Santos',
      type: 'Dine In',
      payment: 'Cash',
      amount: 350,
      time: '10:42 AM',
      status: 'Completed',
    },
    {
      id: '#KS-00124',
      customer: 'Maria Cruz',
      type: 'Take Out',
      payment: 'GCash',
      amount: 220,
      time: '10:35 AM',
      status: 'Completed',
    },
    {
      id: '#KS-00123',
      customer: 'Pedro Reyes',
      type: 'Dine In',
      payment: 'Card',
      amount: 480,
      time: '10:21 AM',
      status: 'Completed',
    },
    {
      id: '#KS-00122',
      customer: 'Carlo Reyes',
      type: 'Take Out',
      payment: 'Cash',
      amount: 180,
      time: '10:15 AM',
      status: 'Completed',
    },
    {
      id: '#KS-00121',
      customer: 'Sofia Garcia',
      type: 'Dine In',
      payment: 'GCash',
      amount: 520,
      time: '09:58 AM',
      status: 'Completed',
    },
    {
      id: '#KS-00120',
      customer: 'Kevin Ramos',
      type: 'Take Out',
      payment: 'Cash',
      amount: 290,
      time: '09:42 AM',
      status: 'Completed',
    },
    {
      id: '#KS-00119',
      customer: 'Anna Flores',
      type: 'Dine In',
      payment: 'GCash',
      amount: 410,
      time: '09:30 AM',
      status: 'Completed',
    },
    {
      id: '#KS-00118',
      customer: 'James Aquino',
      type: 'Take Out',
      payment: 'Card',
      amount: 360,
      time: '09:18 AM',
      status: 'Refunded',
    },
  ];

  currentPage = 1;
  pageSize = 6;

  // =========================================================
  // PERIOD
  // =========================================================

  setPeriod(period: string): void {
    this.selectedPeriod = period;

    console.log('Sales period changed:', period);

    // Later:
    // Load actual chart data from API
  }

  // =========================================================
  // TRANSACTIONS
  // =========================================================

  get paginatedTransactions(): SaleTransaction[] {
    const start = (this.currentPage - 1) * this.pageSize;

    const end = start + this.pageSize;

    return this.transactions.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.transactions.length / this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get startItem(): number {
    if (this.transactions.length === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.transactions.length);
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
  // SUMMARY
  // =========================================================

  get totalTransactions(): number {
    return this.transactions.length;
  }

  get completedTransactions(): number {
    return this.transactions.filter(
      (transaction) => transaction.status === 'Completed',
    ).length;
  }

  get refundedTransactions(): number {
    return this.transactions.filter(
      (transaction) => transaction.status === 'Refunded',
    ).length;
  }

  get totalTransactionValue(): number {
    return this.transactions
      .filter((transaction) => transaction.status === 'Completed')
      .reduce((total, transaction) => total + transaction.amount, 0);
  }

  // =========================================================
  // HELPERS
  // =========================================================

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  getPaymentIcon(payment: string): string {
    const icons: Record<string, string> = {
      Cash: 'bx-money',
      GCash: 'bx-mobile',
      Card: 'bx-credit-card',
    };

    return icons[payment] || 'bx-wallet';
  }

  getTransactionInitials(name: string): string {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  exportReport(): void {
    console.log('Export sales report');

    // Later:
    // Generate CSV / Excel / PDF report
  }
}
