import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Order {
  id: string;
  customer: string;
  type: 'Dine In' | 'Take Out';
  items: number;
  total: number;
  payment: 'Paid' | 'Pending';
  status: 'New' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
  time: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent {
  /* ==========================================
     FILTER
  ========================================== */

  activeFilter = 'All';

  filters = ['All', 'New', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

  /* ==========================================
     SEARCH
  ========================================== */

  searchTerm = '';

  /* ==========================================
     PAGINATION
  ========================================== */

  currentPage = 1;

  pageSize = 5;

  /* ==========================================
     ORDERS
  ========================================== */

  orders: Order[] = [
    {
      id: '#KS-00125',
      customer: 'Juan Santos',
      type: 'Dine In',
      items: 3,
      total: 350,
      payment: 'Paid',
      status: 'Preparing',
      time: '10:42 AM',
    },

    {
      id: '#KS-00124',
      customer: 'Maria Cruz',
      type: 'Take Out',
      items: 2,
      total: 220,
      payment: 'Paid',
      status: 'Ready',
      time: '10:35 AM',
    },

    {
      id: '#KS-00123',
      customer: 'Pedro Reyes',
      type: 'Dine In',
      items: 4,
      total: 480,
      payment: 'Paid',
      status: 'Completed',
      time: '10:21 AM',
    },

    {
      id: '#KS-00122',
      customer: 'Carlo Reyes',
      type: 'Take Out',
      items: 1,
      total: 180,
      payment: 'Pending',
      status: 'New',
      time: '10:15 AM',
    },

    {
      id: '#KS-00121',
      customer: 'Ana Garcia',
      type: 'Dine In',
      items: 2,
      total: 240,
      payment: 'Paid',
      status: 'Completed',
      time: '10:02 AM',
    },

    {
      id: '#KS-00120',
      customer: 'Mark Dela Cruz',
      type: 'Take Out',
      items: 3,
      total: 330,
      payment: 'Paid',
      status: 'Preparing',
      time: '9:55 AM',
    },

    {
      id: '#KS-00119',
      customer: 'Sofia Ramos',
      type: 'Dine In',
      items: 5,
      total: 620,
      payment: 'Paid',
      status: 'Completed',
      time: '9:42 AM',
    },

    {
      id: '#KS-00118',
      customer: 'Kevin Santos',
      type: 'Take Out',
      items: 2,
      total: 260,
      payment: 'Pending',
      status: 'New',
      time: '9:35 AM',
    },

    {
      id: '#KS-00117',
      customer: 'Angela Reyes',
      type: 'Dine In',
      items: 3,
      total: 390,
      payment: 'Paid',
      status: 'Ready',
      time: '9:21 AM',
    },

    {
      id: '#KS-00116',
      customer: 'Daniel Cruz',
      type: 'Take Out',
      items: 4,
      total: 450,
      payment: 'Paid',
      status: 'Completed',
      time: '9:10 AM',
    },

    {
      id: '#KS-00115',
      customer: 'Michelle Garcia',
      type: 'Dine In',
      items: 2,
      total: 210,
      payment: 'Paid',
      status: 'Preparing',
      time: '8:58 AM',
    },

    {
      id: '#KS-00114',
      customer: 'John Reyes',
      type: 'Take Out',
      items: 1,
      total: 150,
      payment: 'Pending',
      status: 'New',
      time: '8:45 AM',
    },

    {
      id: '#KS-00113',
      customer: 'Christine Santos',
      type: 'Dine In',
      items: 4,
      total: 520,
      payment: 'Paid',
      status: 'Completed',
      time: '8:31 AM',
    },

    {
      id: '#KS-00112',
      customer: 'Ryan Dela Cruz',
      type: 'Take Out',
      items: 2,
      total: 230,
      payment: 'Paid',
      status: 'Ready',
      time: '8:20 AM',
    },

    {
      id: '#KS-00111',
      customer: 'Patricia Ramos',
      type: 'Dine In',
      items: 3,
      total: 370,
      payment: 'Paid',
      status: 'Preparing',
      time: '8:08 AM',
    },
  ];

  /* ==========================================
     FILTERED ORDERS
  ========================================== */

  get filteredOrders(): Order[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.orders.filter((order) => {
      const matchesFilter =
        this.activeFilter === 'All' || order.status === this.activeFilter;

      const matchesSearch =
        !search ||
        order.id.toLowerCase().includes(search) ||
        order.customer.toLowerCase().includes(search) ||
        order.type.toLowerCase().includes(search) ||
        order.status.toLowerCase().includes(search) ||
        order.payment.toLowerCase().includes(search);

      return matchesFilter && matchesSearch;
    });
  }

  /* ==========================================
     PAGINATED ORDERS
  ========================================== */

  get paginatedOrders(): Order[] {
    const start = (this.currentPage - 1) * this.pageSize;

    const end = start + this.pageSize;

    return this.filteredOrders.slice(start, end);
  }

  /* ==========================================
     TOTAL PAGES
  ========================================== */

  get totalPages(): number {
    return Math.ceil(this.filteredOrders.length / this.pageSize);
  }

  /* ==========================================
     PAGE NUMBERS
  ========================================== */

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  /* ==========================================
     FILTER
  ========================================== */

  setFilter(filter: string): void {
    this.activeFilter = filter;

    // Reset pagination
    this.currentPage = 1;
  }

  /* ==========================================
     SEARCH
  ========================================== */

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.searchTerm = input.value;

    // Reset pagination
    this.currentPage = 1;
  }

  /* ==========================================
     PAGINATION
  ========================================== */

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

  /* ==========================================
     TABLE RANGE
  ========================================== */

  get startItem(): number {
    if (this.filteredOrders.length === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredOrders.length,
    );
  }

  /* ==========================================
     SUMMARY
  ========================================== */

  get todayOrders(): number {
    return this.orders.length;
  }

  get pendingOrders(): number {
    return this.orders.filter((order) => order.status === 'New').length;
  }

  get preparingOrders(): number {
    return this.orders.filter((order) => order.status === 'Preparing').length;
  }

  get completedOrders(): number {
    return this.orders.filter((order) => order.status === 'Completed').length;
  }

  /* ==========================================
     CURRENCY
  ========================================== */

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
