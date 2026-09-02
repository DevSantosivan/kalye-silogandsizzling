import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface IngredientOption {
  id: number;
  name: string;
  stock: number;
  unit: string;
}

@Component({
  selector: 'app-stock-out',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './stock-out.component.html',
  styleUrl: './stock-out.component.scss',
})
export class StockOutComponent {
  ingredients = signal<IngredientOption[]>([
    {
      id: 1,
      name: 'Chicken',
      stock: 10.5,
      unit: 'kg',
    },
    {
      id: 2,
      name: 'Rice',
      stock: 25,
      unit: 'kg',
    },
    {
      id: 3,
      name: 'Egg',
      stock: 100,
      unit: 'pcs',
    },
    {
      id: 4,
      name: 'Cooking Oil',
      stock: 2,
      unit: 'L',
    },
  ]);

  reasons = ['Spoilage', 'Damaged', 'Expired', 'Inventory Adjustment', 'Other'];

  selectedIngredientId: number | null = null;

  quantity: number | null = null;

  reason = '';
  notes = '';

  selectedIngredient = computed(() => {
    if (this.selectedIngredientId === null) {
      return null;
    }

    return (
      this.ingredients().find(
        (item) => item.id === Number(this.selectedIngredientId),
      ) ?? null
    );
  });

  get remainingStock(): number {
    const ingredient = this.selectedIngredient();

    if (!ingredient) {
      return 0;
    }

    return Math.max(0, ingredient.stock - (this.quantity || 0));
  }

  stockOut(): void {
    const ingredient = this.selectedIngredient();

    if (!ingredient) {
      alert('Please select an ingredient.');
      return;
    }

    if (!this.quantity || this.quantity <= 0) {
      alert('Please enter a valid quantity.');
      return;
    }

    if (this.quantity > ingredient.stock) {
      alert('Stock out quantity cannot exceed current stock.');
      return;
    }

    if (!this.reason) {
      alert('Please select a reason.');
      return;
    }

    console.log({
      ingredientId: ingredient.id,
      quantity: this.quantity,
      unit: ingredient.unit,
      reason: this.reason,
      notes: this.notes,
    });

    alert(
      `${this.quantity} ${ingredient.unit} of ${ingredient.name} has been removed.`,
    );
  }
}
