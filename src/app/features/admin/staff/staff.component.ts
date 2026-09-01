import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Staff {
  id: number;
  name: string;
  role: 'Admin' | 'Cashier' | 'Kitchen Staff' | 'Staff';
  email: string;
  status: 'Active' | 'Inactive';
  joined: string;
}

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './staff.component.html',
  styleUrl: './staff.component.scss',
})
export class StaffComponent {
  roleFilters = ['All', 'Admin', 'Cashier', 'Kitchen Staff', 'Staff'];

  statusFilters = ['All', 'Active', 'Inactive'];

  activeRole = 'All';
  activeStatus = 'All';
  searchTerm = '';

  currentPage = 1;
  pageSize = 6;

  openMenuId: number | null = null;

  staff: Staff[] = [
    {
      id: 1,
      name: 'Anna Reyes',
      role: 'Cashier',
      email: 'anna@kalyesilog.com',
      status: 'Active',
      joined: 'Aug 12, 2026',
    },
    {
      id: 2,
      name: 'Mark Santos',
      role: 'Kitchen Staff',
      email: 'mark@kalyesilog.com',
      status: 'Active',
      joined: 'Aug 18, 2026',
    },
    {
      id: 3,
      name: 'James Cruz',
      role: 'Staff',
      email: 'james@kalyesilog.com',
      status: 'Inactive',
      joined: 'Jul 21, 2026',
    },
    {
      id: 4,
      name: 'Maria Lopez',
      role: 'Kitchen Staff',
      email: 'maria@kalyesilog.com',
      status: 'Active',
      joined: 'Jul 15, 2026',
    },
    {
      id: 5,
      name: 'Kevin Garcia',
      role: 'Cashier',
      email: 'kevin@kalyesilog.com',
      status: 'Active',
      joined: 'Jun 30, 2026',
    },
    {
      id: 6,
      name: 'Sofia Mendoza',
      role: 'Admin',
      email: 'sofia@kalyesilog.com',
      status: 'Active',
      joined: 'Jun 20, 2026',
    },
    {
      id: 7,
      name: 'Daniel Flores',
      role: 'Kitchen Staff',
      email: 'daniel@kalyesilog.com',
      status: 'Active',
      joined: 'Jun 14, 2026',
    },
    {
      id: 8,
      name: 'Nicole Ramos',
      role: 'Staff',
      email: 'nicole@kalyesilog.com',
      status: 'Inactive',
      joined: 'May 28, 2026',
    },
    {
      id: 9,
      name: 'Carlo Aquino',
      role: 'Cashier',
      email: 'carlo@kalyesilog.com',
      status: 'Active',
      joined: 'May 17, 2026',
    },
    {
      id: 10,
      name: 'Jenny Torres',
      role: 'Kitchen Staff',
      email: 'jenny@kalyesilog.com',
      status: 'Active',
      joined: 'May 10, 2026',
    },
    {
      id: 11,
      name: 'Paolo Diaz',
      role: 'Staff',
      email: 'paolo@kalyesilog.com',
      status: 'Active',
      joined: 'Apr 25, 2026',
    },
    {
      id: 12,
      name: 'Claire Navarro',
      role: 'Cashier',
      email: 'claire@kalyesilog.com',
      status: 'Inactive',
      joined: 'Apr 18, 2026',
    },
  ];

  // =========================================================
  // FILTERING
  // =========================================================

  get filteredStaff(): Staff[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.staff.filter((member) => {
      const matchesSearch =
        !search ||
        member.name.toLowerCase().includes(search) ||
        member.email.toLowerCase().includes(search) ||
        member.role.toLowerCase().includes(search);

      const matchesRole =
        this.activeRole === 'All' || member.role === this.activeRole;

      const matchesStatus =
        this.activeStatus === 'All' || member.status === this.activeStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  // =========================================================
  // PAGINATION
  // =========================================================

  get paginatedStaff(): Staff[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    return this.filteredStaff.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredStaff.length / this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get startItem(): number {
    if (this.filteredStaff.length === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredStaff.length,
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
  // FILTERS
  // =========================================================

  setRole(role: string): void {
    this.activeRole = role;
    this.currentPage = 1;
    this.closeActionMenu();
  }

  setStatus(status: string): void {
    this.activeStatus = status;
    this.currentPage = 1;
    this.closeActionMenu();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.activeRole = 'All';
    this.activeStatus = 'All';
    this.currentPage = 1;
  }

  // =========================================================
  // PAGINATION ACTIONS
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
  // STAFF ACTIONS
  // =========================================================

  addStaff(): void {
    console.log('Open add staff modal');

    // Later:
    // this.staffService.create(...)
  }

  editStaff(member: Staff): void {
    this.closeActionMenu();

    console.log('Edit staff:', member);

    // Later:
    // Open edit modal
  }

  toggleStatus(member: Staff): void {
    member.status = member.status === 'Active' ? 'Inactive' : 'Active';

    this.closeActionMenu();
  }

  deleteStaff(member: Staff): void {
    const confirmed = window.confirm(
      `Delete "${member.name}" from the staff list?`,
    );

    if (!confirmed) {
      return;
    }

    this.staff = this.staff.filter((item) => item.id !== member.id);

    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }

    this.closeActionMenu();
  }

  // =========================================================
  // STATISTICS
  // =========================================================

  get totalStaff(): number {
    return this.staff.length;
  }

  get activeStaff(): number {
    return this.staff.filter((member) => member.status === 'Active').length;
  }

  get inactiveStaff(): number {
    return this.staff.filter((member) => member.status === 'Inactive').length;
  }

  get kitchenStaff(): number {
    return this.staff.filter((member) => member.role === 'Kitchen Staff')
      .length;
  }

  get cashiers(): number {
    return this.staff.filter((member) => member.role === 'Cashier').length;
  }

  get adminStaff(): number {
    return this.staff.filter((member) => member.role === 'Admin').length;
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

  getRoleIcon(role: string): string {
    const icons: Record<string, string> = {
      Admin: 'bx-shield',
      Cashier: 'bx-wallet',
      'Kitchen Staff': 'bx-bowl-hot',
      Staff: 'bx-user',
    };

    return icons[role] || 'bx-user';
  }
}
