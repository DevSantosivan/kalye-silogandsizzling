import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Ingredient } from '../../../../core/models/ingredient.model';
import { IngredientService } from '../../../../core/services/admin/inventory/ingredient.service';
import { StockInService } from '../../../../core/services/admin/inventory/stock-in.service';

@Component({
  selector: 'app-stock-in',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './stock-in.component.html',
  styleUrl: './stock-in.component.scss',
})
export class StockInComponent implements OnInit {
  private ingredientService = inject(IngredientService);
  private stockInService = inject(StockInService);

  ingredients = signal<Ingredient[]>([]);

  isLoading = signal(false);
  isSaving = signal(false);

  selectedIngredientId = signal<number | null>(null);

  quantity: number | null = null;
  purchaseCost: number | null = null;

  supplier = '';
  notes = '';

  selectedIngredient = computed(() => {
    const id = this.selectedIngredientId();

    if (id === null) {
      return null;
    }

    return this.ingredients().find((item) => item.id === Number(id)) ?? null;
  });

  get totalCost(): number {
    if (this.quantity === null || this.purchaseCost === null) {
      return 0;
    }

    return this.quantity * this.purchaseCost;
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

  async receiveStock(): Promise<void> {
    const ingredient = this.selectedIngredient();

    if (!ingredient) {
      alert('Please select an ingredient.');
      return;
    }

    if (this.quantity === null || this.quantity <= 0) {
      alert('Please enter a valid quantity.');
      return;
    }

    if (this.purchaseCost === null || this.purchaseCost < 0) {
      alert('Please enter a valid cost per unit.');
      return;
    }

    this.isSaving.set(true);

    try {
      const result = await this.stockInService.receiveStock({
        ingredientId: ingredient.id,
        quantity: this.quantity,
        unit: ingredient.unit,
        supplier: this.supplier.trim() || null,
        costPerUnit: this.purchaseCost,
        notes: this.notes.trim() || null,
      });

      this.ingredients.update((items) =>
        items.map((item) =>
          item.id === result.ingredient.id ? result.ingredient : item,
        ),
      );

      alert(
        `${this.quantity} ${ingredient.unit} of ${ingredient.name} received successfully.`,
      );

      this.resetForm();
    } catch (error) {
      console.error('Failed to receive stock:', error);

      alert('Unable to receive stock. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }

  resetForm(): void {
    this.selectedIngredientId.set(null);

    this.quantity = null;
    this.purchaseCost = null;

    this.supplier = '';
    this.notes = '';
  }
}
