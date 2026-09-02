import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IngredientService } from '../../../../../core/services/admin/inventory/ingredient.service';

@Component({
  selector: 'app-add-ingredient',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './add-ingredient.component.html',
  styleUrl: './add-ingredient.component.scss',
})
export class AddIngredientComponent {
  private router = inject(Router);
  private ingredientService = inject(IngredientService);

  // ==========================================
  // FORM DATA
  // ==========================================

  ingredientName = '';
  category = '';
  unit = '';

  stock: number | null = null;
  reorderLevel: number | null = null;
  costPerUnit: number | null = null;

  // ==========================================
  // UI STATE
  // ==========================================

  isSaving = signal(false);

  // ==========================================
  // OPTIONS
  // ==========================================

  categories = [
    'Meat',
    'Rice',
    'Eggs',
    'Vegetables',
    'Sauces',
    'Condiments',
    'Cooking Oil',
    'Beverages',
    'Others',
  ];

  units = ['kg', 'g', 'L', 'mL', 'pcs'];

  // ==========================================
  // SAVE INGREDIENT
  // ==========================================

  async saveIngredient(): Promise<void> {
    // VALIDATION

    if (!this.ingredientName.trim()) {
      alert('Please enter the ingredient name.');
      return;
    }

    if (!this.category) {
      alert('Please select a category.');
      return;
    }

    if (!this.unit) {
      alert('Please select a stock unit.');
      return;
    }

    if (this.stock === null || this.stock < 0) {
      alert('Please enter a valid stock quantity.');
      return;
    }

    if (this.reorderLevel === null || this.reorderLevel < 0) {
      alert('Please enter a valid reorder level.');
      return;
    }

    if (this.costPerUnit === null || this.costPerUnit < 0) {
      alert('Please enter a valid cost per unit.');
      return;
    }

    this.isSaving.set(true);

    try {
      await this.ingredientService.createIngredient({
        name: this.ingredientName.trim(),
        category: this.category,
        stock: this.stock,
        unit: this.unit,
        reorderLevel: this.reorderLevel,
        costPerUnit: this.costPerUnit,
      });

      alert('Ingredient added successfully!');

      this.router.navigate(['/admin/inventory/ingredients']);
    } catch (error) {
      console.error('Failed to save ingredient:', error);

      alert('Unable to add ingredient. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }

  // ==========================================
  // CANCEL
  // ==========================================

  cancel(): void {
    this.router.navigate(['/admin/inventory/ingredients']);
  }
}
