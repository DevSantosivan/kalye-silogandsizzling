import { Component, inject, OnInit, signal } from '@angular/core';

import { RouterLink } from '@angular/router';
import { Ingredient } from '../../../core/models/ingredient.model';
import { Movement } from '../../../core/models/movement.model';
import { HistoryService } from '../../../core/services/admin/inventory/history.service';
import { IngredientService } from '../../../core/services/admin/inventory/ingredient.service';
import { DateTimePipe } from '../../../shared/components/pipes/date-time.pipe';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [RouterLink, DateTimePipe],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent implements OnInit {
  private ingredientService = inject(IngredientService);
  private historyService = inject(HistoryService);

  // ==========================================
  // DATA
  // ==========================================

  ingredients = signal<Ingredient[]>([]);

  movements = signal<Movement[]>([]);

  // ==========================================
  // STATE
  // ==========================================

  isLoading = signal(false);

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  async ngOnInit(): Promise<void> {
    await this.loadInventory();
  }

  // ==========================================
  // LOAD INVENTORY
  // ==========================================

  async loadInventory(): Promise<void> {
    this.isLoading.set(true);

    try {
      const [ingredients, movements] = await Promise.all([
        this.ingredientService.getIngredients(),
        this.historyService.getMovements(),
      ]);

      this.ingredients.set(ingredients);

      // Recent movements only
      this.movements.set(movements.slice(0, 5));

      console.log('Inventory loaded:', ingredients);

      console.log('Recent movements loaded:', movements);
    } catch (error) {
      console.error('Failed to load inventory:', error);

      alert('Unable to load inventory data. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  // ==========================================
  // SUMMARY
  // ==========================================

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

  // ==========================================
  // INVENTORY VALUE
  // ==========================================

  get stockValue(): number {
    return this.ingredients().reduce(
      (total, item) => total + item.stock * item.costPerUnit,
      0,
    );
  }

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
  // STOCK ALERTS
  // ==========================================

  get alerts(): Ingredient[] {
    return this.ingredients().filter((item) => item.stock <= item.reorderLevel);
  }
}
