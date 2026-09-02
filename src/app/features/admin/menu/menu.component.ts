import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { MenuService } from '../../../core/services/admin/menu.service';
import { MenuItem } from '../../../core/models/menu.model';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
})
export class MenuComponent implements OnInit {
  // ========================================================
  // SERVICES
  // ========================================================

  private router = inject(Router);
  private menuService = inject(MenuService);

  // ========================================================
  // STATE
  // ========================================================

  items: MenuItem[] = [];

  isLoading = false;

  // ========================================================
  // FILTERS
  // ========================================================

  categories = [
    'All',
    'Silog',
    'Sizzling',
    'Rice Meals',
    'Chicken',
    'Pork',
    'Beef',
    'Seafood',
    'Drinks',
    'Sides',
    'Others',
  ];

  availabilityFilters = ['All', 'Available', 'Unavailable'];

  activeCategory = 'All';
  activeAvailability = 'All';

  searchTerm = '';

  // ========================================================
  // PAGINATION
  // ========================================================

  currentPage = 1;
  pageSize = 8;

  // ========================================================
  // ACTION MENU
  // ========================================================

  openMenuId: number | null = null;

  // ========================================================
  // INIT
  // ========================================================

  async ngOnInit(): Promise<void> {
    await this.loadMenus();
  }

  // ========================================================
  // LOAD MENUS
  // ========================================================

  async loadMenus(): Promise<void> {
    this.isLoading = true;

    try {
      const data = await this.menuService.getMenus();

      this.items = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        description: item.description ?? '',
        price: Number(item.price) || 0,
        sold: Number(item.sold) || 0,
        available: Boolean(item.available),
        image: item.image ?? null,
      }));

      console.log('MENU ITEMS:', this.items);
    } catch (error) {
      console.error('Failed to load menus:', error);

      await Swal.fire({
        icon: 'error',
        title: 'Unable to Load Menu',
        text: 'Something went wrong while loading the menu items.',
        confirmButtonColor: '#191919',
      });
    } finally {
      this.isLoading = false;
    }
  }

  // ========================================================
  // FILTERED ITEMS
  // ========================================================

  get filteredItems(): MenuItem[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.items.filter((item) => {
      const matchesCategory =
        this.activeCategory === 'All' || item.category === this.activeCategory;

      const matchesAvailability =
        this.activeAvailability === 'All' ||
        (this.activeAvailability === 'Available' && item.available) ||
        (this.activeAvailability === 'Unavailable' && !item.available);

      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search) ||
        (item.description ?? '').toLowerCase().includes(search);

      return matchesCategory && matchesAvailability && matchesSearch;
    });
  }

  // ========================================================
  // PAGINATION
  // ========================================================

  get paginatedItems(): MenuItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    return this.filteredItems.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredItems.length / this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get startItem(): number {
    if (this.filteredItems.length === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredItems.length,
    );
  }

  // ========================================================
  // CATEGORY
  // ========================================================

  setCategory(category: string): void {
    this.activeCategory = category;
    this.currentPage = 1;
    this.closeActionMenu();
  }

  // ========================================================
  // AVAILABILITY
  // ========================================================

  setAvailability(filter: string): void {
    this.activeAvailability = filter;
    this.currentPage = 1;
    this.closeActionMenu();
  }

  // ========================================================
  // SEARCH
  // ========================================================

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.searchTerm = input.value;
    this.currentPage = 1;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
  }

  // ========================================================
  // PAGINATION ACTIONS
  // ========================================================

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

  // ========================================================
  // ACTION MENU
  // ========================================================

  toggleActionMenu(id: number): void {
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  closeActionMenu(): void {
    this.openMenuId = null;
  }

  // ========================================================
  // EDIT
  // ========================================================

  editItem(item: MenuItem): void {
    this.closeActionMenu();

    console.log('Edit menu:', item);

    // later:
    // this.router.navigate(['/admin/menu/edit', item.id]);
  }

  // ========================================================
  // TOGGLE AVAILABILITY
  // ========================================================

  async toggleAvailability(item: MenuItem): Promise<void> {
    const newAvailability = !item.available;

    try {
      // Kapag may update method na ang MenuService:
      //
      // await this.menuService.updateAvailability(
      //   item.id,
      //   newAvailability
      // );

      item.available = newAvailability;

      this.closeActionMenu();
    } catch (error) {
      console.error('Failed to update availability:', error);

      await Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Unable to update menu availability.',
        confirmButtonColor: '#191919',
      });
    }
  }

  // ========================================================
  // DELETE
  // ========================================================

  async deleteItem(item: MenuItem): Promise<void> {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete menu item?',
      text: `"${item.name}" will be permanently removed from your menu.`,
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      confirmButtonColor: '#191919',
      cancelButtonColor: '#6b7280',
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      this.isLoading = true;

      // ==========================================
      // DELETE FROM SUPABASE
      // ==========================================

      await this.menuService.deleteMenu(item.id);

      // ==========================================
      // REMOVE FROM LOCAL LIST
      // ==========================================

      this.items = this.items.filter((menuItem) => menuItem.id !== item.id);

      // ==========================================
      // FIX PAGINATION
      // ==========================================

      if (this.currentPage > this.totalPages && this.totalPages > 0) {
        this.currentPage = this.totalPages;
      }

      this.closeActionMenu();

      // ==========================================
      // SUCCESS
      // ==========================================

      await Swal.fire({
        icon: 'success',
        title: 'Menu Deleted',
        text: `${item.name} has been removed successfully.`,
        confirmButtonColor: '#191919',
      });
    } catch (error: any) {
      console.error('Failed to delete menu:', error);

      // ==========================================
      // ERROR
      // ==========================================

      await Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: error?.message || 'Unable to delete menu item. Please try again.',
        confirmButtonColor: '#191919',
      });
    } finally {
      this.isLoading = false;
    }
  }

  // ========================================================
  // ADD ITEM
  // ========================================================

  addMenuItem(): void {
    this.router.navigate(['/admin/menu/create']);
  }

  // ========================================================
  // CURRENCY
  // ========================================================

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  // ========================================================
  // SUMMARY
  // ========================================================

  get totalItems(): number {
    return this.items.length;
  }

  get availableItems(): number {
    return this.items.filter((item) => item.available).length;
  }

  get unavailableItems(): number {
    return this.items.filter((item) => !item.available).length;
  }

  get totalSold(): number {
    return this.items.reduce((total, item) => total + item.sold, 0);
  }
}
