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

      {
        path: 'menu/create',
        loadComponent: () =>
          import('./features/admin/menu/create-menu/create-menu.component').then(
            (m) => m.CreateMenuComponent,
          ),
      },

      // {
      //   path: 'menu/:id',
      //   loadComponent: () =>
      //     import('./features/admin/menu/view-menu-item/view-menu-item.component').then(
      //       (m) => m.ViewMenuItemComponent,
      //     ),
      // },

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
  // CASHIER
  // ==========================================

  {
    path: 'cashier',

    loadComponent: () =>
      import('./layout/cashier-layout/cashier-layout.component').then(
        (m) => m.CashierLayoutComponent,
      ),

    children: [
      // /cashier
      {
        path: '',
        redirectTo: 'pos',
        pathMatch: 'full',
      },

      // /cashier/pos
      {
        path: 'pos',
        loadComponent: () =>
          import('./features/cashier/pos/pos.component').then(
            (m) => m.PosComponent,
          ),
      },
    ],
  },

  // ==========================================
  // KITCHEN
  // ==========================================

  {
    path: 'kitchen',

    loadComponent: () =>
      import('./layout/kitchen-layout/kitchen-layout.component').then(
        (m) => m.KitchenLayoutComponent,
      ),

    children: [
      // /kitchen
      {
        path: '',
        redirectTo: 'orders',
        pathMatch: 'full',
      },

      // /kitchen/orders
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/kitchen/kitchen-orders/kitchen-orders.component').then(
            (m) => m.KitchenOrdersComponent,
          ),
      },
      {
        path: 'completed',
        loadComponent: () =>
          import('./features/kitchen/kitchen-completed/kitchen-completed.component').then(
            (m) => m.KitchenCompletedComponent,
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
