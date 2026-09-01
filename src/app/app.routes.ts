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
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },

      {
        path: 'orders',
        loadComponent: () =>
          import('./features/admin/orders/orders.component').then(
            (m) => m.OrdersComponent,
          ),
      },

      {
        path: 'menu',
        loadComponent: () =>
          import('./features/admin/menu/menu.component').then(
            (m) => m.MenuComponent,
          ),
      },

      {
        path: 'categories',
        loadComponent: () =>
          import('./features/admin/categories/categories.component').then(
            (m) => m.CategoriesComponent,
          ),
      },

      {
        path: 'staff',
        loadComponent: () =>
          import('./features/admin/staff/staff.component').then(
            (m) => m.StaffComponent,
          ),
      },

      {
        path: 'customers',
        loadComponent: () =>
          import('./features/admin/customers/customers.component').then(
            (m) => m.CustomersComponent,
          ),
      },

      {
        path: 'sales',
        loadComponent: () =>
          import('./features/admin/sales/sales.component').then(
            (m) => m.SalesComponent,
          ),
      },

      {
        path: 'reports',
        loadComponent: () =>
          import('./features/admin/reports/reports.component').then(
            (m) => m.ReportsComponent,
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

  {
    path: '**',
    redirectTo: '',
  },
];
