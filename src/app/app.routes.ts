import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { loginGuard } from './core/guards/login.guard';

export const routes: Routes = [
  // ==========================================
  // AUTH
  // ==========================================

  {
  path: '',

  canActivate: [loginGuard],

  loadComponent: () =>
    import('./features/auth/login/login.component').then(
      (m) => m.LoginComponent,
    ),
},

  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },

  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
  },

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
      // ========================================
      // HOME
      // /
      // ========================================

      {
        path: '',
        loadComponent: () =>
          import('./features/public/home/home.component').then(
            (m) => m.HomeComponent,
          ),
      },

      // ========================================
      // MENU
      // /menu
      // ========================================

      {
        path: 'menu',
        loadComponent: () =>
          import('./features/public/menu/menu.component').then(
            (m) => m.MenuComponent,
          ),
      },

      // ========================================
      // CART
      // /cart
      // ========================================

      {
        path: 'cart',
        loadComponent: () =>
          import('./features/public/cart/cart.component').then(
            (m) => m.CartComponent,
          ),
      },

      // ========================================
      // CHECKOUT
      // /checkout
      // ========================================

      {
        path: 'checkout',
        loadComponent: () =>
          import('./features/public/checkout/checkout.component').then(
            (m) => m.CheckoutComponent,
          ),
      },

      // ========================================
      // PAYMENT
      // /payment
      // ========================================

      {
        path: 'payment',
        loadComponent: () =>
          import('./features/public/payment/payment.component').then(
            (m) => m.PaymentComponent,
          ),
      },

      // ========================================
      // ORDER STATUS
      // /order-status
      // ========================================

      {
        path: 'order-status',
        loadComponent: () =>
          import('./features/public/order-status/order-status.component').then(
            (m) => m.OrderStatusComponent,
          ),
      },

      // ========================================
      // ORDER STATUS WITH ID
      // /order/:id
      // ========================================

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
  // OWNER + ADMIN ONLY
  // ==========================================

  {
    path: 'admin',

    canActivate: [authGuard, roleGuard],

    data: {
      roles: ['Owner', 'Admin'],
    },

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
      // CREATE MENU
      // /admin/menu/create
      // ========================================

      {
        path: 'menu/create',
        loadComponent: () =>
          import('./features/admin/menu/create-menu/create-menu.component').then(
            (m) => m.CreateMenuComponent,
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
      // /admin/inventory
      // ========================================

      {
        path: 'inventory',

        children: [
          // ======================================
          // INVENTORY OVERVIEW
          // /admin/inventory
          // ======================================

          {
            path: '',
            loadComponent: () =>
              import('./features/admin/inventory/inventory.component').then(
                (m) => m.InventoryComponent,
              ),
          },

          // ======================================
          // INGREDIENTS
          // /admin/inventory/ingredients
          // ======================================

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

              // ==================================
              // ADD INGREDIENT
              // /admin/inventory/ingredients/add
              // ==================================

              {
                path: 'add',
                loadComponent: () =>
                  import('./features/admin/inventory/ingredients/add-ingredient/add-ingredient.component').then(
                    (m) => m.AddIngredientComponent,
                  ),
              },
            ],
          },

          // ======================================
          // STOCK IN
          // /admin/inventory/stock-in
          // ======================================

          {
            path: 'stock-in',
            loadComponent: () =>
              import('./features/admin/inventory/stock-in/stock-in.component').then(
                (m) => m.StockInComponent,
              ),
          },

          // ======================================
          // STOCK OUT
          // /admin/inventory/stock-out
          // ======================================

          {
            path: 'stock-out',
            loadComponent: () =>
              import('./features/admin/inventory/stock-out/stock-out.component').then(
                (m) => m.StockOutComponent,
              ),
          },

          // ======================================
          // HISTORY
          // /admin/inventory/history
          // ======================================

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
      // EXPENSES
      // /admin/expenses
      // ========================================

      {
        path: 'expenses',
        loadComponent: () =>
          import('./features/admin/expenses/expenses.component').then(
            (m) => m.ExpensesComponent,
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
        path: 'notifications',
        loadComponent: () =>
          import('./features/admin/notification/notification.component').then(
            (m) => m.NotificationComponent,
          ),
      },
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
  // CASHIER ONLY
  // ==========================================

  {
    path: 'cashier',

    canActivate: [authGuard, roleGuard],

    data: {
      roles: ['Cashier'],
    },

    loadComponent: () =>
      import('./layout/cashier-layout/cashier-layout.component').then(
        (m) => m.CashierLayoutComponent,
      ),

    children: [
      // ========================================
      // CASHIER DEFAULT
      // /cashier → /cashier/pos
      // ========================================

      {
        path: '',
        redirectTo: 'pos',
        pathMatch: 'full',
      },

      // ========================================
      // POS
      // /cashier/pos
      // ========================================

      {
        path: 'pos',
        loadComponent: () =>
          import('./features/cashier/pos/pos.component').then(
            (m) => m.PosComponent,
          ),
      },

      // ========================================
      // ACTIVE ORDERS
      // /cashier/active-orders
      // ========================================

      {
        path: 'active-orders',
        loadComponent: () =>
          import('./features/cashier/active-orders/active-orders.component').then(
            (m) => m.ActiveOrdersComponent,
          ),
      },

      // ========================================
      // INVENTORY
      // /cashier/inventory
      // ========================================

      {
        path: 'inventory',
        loadComponent: () =>
          import('./features/admin/inventory/inventory.component').then(
            (m) => m.InventoryComponent,
          ),
      },

      // ========================================
      // PRINTERS
      // /cashier/printers
      // ========================================

      {
        path: 'printers',
        loadComponent: () =>
          import('./features/cashier/printer/printer.component').then(
            (m) => m.PrinterComponent,
          ),
      },
    ],
  },

  // ==========================================
  // KITCHEN
  // KITCHEN STAFF ONLY
  // ==========================================

  {
    path: 'kitchen',

    canActivate: [authGuard, roleGuard],

    data: {
      roles: ['Kitchen Staff'],
    },

    loadComponent: () =>
      import('./layout/kitchen-layout/kitchen-layout.component').then(
        (m) => m.KitchenLayoutComponent,
      ),

    children: [
      // ========================================
      // KITCHEN DEFAULT
      // /kitchen → /kitchen/orders
      // ========================================

      {
        path: '',
        redirectTo: 'orders',
        pathMatch: 'full',
      },

      // ========================================
      // ORDERS
      // /kitchen/orders
      // ========================================

      {
        path: 'orders',
        loadComponent: () =>
          import('./features/kitchen/kitchen-orders/kitchen-orders.component').then(
            (m) => m.KitchenOrdersComponent,
          ),
      },

      // ========================================
      // COMPLETED
      // /kitchen/completed
      // ========================================

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
