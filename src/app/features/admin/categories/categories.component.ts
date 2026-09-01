import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Category {
  id: number;
  name: string;
  description: string;
  items: number;
  status: boolean;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
})
export class CategoriesComponent {
  // ==========================================
  // FILTERS
  // ==========================================

  statusFilters = ['All', 'Active', 'Inactive'];

  activeStatus = 'All';
  searchTerm = '';

  // ==========================================
  // PAGINATION
  // ==========================================

  currentPage = 1;
  pageSize = 6;

  // ==========================================
  // ACTION MENU
  // ==========================================

  openMenuId: number | null = null;

  // ==========================================
  // CATEGORIES
  // ==========================================

  categories: Category[] = [
    {
      id: 1,
      name: 'Silog Meals',
      description: 'Signature rice meals served with egg.',
      items: 12,
      status: true,
    },

    {
      id: 2,
      name: 'Breakfast',
      description: 'Classic Filipino breakfast favorites.',
      items: 6,
      status: true,
    },

    {
      id: 3,
      name: 'Drinks',
      description: 'Hot and cold beverages.',
      items: 8,
      status: true,
    },

    {
      id: 4,
      name: 'Add-ons',
      description: 'Extra sides and additional toppings.',
      items: 5,
      status: true,
    },

    {
      id: 5,
      name: 'Desserts',
      description: 'Sweet treats and after-meal favorites.',
      items: 4,
      status: true,
    },

    {
      id: 6,
      name: 'Bundles',
      description: 'Meal combinations and special offers.',
      items: 3,
      status: false,
    },

    {
      id: 7,
      name: 'Snacks',
      description: 'Light meals and quick bites.',
      items: 7,
      status: true,
    },

    {
      id: 8,
      name: 'Specials',
      description: 'Limited-time and seasonal menu items.',
      items: 2,
      status: false,
    },
  ];

  // ==========================================
  // FILTERED CATEGORIES
  // ==========================================

  get filteredCategories(): Category[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.categories.filter((category) => {
      const matchesSearch =
        !search ||
        category.name.toLowerCase().includes(search) ||
        category.description.toLowerCase().includes(search);

      const matchesStatus =
        this.activeStatus === 'All' ||
        (this.activeStatus === 'Active' && category.status) ||
        (this.activeStatus === 'Inactive' && !category.status);

      return matchesSearch && matchesStatus;
    });
  }

  // ==========================================
  // PAGINATION
  // ==========================================

  get paginatedCategories(): Category[] {
    const start = (this.currentPage - 1) * this.pageSize;

    const end = start + this.pageSize;

    return this.filteredCategories.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCategories.length / this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get startItem(): number {
    if (this.filteredCategories.length === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredCategories.length,
    );
  }

  // ==========================================
  // SEARCH
  // ==========================================

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.searchTerm = input.value;
    this.currentPage = 1;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
  }

  // ==========================================
  // STATUS FILTER
  // ==========================================

  setStatus(filter: string): void {
    this.activeStatus = filter;
    this.currentPage = 1;
    this.closeActionMenu();
  }

  // ==========================================
  // PAGINATION
  // ==========================================

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

  // ==========================================
  // ACTION MENU
  // ==========================================

  toggleActionMenu(id: number): void {
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  closeActionMenu(): void {
    this.openMenuId = null;
  }

  // ==========================================
  // CATEGORY ACTIONS
  // ==========================================

  addCategory(): void {
    console.log('Open add category modal');

    // Later:
    // openAddCategoryModal()
  }

  editCategory(category: Category): void {
    this.closeActionMenu();

    console.log('Edit category:', category);

    // Later:
    // openEditCategoryModal(category)
  }

  toggleStatus(category: Category): void {
    category.status = !category.status;

    this.closeActionMenu();
  }

  deleteCategory(category: Category): void {
    if (category.items > 0) {
      window.alert(
        `"${category.name}" still has ${category.items} menu items. Move or remove those items before deleting this category.`,
      );

      return;
    }

    const confirmed = window.confirm(`Delete "${category.name}"?`);

    if (!confirmed) {
      return;
    }

    this.categories = this.categories.filter((item) => item.id !== category.id);

    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }

    this.closeActionMenu();
  }

  // ==========================================
  // SUMMARY
  // ==========================================

  get totalCategories(): number {
    return this.categories.length;
  }

  get activeCategories(): number {
    return this.categories.filter((category) => category.status).length;
  }

  get inactiveCategories(): number {
    return this.categories.filter((category) => !category.status).length;
  }

  get totalMenuItems(): number {
    return this.categories.reduce(
      (total, category) => total + category.items,
      0,
    );
  }

  // ==========================================
  // ICON
  // ==========================================

  getCategoryIcon(name: string): string {
    const icons: Record<string, string> = {
      'Silog Meals': 'bx-restaurant',
      Breakfast: 'bx-sun',
      Drinks: 'bx-coffee',
      'Add-ons': 'bx-plus-circle',
      Desserts: 'bx-cake',
      Bundles: 'bx-package',
      Snacks: 'bx-bowl-hot',
      Specials: 'bx-star',
    };

    return icons[name] || 'bx-category';
  }
}
