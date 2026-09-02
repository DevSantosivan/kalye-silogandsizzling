import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { Ingredient } from '../../../../core/models/ingredient.model';
import { IngredientService } from '../../../../core/services/admin/inventory/ingredient.service';

@Component({
  selector: 'app-ingredients',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ingredients.component.html',
  styleUrl: './ingredients.component.scss',
})
export class IngredientsComponent implements OnInit {
  private router = inject(Router);
  private ingredientService = inject(IngredientService);

  // ==========================================
  // FILTERS
  // ==========================================

  search = '';
  categoryFilter = 'All';

  // ==========================================
  // DATA
  // ==========================================

  ingredients = signal<Ingredient[]>([]);

  loading = signal(true);

  error = signal('');

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  ngOnInit(): void {
    this.loadIngredients();
  }

  // ==========================================
  // LOAD INGREDIENTS
  // ==========================================

  async loadIngredients(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const data = await this.ingredientService.getIngredients();

      this.ingredients.set(data);
    } catch (error) {
      console.error('Failed to load ingredients:', error);

      this.error.set('Unable to load ingredients. Please try again.');

      await Swal.fire({
        icon: 'error',
        title: 'Load Failed',
        text: 'Unable to load ingredients. Please try again.',
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#191919',
      });
    } finally {
      this.loading.set(false);
    }
  }

  // ==========================================
  // CATEGORIES
  // ==========================================

  categories = computed(() => {
    const values = this.ingredients().map((item) => item.category);

    return ['All', ...new Set(values)];
  });

  // ==========================================
  // FILTERED INGREDIENTS
  // ==========================================

  filteredIngredients = computed(() => {
    const query = this.search.toLowerCase().trim();

    return this.ingredients().filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);

      const matchesCategory =
        this.categoryFilter === 'All' || item.category === this.categoryFilter;

      return matchesSearch && matchesCategory;
    });
  });

  // ==========================================
  // STATUS
  // ==========================================

  getStatus(item: Ingredient): 'Good' | 'Low' | 'Out of Stock' {
    if (item.stock <= 0) {
      return 'Out of Stock';
    }

    if (item.stock <= item.reorderLevel) {
      return 'Low';
    }

    return 'Good';
  }

  // ==========================================
  // EDIT
  // ==========================================

  editIngredient(item: Ingredient): void {
    this.router.navigate(['/admin/inventory/ingredients/edit', item.id]);
  }

  // ==========================================
  // DELETE
  // ==========================================

  async deleteIngredient(item: Ingredient): Promise<void> {
    // ------------------------------------------
    // CONFIRM DELETE
    // ------------------------------------------

    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete ingredient?',
      text: `${item.name} will be removed from your inventory.`,
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      reverseButtons: true,

      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',

      focusCancel: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    // ------------------------------------------
    // DELETE
    // ------------------------------------------

    try {
      await this.ingredientService.deleteIngredient(item.id);

      // ----------------------------------------
      // UPDATE UI
      // ----------------------------------------

      this.ingredients.update((items) =>
        items.filter((current) => current.id !== item.id),
      );

      // ----------------------------------------
      // SUCCESS
      // ----------------------------------------

      await Swal.fire({
        icon: 'success',
        title: 'Ingredient Deleted',
        text: `${item.name} has been removed from inventory.`,
        confirmButtonText: 'Done',
        confirmButtonColor: '#191919',
      });
    } catch (error) {
      console.error('Failed to delete ingredient:', error);

      // ----------------------------------------
      // ERROR
      // ----------------------------------------

      await Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: 'Unable to delete ingredient. Please try again.',
        confirmButtonText: 'Close',
        confirmButtonColor: '#191919',
      });
    }
  }

  // ==========================================
  // ADD INGREDIENT
  // ==========================================

  goToAddIngredient(): void {
    this.router.navigate(['/admin/inventory/ingredients/add']);
  }
}
