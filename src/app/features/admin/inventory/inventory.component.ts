import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  stock: number;
  unit: string;
  reorderLevel: number;
  costPerUnit: number;
}

interface Movement {
  id: number;
  date: string;
  ingredient: string;
  type: 'Stock In' | 'Stock Out';
  quantity: number;
  unit: string;
  reason: string;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent {
  ingredients = signal<InventoryItem[]>([
    {
      id: 1,
      name: 'Chicken',
      category: 'Meat',
      stock: 10.5,
      unit: 'kg',
      reorderLevel: 5,
      costPerUnit: 280,
    },
    {
      id: 2,
      name: 'Rice',
      category: 'Grains',
      stock: 4.2,
      unit: 'kg',
      reorderLevel: 10,
      costPerUnit: 52,
    },
    {
      id: 3,
      name: 'Egg',
      category: 'Egg & Dairy',
      stock: 100,
      unit: 'pcs',
      reorderLevel: 30,
      costPerUnit: 8,
    },
    {
      id: 4,
      name: 'Cooking Oil',
      category: 'Oil',
      stock: 0,
      unit: 'L',
      reorderLevel: 3,
      costPerUnit: 95,
    },
    {
      id: 5,
      name: 'Garlic',
      category: 'Vegetables',
      stock: 2.8,
      unit: 'kg',
      reorderLevel: 2,
      costPerUnit: 160,
    },
  ]);

  movements = signal<Movement[]>([
    {
      id: 1,
      date: 'Sep 02, 2026 • 10:32 AM',
      ingredient: 'Chicken',
      type: 'Stock In',
      quantity: 10,
      unit: 'kg',
      reason: 'Supplier delivery',
    },
    {
      id: 2,
      date: 'Sep 02, 2026 • 10:15 AM',
      ingredient: 'Rice',
      type: 'Stock Out',
      quantity: 2.4,
      unit: 'kg',
      reason: 'Order #1024',
    },
    {
      id: 3,
      date: 'Sep 02, 2026 • 10:15 AM',
      ingredient: 'Egg',
      type: 'Stock Out',
      quantity: 2,
      unit: 'pcs',
      reason: 'Order #1024',
    },
    {
      id: 4,
      date: 'Sep 01, 2026 • 04:20 PM',
      ingredient: 'Chicken',
      type: 'Stock Out',
      quantity: 1,
      unit: 'kg',
      reason: 'Spoilage',
    },
  ]);

  get totalIngredients(): number {
    return this.ingredients().length;
  }

  get goodStock(): number {
    return this.ingredients().filter((item) => item.stock > item.reorderLevel)
      .length;
  }

  get lowStock(): number {
    return this.ingredients().filter(
      (item) => item.stock > 0 && item.stock <= item.reorderLevel,
    ).length;
  }

  get outOfStock(): number {
    return this.ingredients().filter((item) => item.stock <= 0).length;
  }

  get stockValue(): number {
    return this.ingredients().reduce(
      (total, item) => total + item.stock * item.costPerUnit,
      0,
    );
  }

  getStatus(item: InventoryItem): 'Good' | 'Low' | 'Out of Stock' {
    if (item.stock <= 0) {
      return 'Out of Stock';
    }

    if (item.stock <= item.reorderLevel) {
      return 'Low';
    }

    return 'Good';
  }

  get alerts(): InventoryItem[] {
    return this.ingredients().filter((item) => item.stock <= item.reorderLevel);
  }
}
