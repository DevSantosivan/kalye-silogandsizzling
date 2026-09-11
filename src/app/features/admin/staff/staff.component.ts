import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  User,
  UserRole,
  UserStatus,
  UserService,
} from '../../../core/services/user.service';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff.component.html',
  styleUrl: './staff.component.scss',
})
export class StaffComponent implements OnInit {
  private readonly userService = inject(UserService);

  // =========================================================
  // FILTERS
  // =========================================================

  roleFilters = ['All', 'Cashier', 'Kitchen Staff', 'User'];

  statusFilters = ['All', 'Active', 'Inactive'];

  activeRole = 'All';
  activeStatus = 'All';
  searchTerm = '';

  // =========================================================
  // PAGINATION
  // =========================================================

  currentPage = 1;
  pageSize = 6;

  // =========================================================
  // ACTION MENU
  // =========================================================

  openMenuId: string | null = null;

  // =========================================================
  // USERS
  // =========================================================

  staff: User[] = [];

  isLoading = false;
  errorMessage = '';

  // =========================================================
  // MODAL
  // =========================================================

  showUserModal = false;
  isSaving = false;

  editingUserId: string | null = null;

  showPassword = false;

  userForm = {
    name: '',
    email: '',
    password: '',
    role: 'Cashier' as UserRole,
    status: 'Active' as UserStatus,
  };

  // =========================================================
  // INIT
  // =========================================================

  async ngOnInit(): Promise<void> {
    await this.loadUsers();
  }

  // =========================================================
  // LOAD USERS
  // =========================================================

  async loadUsers(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      this.staff = await this.userService.getUsers();
    } catch (error) {
      console.error('Failed to load users:', error);

      this.errorMessage = 'Failed to load users.';
    } finally {
      this.isLoading = false;
    }
  }

  get filteredStaff(): User[] {
  const search = this.searchTerm.trim().toLowerCase();

  return this.staff
    .filter((member) => {
      return (
        member.role === 'Cashier' ||
        member.role === 'Kitchen Staff' ||
        member.role === 'User'
      );
    })
    .filter((member) => {
      const matchesSearch =
        !search ||
        member.name.toLowerCase().includes(search) ||
        member.email.toLowerCase().includes(search) ||
        member.role.toLowerCase().includes(search);

      const matchesRole =
        this.activeRole === 'All' ||
        member.role === this.activeRole;

      const matchesStatus =
        this.activeStatus === 'All' ||
        member.status === this.activeStatus;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
}

  // =========================================================
  // PAGINATION
  // =========================================================

  get paginatedStaff(): User[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    return this.filteredStaff.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredStaff.length / this.pageSize);
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

  toggleActionMenu(id: string): void {
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  closeActionMenu(): void {
    this.openMenuId = null;
  }

  // =========================================================
  // CREATE USER
  // =========================================================

  addStaff(): void {
    this.editingUserId = null;

    this.showPassword = false;

    this.userForm = {
      name: '',
      email: '',
      password: '',
      role: 'Cashier',
      status: 'Active',
    };

    this.showUserModal = true;

    this.closeActionMenu();
  }

  // =========================================================
  // EDIT USER
  // =========================================================

  editStaff(member: User): void {
    this.closeActionMenu();

    this.editingUserId = member.id;

    this.showPassword = false;

    this.userForm = {
      name: member.name,
      email: member.email,
      password: '',
      role: this.toStaffRole(member.role),
      status: member.status,
    };

    this.showUserModal = true;
  }

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  closeUserModal(): void {
    if (this.isSaving) {
      return;
    }

    this.showUserModal = false;

    this.editingUserId = null;

    this.showPassword = false;
  }

  // =========================================================
  // PASSWORD
  // =========================================================

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // =========================================================
  // SAVE USER
  // =========================================================

  async saveUser(): Promise<void> {
    const name = this.userForm.name.trim();

    const email = this.userForm.email.trim().toLowerCase();

    const password = this.userForm.password.trim();

    if (!name || !email) {
      return;
    }

    // =======================================================
    // PASSWORD REQUIRED ONLY WHEN CREATING
    // =======================================================

    if (!this.editingUserId && password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    try {
      // =====================================================
      // EDIT USER
      // =====================================================

      if (this.editingUserId) {
        const updatedUser = await this.userService.updateUser(
          this.editingUserId,
          {
            name,
            email,
            role: this.toStaffRole(this.userForm.role),
            status: this.userForm.status,
          },
        );

        this.staff = this.staff.map((user) =>
          user.id === updatedUser.id ? updatedUser : user,
        );
      }

      // =====================================================
      // CREATE USER
      // =====================================================
      else {
        const newUser = await this.userService.createUser({
          name,
          email,
          password,
          role: this.toStaffRole(this.userForm.role),
          status: this.userForm.status,
        });

        this.staff = [newUser, ...this.staff];

        this.currentPage = 1;
      }

      // =====================================================
      // CLOSE
      // =====================================================

      this.showUserModal = false;

      this.editingUserId = null;

      this.showPassword = false;

      this.userForm.password = '';
    } catch (error: any) {
      console.error('Save user failed:', error);

      this.errorMessage = error?.message || 'Unable to save user account.';
    } finally {
      this.isSaving = false;
    }
  }

  // =========================================================
  // TOGGLE STATUS
  // =========================================================

  async toggleStatus(member: User): Promise<void> {
    const newStatus: UserStatus =
      member.status === 'Active' ? 'Inactive' : 'Active';

    try {
      const updatedUser = await this.userService.updateStatus(
        member.id,
        newStatus,
      );

      this.staff = this.staff.map((user) =>
        user.id === updatedUser.id ? updatedUser : user,
      );
    } catch (error) {
      console.error('Update status failed:', error);
    }

    this.closeActionMenu();
  }

  // =========================================================
  // DELETE USER
  // =========================================================

  async deleteStaff(member: User): Promise<void> {
    const confirmed = window.confirm(`Delete "${member.name}" from the users?`);

    if (!confirmed) {
      return;
    }

    try {
      await this.userService.deleteUser(member.id);

      this.staff = this.staff.filter((user) => user.id !== member.id);

      if (this.currentPage > this.totalPages && this.totalPages > 0) {
        this.currentPage = this.totalPages;
      }
    } catch (error) {
      console.error('Delete user failed:', error);
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

  get userStaff(): number {
    return this.staff.filter((member) => member.role === 'User').length;
  }

  // =========================================================
  // HELPERS
  // =========================================================

  private toStaffRole(role: UserRole): 'Cashier' | 'Kitchen Staff' | 'User' {
    if (role === 'Kitchen Staff') {
      return 'Kitchen Staff';
    }

    if (role === 'User') {
      return 'User';
    }

    return 'Cashier';
  }

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
      Cashier: 'bx-wallet',
      'Kitchen Staff': 'bx-bowl-hot',
      User: 'bx-user',
      Admin: 'bx-shield',
      Owner: 'bx-crown',
    };

    return icons[role] || 'bx-user';
  }

  formatJoinedDate(createdAt: string): string {
    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
