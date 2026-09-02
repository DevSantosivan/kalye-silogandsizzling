import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface IngredientOption {
  id: number;
  name: string;
  stock: number;
  unit: string;
  costPerUnit: number;
}

@Component({
  selector: 'app-stock-in',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './stock-in.component.html',
  styleUrl: './stock-in.component.scss',
})
export class StockInComponent {
  ingredients = signal<IngredientOption[]>([
    {
      id: 1,
      name: 'Chicken',
      stock: 10.5,
      unit: 'kg',
      costPerUnit: 280,
    },
    {
      id: 2,
      name: 'Rice',
      stock: 25,
      unit: 'kg',
      costPerUnit: 52,
    },
    {
      id: 3,
      name: 'Egg',
      stock: 100,
      unit: 'pcs',
      costPerUnit: 8,
    },
    {
      id: 4,
      name: 'Cooking Oil',
      stock: 2,
      unit: 'L',
      costPerUnit: 95,
    },
  ]);

  selectedIngredientId: number | null = null;

  quantity: number | null = null;
  purchaseCost: number | null = null;

  supplier = '';
  notes = '';

  selectedIngredient = computed(() => {
    const id = this.selectedIngredientId;

    if (id === null) {
      return null;
    }

    return this.ingredients().find((item) => item.id === Number(id)) ?? null;
  });

  get totalCost(): number {
    if (!this.quantity || !this.purchaseCost) {
      return 0;
    }

    return this.quantity * this.purchaseCost;
  }

  receiveStock(): void {
    const ingredient = this.selectedIngredient();

    if (!ingredient) {
      alert('Please select an ingredient.');
      return;
    }

    if (!this.quantity || this.quantity <= 0) {
      alert('Please enter a valid quantity.');
      return;
    }

    console.log({
      ingredientId: ingredient.id,
      quantity: this.quantity,
      unit: ingredient.unit,
      supplier: this.supplier,
      purchaseCost: this.purchaseCost,
      notes: this.notes,
    });

    alert(
      `${this.quantity} ${ingredient.unit} of ${ingredient.name} received.`,
    );
  }
}
