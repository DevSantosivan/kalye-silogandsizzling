import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

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

  // =========================================================
  // FILTERS
  // =========================================================

  search = '';

  categoryFilter = 'All';

  // =========================================================
  // DATA
  // =========================================================

  ingredients = signal<Ingredient[]>([]);

  loading = signal(true);

  error = signal('');

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  ngOnInit(): void {
    this.loadIngredients();
  }

  // =========================================================
  // LOAD INGREDIENTS
  // =========================================================

  async loadIngredients(): Promise<void> {
    this.loading.set(true);

    this.error.set('');

    try {
      const data = await this.ingredientService.getIngredients();

      this.ingredients.set(data);
    } catch (error) {
      console.error('Failed to load ingredients:', error);

      this.error.set('Unable to load ingredients. Please try again.');

      await Swal.fire({
        icon: 'error',

        title: 'Load Failed',

        text: 'Unable to load ingredients. Please try again.',

        confirmButtonText: 'Try Again',

        confirmButtonColor: '#191919',
      });
    } finally {
      this.loading.set(false);
    }
  }

  // =========================================================
  // CATEGORIES
  // =========================================================

  categories = computed(() => {
    const values = this.ingredients().map((item) => item.category);

    return ['All', ...new Set(values)];
  });

  // =========================================================
  // FILTERED INGREDIENTS
  // =========================================================

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

  // =========================================================
  // STATUS
  // =========================================================

  getStatus(item: Ingredient): 'Good' | 'Low' | 'Out of Stock' {
    if (item.stock <= 0) {
      return 'Out of Stock';
    }

    if (item.stock <= item.reorderLevel) {
      return 'Low';
    }

    return 'Good';
  }
  // =========================================================
  // VIEW INGREDIENT
  // =========================================================

  async viewIngredient(item: Ingredient): Promise<void> {
    const status = this.getStatus(item);

    const statusColor =
      status === 'Out of Stock'
        ? '#b63f3f'
        : status === 'Low'
          ? '#966200'
          : '#39834d';

    const recipeUnit = item.recipeUnit || 'Not set';

    // =========================================================
    // RECIPE YIELD
    // Stored value only.
    // NO CALCULATION.
    // Example:
    // Inventory Unit = kg
    // Recipe Unit = pcs
    // Recipe Yield = 30 pcs
    // =========================================================

    const recipeYield = Number((item as any).recipeYield) || 0;

    const costPerUnit = Number(item.costPerUnit) || 0;

    await Swal.fire({
      title: 'Ingredient Details',

      width: 620,

      confirmButtonText: 'Close',

      confirmButtonColor: '#191919',

      html: `
      <div
        style="
          text-align:left;
          font-size:13px;
        "
      >

        <!-- =================================================
             HEADER
        ================================================== -->

        <div
          style="
            padding:15px;
            margin-bottom:16px;
            border:1px solid #e9e7e3;
            border-radius:10px;
            background:#faf9f7;
          "
        >

          <div
            style="
              font-size:11px;
              color:#999;
              margin-bottom:5px;
              text-transform:uppercase;
              letter-spacing:.08em;
            "
          >
            Ingredient
          </div>

          <strong
            style="
              font-size:20px;
              color:#191919;
            "
          >
            ${this.escapeHtml(item.name)}
          </strong>

          <div
            style="
              margin-top:5px;
              font-size:11px;
              color:#999;
            "
          >
            ID #${item.id}
          </div>

        </div>


        <!-- =================================================
             INVENTORY
        ================================================== -->

        <div
          style="
            margin-bottom:18px;
          "
        >

          <div
            style="
              margin-bottom:9px;
              font-size:10px;
              font-weight:700;
              letter-spacing:.1em;
              color:#999;
            "
          >
            INVENTORY
          </div>


          <div
            style="
              display:grid;
              grid-template-columns:1fr 1fr;
              gap:8px;
            "
          >

            <div
              style="
                padding:12px;
                border:1px solid #e9e7e3;
                border-radius:9px;
              "
            >

              <div
                style="
                  font-size:10px;
                  color:#999;
                "
              >
                Current Stock
              </div>

              <strong
                style="
                  display:block;
                  margin-top:4px;
                  font-size:16px;
                  color:#191919;
                "
              >
                ${Number(item.stock).toLocaleString()}
                ${this.escapeHtml(item.unit)}
              </strong>

            </div>


            <div
              style="
                padding:12px;
                border:1px solid #e9e7e3;
                border-radius:9px;
              "
            >

              <div
                style="
                  font-size:10px;
                  color:#999;
                "
              >
                Reorder Level
              </div>

              <strong
                style="
                  display:block;
                  margin-top:4px;
                  font-size:16px;
                  color:#191919;
                "
              >
                ${Number(item.reorderLevel).toLocaleString()}
                ${this.escapeHtml(item.unit)}
              </strong>

            </div>

          </div>

        </div>


        <!-- =================================================
             COSTING
        ================================================== -->

        <div
          style="
            margin-bottom:18px;
          "
        >

          <div
            style="
              margin-bottom:9px;
              font-size:10px;
              font-weight:700;
              letter-spacing:.1em;
              color:#999;
            "
          >
            COSTING
          </div>


          <div
            style="
              display:grid;
              grid-template-columns:1fr 1fr;
              gap:8px;
            "
          >

            <div
              style="
                padding:12px;
                border:1px solid #e9e7e3;
                border-radius:9px;
              "
            >

              <div
                style="
                  font-size:10px;
                  color:#999;
                "
              >
                Cost Per ${this.escapeHtml(item.unit)}
              </div>

              <strong
                style="
                  display:block;
                  margin-top:4px;
                  font-size:16px;
                  color:#191919;
                "
              >
                ₱${costPerUnit.toFixed(2)}
              </strong>

            </div>


            <div
              style="
                padding:12px;
                border:1px solid #e9e7e3;
                border-radius:9px;
              "
            >

              <div
                style="
                  font-size:10px;
                  color:#999;
                "
              >
                Stock Value
              </div>

              <strong
                style="
                  display:block;
                  margin-top:4px;
                  font-size:16px;
                  color:#191919;
                "
              >
                ₱${(Number(item.stock) * costPerUnit).toFixed(2)}
              </strong>

            </div>

          </div>

        </div>


        <!-- =================================================
             RECIPE
        ================================================== -->

        <div
          style="
            margin-bottom:18px;
          "
        >

          <div
            style="
              margin-bottom:9px;
              font-size:10px;
              font-weight:700;
              letter-spacing:.1em;
              color:#999;
            "
          >
            RECIPE
          </div>


          <div
            style="
              border:1px solid #e9e7e3;
              border-radius:9px;
              overflow:hidden;
            "
          >

            <!-- RECIPE UNIT -->

            <div
              style="
                padding:10px 12px;
                display:flex;
                justify-content:space-between;
                border-bottom:1px solid #f0efed;
              "
            >

              <span style="color:#999;">
                Recipe Unit
              </span>

              <strong>
                ${this.escapeHtml(recipeUnit)}
              </strong>

            </div>


            <!-- RECIPE YIELD -->

            <div
              style="
                padding:10px 12px;
                display:flex;
                justify-content:space-between;
              "
            >

              <span style="color:#999;">
                Recipe Yield
              </span>

              <strong>
                ${
                  recipeYield > 0
                    ? `${recipeYield.toLocaleString()} ${this.escapeHtml(recipeUnit)}`
                    : 'Not configured'
                }
              </strong>

            </div>

          </div>

        </div>


        <!-- =================================================
             STATUS
        ================================================== -->

        <div
          style="
            padding:12px;
            border-radius:9px;
            background:${
              status === 'Good'
                ? '#f3faf5'
                : status === 'Low'
                  ? '#fff9ed'
                  : '#fff4f4'
            };
            color:${statusColor};
          "
        >

          <div
            style="
              font-size:10px;
              font-weight:700;
              letter-spacing:.08em;
            "
          >
            INVENTORY STATUS
          </div>

          <strong
            style="
              display:block;
              margin-top:4px;
              font-size:14px;
            "
          >
            ${status}
          </strong>

        </div>


        <!-- =================================================
             UPDATED
        ================================================== -->

        <div
          style="
            margin-top:14px;
            font-size:10px;
            color:#aaa;
            text-align:right;
          "
        >
          Last updated:
          ${this.formatDate(item.updatedAt)}
        </div>

      </div>
    `,
    });
  }
  // =========================================================
  // EDIT
  // =========================================================

  editIngredient(item: Ingredient): void {
    this.router.navigate(['/admin/inventory/ingredients/edit', item.id]);
  }

  // =========================================================
  // DELETE
  // =========================================================

  async deleteIngredient(item: Ingredient): Promise<void> {
    const result = await Swal.fire({
      icon: 'warning',

      title: 'Delete ingredient?',

      text: `${item.name} will be removed from your inventory.`,

      showCancelButton: true,

      confirmButtonText: 'Yes, delete it',

      cancelButtonText: 'Cancel',

      reverseButtons: true,

      confirmButtonColor: '#dc2626',

      cancelButtonColor: '#6b7280',

      focusCancel: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await this.ingredientService.deleteIngredient(item.id);

      this.ingredients.update((items) =>
        items.filter((current) => current.id !== item.id),
      );

      await Swal.fire({
        icon: 'success',

        title: 'Ingredient Deleted',

        text: `${item.name} has been removed from inventory.`,

        confirmButtonText: 'Done',

        confirmButtonColor: '#191919',
      });
    } catch (error) {
      console.error('Failed to delete ingredient:', error);

      await Swal.fire({
        icon: 'error',

        title: 'Delete Failed',

        text: 'Unable to delete ingredient. Please try again.',

        confirmButtonText: 'Close',

        confirmButtonColor: '#191919',
      });
    }
  }

  // =========================================================
  // ADD INGREDIENT
  // =========================================================

  goToAddIngredient(): void {
    this.router.navigate(['/admin/inventory/ingredients/add']);
  }

  // =========================================================
  // FORMAT DATE
  // =========================================================

  private formatDate(value: string): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return date.toLocaleString('en-PH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  // =========================================================
  // ESCAPE HTML
  // =========================================================

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
