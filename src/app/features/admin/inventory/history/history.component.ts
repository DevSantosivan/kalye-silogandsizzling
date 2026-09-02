import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
  selector: 'app-history',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent {
  search = '';
  typeFilter = 'All';

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
    {
      id: 5,
      date: 'Sep 01, 2026 • 02:05 PM',
      ingredient: 'Rice',
      type: 'Stock In',
      quantity: 25,
      unit: 'kg',
      reason: 'Supplier delivery',
    },
    {
      id: 6,
      date: 'Aug 31, 2026 • 11:45 AM',
      ingredient: 'Cooking Oil',
      type: 'Stock In',
      quantity: 5,
      unit: 'L',
      reason: 'Supplier delivery',
    },
  ]);

  filteredMovements = computed(() => {
    const query = this.search.toLowerCase().trim();

    return this.movements().filter((item) => {
      const matchesSearch =
        !query ||
        item.ingredient.toLowerCase().includes(query) ||
        item.reason.toLowerCase().includes(query);

      const matchesType =
        this.typeFilter === 'All' || item.type === this.typeFilter;

      return matchesSearch && matchesType;
    });
  });
}
