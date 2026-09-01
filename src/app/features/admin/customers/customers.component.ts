import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  orders: number;
  spent: number;
  lastOrder: string;
  type: 'Returning' | 'New';
}

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.scss',
})
export class CustomersComponent {
  customerFilters = ['All', 'Returning', 'New'];

  activeFilter = 'All';
  searchTerm = '';

  currentPage = 1;
  pageSize = 6;

  openMenuId: number | null = null;

  customers: Customer[] = [
    {
      id: 1,
      name: 'Juan Santos',
      phone: '0917 123 1234',
      email: 'juan@example.com',
      orders: 18,
      spent: 4820,
      lastOrder: 'Today',
      type: 'Returning',
    },
    {
      id: 2,
      name: 'Maria Cruz',
      phone: '0918 456 5678',
      email: 'maria@example.com',
      orders: 12,
      spent: 3200,
      lastOrder: 'Today',
      type: 'Returning',
    },
    {
      id: 3,
      name: 'Pedro Reyes',
      phone: '0919 789 9012',
      email: 'pedro@example.com',
      orders: 9,
      spent: 2180,
      lastOrder: 'Yesterday',
      type: 'Returning',
    },
    {
      id: 4,
      name: 'Carlo Mendoza',
      phone: '0920 321 4567',
      email: 'carlo@example.com',
      orders: 1,
      spent: 180,
      lastOrder: 'Today',
      type: 'New',
    },
    {
      id: 5,
      name: 'Sofia Garcia',
      phone: '0921 654 7890',
      email: 'sofia@example.com',
      orders: 7,
      spent: 1960,
      lastOrder: '2 days ago',
      type: 'Returning',
    },
    {
      id: 6,
      name: 'Kevin Ramos',
      phone: '0922 111 2233',
      email: 'kevin@example.com',
      orders: 3,
      spent: 740,
      lastOrder: '3 days ago',
      type: 'Returning',
    },
    {
      id: 7,
      name: 'Anna Flores',
      phone: '0923 444 5566',
      email: 'anna@example.com',
      orders: 1,
      spent: 220,
      lastOrder: '4 days ago',
      type: 'New',
    },
    {
      id: 8,
      name: 'James Aquino',
      phone: '0924 777 8899',
      email: 'james@example.com',
      orders: 15,
      spent: 3920,
      lastOrder: 'Yesterday',
      type: 'Returning',
    },
    {
      id: 9,
      name: 'Nicole Torres',
      phone: '0925 222 3344',
      email: 'nicole@example.com',
      orders: 5,
      spent: 1280,
      lastOrder: '5 days ago',
      type: 'Returning',
    },
    {
      id: 10,
      name: 'Daniel Lopez',
      phone: '0926 555 6677',
      email: 'daniel@example.com',
      orders: 1,
      spent: 160,
      lastOrder: '6 days ago',
      type: 'New',
    },
    {
      id: 11,
      name: 'Claire Navarro',
      phone: '0927 888 9900',
      email: 'claire@example.com',
      orders: 11,
      spent: 2860,
      lastOrder: '1 week ago',
      type: 'Returning',
    },
    {
      id: 12,
      name: 'Paolo Diaz',
      phone: '0928 333 4455',
      email: 'paolo@example.com',
      orders: 2,
      spent: 430,
      lastOrder: '1 week ago',
      type: 'New',
    },
  ];

  // =========================================================
  // FILTERING
  // =========================================================

  get filteredCustomers(): Customer[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.customers.filter((customer) => {
      const matchesSearch =
        !search ||
        customer.name.toLowerCase().includes(search) ||
        customer.phone.toLowerCase().includes(search) ||
        customer.email.toLowerCase().includes(search);

      const matchesFilter =
        this.activeFilter === 'All' || customer.type === this.activeFilter;

      return matchesSearch && matchesFilter;
    });
  }

  // =========================================================
  // PAGINATION
  // =========================================================

  get paginatedCustomers(): Customer[] {
    const start = (this.currentPage - 1) * this.pageSize;

    const end = start + this.pageSize;

    return this.filteredCustomers.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCustomers.length / this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get startItem(): number {
    if (this.filteredCustomers.length === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredCustomers.length,
    );
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

  // =========================================================
  // FILTER
  // =========================================================

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.currentPage = 1;
    this.closeActionMenu();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.activeFilter = 'All';
    this.currentPage = 1;
  }

  // =========================================================
  // PAGINATION
  // =========================================================

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
  // ACTION MENU
  // =========================================================

  toggleActionMenu(id: number): void {
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  closeActionMenu(): void {
    this.openMenuId = null;
  }

  // =========================================================
  // CUSTOMER ACTIONS
  // =========================================================

  viewCustomer(customer: Customer): void {
    this.closeActionMenu();

    console.log('View customer:', customer);

    // Later:
    // Open customer details modal
  }

  editCustomer(customer: Customer): void {
    this.closeActionMenu();

    console.log('Edit customer:', customer);

    // Later:
    // Open edit customer modal
  }

  deleteCustomer(customer: Customer): void {
    const confirmed = window.confirm(
      `Delete "${customer.name}" from the customer list?`,
    );

    if (!confirmed) {
      return;
    }

    this.customers = this.customers.filter((item) => item.id !== customer.id);

    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }

    this.closeActionMenu();
  }

  // =========================================================
  // STATISTICS
  // =========================================================

  get totalCustomers(): number {
    return this.customers.length;
  }

  get newCustomers(): number {
    return this.customers.filter((customer) => customer.type === 'New').length;
  }

  get returningCustomers(): number {
    return this.customers.filter((customer) => customer.type === 'Returning')
      .length;
  }

  get returningRate(): number {
    if (this.totalCustomers === 0) {
      return 0;
    }

    return Math.round((this.returningCustomers / this.totalCustomers) * 100);
  }

  get totalSpent(): number {
    return this.customers.reduce(
      (total, customer) => total + customer.spent,
      0,
    );
  }

  get averageSpend(): number {
    if (this.totalCustomers === 0) {
      return 0;
    }

    return Math.round(this.totalSpent / this.totalCustomers);
  }

  get totalOrders(): number {
    return this.customers.reduce(
      (total, customer) => total + customer.orders,
      0,
    );
  }

  // =========================================================
  // HELPERS
  // =========================================================

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
