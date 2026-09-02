import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { HistoryService } from '../../../../core/services/admin/inventory/history.service';
import { Movement } from '../../../../core/models/movement.model';
import { DateTimePipe } from '../../../../shared/components/pipes/date-time.pipe';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [FormsModule, DateTimePipe],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent implements OnInit {
  private historyService = inject(HistoryService);

  // ==========================================
  // DATA
  // ==========================================

  movements = signal<Movement[]>([]);

  isLoading = signal(false);

  // ==========================================
  // FILTERS
  // ==========================================

  search = signal('');

  typeFilter = signal('All');

  // ==========================================
  // FILTERED MOVEMENTS
  // ==========================================

  filteredMovements = computed(() => {
    const query = this.search().toLowerCase().trim();

    const selectedType = this.typeFilter();

    return this.movements().filter((item) => {
      // Search ingredient OR reason
      const matchesSearch =
        !query ||
        item.ingredient.toLowerCase().includes(query) ||
        item.reason.toLowerCase().includes(query);

      // Movement filter
      const matchesType = selectedType === 'All' || item.type === selectedType;

      return matchesSearch && matchesType;
    });
  });

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  async ngOnInit(): Promise<void> {
    await this.loadHistory();
  }

  // ==========================================
  // LOAD HISTORY
  // ==========================================

  async loadHistory(): Promise<void> {
    this.isLoading.set(true);

    try {
      const data = await this.historyService.getMovements();

      this.movements.set(data);

      console.log('Inventory history loaded:', data);
    } catch (error) {
      console.error('Failed to load inventory history:', error);

      alert('Unable to load inventory history. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
