import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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

  search = '';
  categoryFilter = 'All';

  ingredients = signal<Ingredient[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.loadIngredients();
  }

  async loadIngredients(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const data = await this.ingredientService.getIngredients();

      this.ingredients.set(data);
    } catch (error) {
      console.error(error);

      this.error.set('Unable to load ingredients. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  categories = computed(() => {
    const values = this.ingredients().map((item) => item.category);

    return ['All', ...new Set(values)];
  });

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

  getStatus(item: Ingredient): 'Good' | 'Low' | 'Out of Stock' {
    if (item.stock <= 0) {
      return 'Out of Stock';
    }

    if (item.stock <= item.reorderLevel) {
      return 'Low';
    }

    return 'Good';
  }

  editIngredient(item: Ingredient): void {
    console.log('Edit ingredient:', item);

    // Later:
    // this.router.navigate([
    //   '/admin/inventory/ingredients/edit',
    //   item.id,
    // ]);
  }

  async deleteIngredient(item: Ingredient): Promise<void> {
    const confirmed = confirm(`Delete ${item.name} from inventory?`);

    if (!confirmed) {
      return;
    }

    try {
      await this.ingredientService.deleteIngredient(item.id);

      this.ingredients.update((items) =>
        items.filter((current) => current.id !== item.id),
      );
    } catch (error) {
      console.error(error);

      alert('Unable to delete ingredient. Please try again.');
    }
  }

  goToAddIngredient(): void {
    this.router.navigate(['/admin/inventory/ingredients/add']);
  }
}
