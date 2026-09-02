import { Routes } from '@angular/router';

export const routes: Routes = [
  // ==========================================
  // PUBLIC
  // ==========================================

  {
    path: '',

    loadComponent: () =>
      import('./layout/public-layout/public-layout.component').then(
        (m) => m.PublicLayoutComponent,
      ),

    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/public/home/home.component').then(
            (m) => m.HomeComponent,
          ),
      },

      {
        path: 'menu',
        loadComponent: () =>
          import('./features/public/menu/menu.component').then(
            (m) => m.MenuComponent,
          ),
      },

      {
        path: 'cart',
        loadComponent: () =>
          import('./features/public/cart/cart.component').then(
            (m) => m.CartComponent,
          ),
      },

      {
        path: 'checkout',
        loadComponent: () =>
          import('./features/public/checkout/checkout.component').then(
            (m) => m.CheckoutComponent,
          ),
      },

      {
        path: 'payment',
        loadComponent: () =>
          import('./features/public/payment/payment.component').then(
            (m) => m.PaymentComponent,
          ),
      },

      {
        path: 'order-status',
        loadComponent: () =>
          import('./features/public/order-status/order-status.component').then(
            (m) => m.OrderStatusComponent,
          ),
      },

      {
        path: 'order/:id',
        loadComponent: () =>
          import('./features/public/order-status/order-status.component').then(
            (m) => m.OrderStatusComponent,
          ),
      },
    ],
  },

  // ==========================================
  // ADMIN
  // ==========================================

  {
    path: 'admin',

    loadComponent: () =>
      import('./layout/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent,
      ),

    children: [
      // ========================================
      // ADMIN DEFAULT
      // /admin → /admin/dashboard
      // ========================================

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },

      // ========================================
      // DASHBOARD
      // /admin/dashboard
      // ========================================

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },

      // ========================================
      // ORDERS
      // /admin/orders
      // ========================================

      {
        path: 'orders',
        loadComponent: () =>
          import('./features/admin/orders/orders.component').then(
            (m) => m.OrdersComponent,
          ),
      },

      // ========================================
      // MENU
      // /admin/menu
      // ========================================

      {
        path: 'menu',
        loadComponent: () =>
          import('./features/admin/menu/menu.component').then(
            (m) => m.MenuComponent,
          ),
      },

      // ========================================
      // CATEGORIES
      // /admin/categories
      // ========================================

      {
        path: 'categories',
        loadComponent: () =>
          import('./features/admin/categories/categories.component').then(
            (m) => m.CategoriesComponent,
          ),
      },

      // ========================================
      // INVENTORY
      // ========================================

      {
        path: 'inventory',

        children: [
          // /admin/inventory
          // Inventory Overview
          {
            path: '',
            loadComponent: () =>
              import('./features/admin/inventory/inventory.component').then(
                (m) => m.InventoryComponent,
              ),
          },

          // /admin/inventory/ingredients
          {
            path: 'ingredients',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./features/admin/inventory/ingredients/ingredients.component').then(
                    (m) => m.IngredientsComponent,
                  ),
              },

              {
                path: 'add',
                loadComponent: () =>
                  import('./features/admin/inventory/ingredients/add-ingredient/add-ingredient.component').then(
                    (m) => m.AddIngredientComponent,
                  ),
              },
            ],
          },

          // /admin/inventory/stock-in
          {
            path: 'stock-in',
            loadComponent: () =>
              import('./features/admin/inventory/stock-in/stock-in.component').then(
                (m) => m.StockInComponent,
              ),
          },

          // /admin/inventory/stock-out
          {
            path: 'stock-out',
            loadComponent: () =>
              import('./features/admin/inventory/stock-out/stock-out.component').then(
                (m) => m.StockOutComponent,
              ),
          },

          // /admin/inventory/history
          {
            path: 'history',
            loadComponent: () =>
              import('./features/admin/inventory/history/history.component').then(
                (m) => m.HistoryComponent,
              ),
          },
        ],
      },

      // ========================================
      // STAFF
      // /admin/staff
      // ========================================

      {
        path: 'staff',
        loadComponent: () =>
          import('./features/admin/staff/staff.component').then(
            (m) => m.StaffComponent,
          ),
      },

      // ========================================
      // CUSTOMERS
      // /admin/customers
      // ========================================

      {
        path: 'customers',
        loadComponent: () =>
          import('./features/admin/customers/customers.component').then(
            (m) => m.CustomersComponent,
          ),
      },

      // ========================================
      // SALES
      // /admin/sales
      // ========================================

      {
        path: 'sales',
        loadComponent: () =>
          import('./features/admin/sales/sales.component').then(
            (m) => m.SalesComponent,
          ),
      },

      // ========================================
      // REPORTS
      // /admin/reports
      // ========================================

      {
        path: 'reports',
        loadComponent: () =>
          import('./features/admin/reports/reports.component').then(
            (m) => m.ReportsComponent,
          ),
      },

      // ========================================
      // SETTINGS
      // /admin/settings
      // ========================================

      {
        path: 'settings',
        loadComponent: () =>
          import('./features/admin/settings/settings.component').then(
            (m) => m.SettingsComponent,
          ),
      },
    ],
  },

  // ==========================================
  // FALLBACK
  // ==========================================

  {
    path: '**',
    redirectTo: '',
  },
];
