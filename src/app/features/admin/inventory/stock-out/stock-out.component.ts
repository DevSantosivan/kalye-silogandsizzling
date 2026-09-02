import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Ingredient } from '../../../../core/models/ingredient.model';
import { IngredientService } from '../../../../core/services/admin/inventory/ingredient.service';
import { StockOutService } from '../../../../core/services/admin/inventory/stock-out.service';

@Component({
  selector: 'app-stock-out',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './stock-out.component.html',
  styleUrl: './stock-out.component.scss',
})
export class StockOutComponent implements OnInit {
  private ingredientService = inject(IngredientService);
  private stockOutService = inject(StockOutService);

  // ==========================================
  // INGREDIENTS
  // ==========================================

  ingredients = signal<Ingredient[]>([]);

  isLoading = signal(false);
  isSaving = signal(false);

  reasons = ['Spoilage', 'Damaged', 'Expired', 'Inventory Adjustment', 'Other'];

  selectedIngredientId = signal<number | null>(null);

  quantity: number | null = null;

  reason = '';
  notes = '';

  selectedIngredient = computed(() => {
    const id = this.selectedIngredientId();

    if (id === null) {
      return null;
    }

    return this.ingredients().find((item) => item.id === Number(id)) ?? null;
  });

  get remainingStock(): number {
    const ingredient = this.selectedIngredient();

    if (!ingredient) {
      return 0;
    }

    return Math.max(0, Number(ingredient.stock) - (this.quantity ?? 0));
  }

  async ngOnInit(): Promise<void> {
    await this.loadIngredients();
  }

  async loadIngredients(): Promise<void> {
    this.isLoading.set(true);

    try {
      const data = await this.ingredientService.getIngredients();

      this.ingredients.set(data);
    } catch (error) {
      console.error('Failed to load ingredients:', error);

      alert('Unable to load ingredients. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async stockOut(): Promise<void> {
    const ingredient = this.selectedIngredient();

    if (!ingredient) {
      alert('Please select an ingredient.');
      return;
    }

    if (this.quantity === null || this.quantity <= 0) {
      alert('Please enter a valid quantity.');
      return;
    }

    if (this.quantity > Number(ingredient.stock)) {
      alert('Stock out quantity cannot exceed current stock.');
      return;
    }

    if (!this.reason) {
      alert('Please select a reason.');
      return;
    }
    this.isSaving.set(true);

    try {
      const result = await this.stockOutService.stockOut({
        ingredientId: ingredient.id,
        quantity: this.quantity,
        unit: ingredient.unit,
        reason: this.reason,
        notes: this.notes.trim() || null,
      });

      // ----------------------------------------
      // UPDATE LOCAL INGREDIENT
      // ----------------------------------------

      this.ingredients.update((items) =>
        items.map((item) =>
          item.id === result.ingredient.id ? result.ingredient : item,
        ),
      );

      // ----------------------------------------
      // SUCCESS
      // ----------------------------------------

      alert(
        `${this.quantity} ${ingredient.unit} of ${ingredient.name} has been removed successfully.`,
      );

      // ----------------------------------------
      // RESET FORM
      // ----------------------------------------

      this.resetForm();
    } catch (error) {
      console.error('Failed to stock out:', error);

      alert('Unable to process stock out. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }

  // ==========================================
  // RESET FORM
  // ==========================================

  resetForm(): void {
    this.selectedIngredientId.set(null);

    this.quantity = null;

    this.reason = '';
    this.notes = '';
  }
}
