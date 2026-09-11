import {
  Component,
  HostListener,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

import { SupabaseService } from '../../core/services/supabase.service';


interface AdminNotification {
  id: number;
  type: 'order' | 'stock' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,

  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],

  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent implements OnInit {

  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);



  
  // =====================================================
  // SIDEBAR
  // =====================================================

  sidebarOpen = signal(false);


  // =====================================================
  // PROFILE DROPDOWN
  // =====================================================

  profileMenuOpen = signal(false);

// =====================================================
// NOTIFICATIONS
// =====================================================

notificationMenuOpen = signal(false);

notifications = signal<AdminNotification[]>([
  {
    id: 1,
    type: 'order',
    title: 'New order received',
    message: 'A new order has been created from the cashier.',
    time: 'Just now',
    read: false,
  },

  {
    id: 2,
    type: 'stock',
    title: 'Low stock alert',
    message: 'Chicken ingredients have reached the reorder level.',
    time: '10 minutes ago',
    read: false,
  },

  {
    id: 3,
    type: 'system',
    title: 'System notification',
    message: 'Your admin account is currently active and protected.',
    time: '1 hour ago',
    read: true,
  },
]);
  // =====================================================
  // ACTIVE MODULE
  // =====================================================

  activeModule = signal('');


  // =====================================================
  // USER INFORMATION
  // =====================================================

  userName = 'Admin';

  userEmail = '';

  userRole = 'Administrator';

  userInitials = 'A';


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.loadCurrentUser();
  }


  // =====================================================
// NOTIFICATION DROPDOWN
// =====================================================

toggleNotificationMenu(): void {

  this.notificationMenuOpen.update(
    value => !value,
  );

  // Close profile menu when opening notifications
  this.profileMenuOpen.set(false);
}


closeNotificationMenu(): void {

  this.notificationMenuOpen.set(false);

}


// =====================================================
// UNREAD COUNT
// =====================================================

unreadNotificationCount(): number {

  return this.notifications().filter(
    notification => !notification.read,
  ).length;

}


// =====================================================
// READ SINGLE NOTIFICATION
// =====================================================

readNotification(id: number): void {

  this.notifications.update(
    notifications =>
      notifications.map(notification =>
        notification.id === id
          ? {
              ...notification,
              read: true,
            }
          : notification,
      ),
  );

}


// =====================================================
// MARK ALL AS READ
// =====================================================

markAllNotificationsAsRead(): void {

  this.notifications.update(
    notifications =>
      notifications.map(notification => ({
        ...notification,
        read: true,
      })),
  );

}


// =====================================================
// OPEN NOTIFICATIONS
// =====================================================

openNotifications(): void {

  this.closeNotificationMenu();

  // Temporary behavior.
  // We can create /admin/notifications later
  // if you want a dedicated notification page.

  console.log('Open notification activity');

}


  // =====================================================
  // LOAD CURRENT USER
  // =====================================================

  private loadCurrentUser(): void {

    const storedUser =
      localStorage.getItem('currentUser');


    if (!storedUser) {
      return;
    }


    try {

      const user = JSON.parse(storedUser);


      this.userName =
        user?.name || 'Admin';


      this.userEmail =
        user?.email || '';


      this.userRole =
        user?.role || 'Administrator';


      this.userInitials =
        this.getInitials(this.userName);


    } catch (error) {

      console.error(
        'Failed to load current user:',
        error,
      );

    }

  }


  // =====================================================
  // GET INITIALS
  // =====================================================

  private getInitials(name: string): string {

    if (!name) {
      return 'A';
    }


    const words =
      name
        .trim()
        .split(/\s+/)
        .filter(Boolean);


    if (words.length === 1) {

      return words[0]
        .substring(0, 2)
        .toUpperCase();

    }


    return (
      words[0][0] +
      words[words.length - 1][0]
    ).toUpperCase();

  }


  // =====================================================
  // SIDEBAR
  // =====================================================

  toggleSidebar(): void {

    this.sidebarOpen.update(
      value => !value,
    );

  }


  closeSidebar(): void {

    this.sidebarOpen.set(false);

  }


  // =====================================================
  // PROFILE DROPDOWN
  // =====================================================

  toggleProfileMenu(): void {

    this.profileMenuOpen.update(
      value => !value,
    );

  }


  closeProfileMenu(): void {

    this.profileMenuOpen.set(false);

  }


  // =====================================================
  // VIEW PROFILE
  // =====================================================

  viewProfile(): void {

    this.closeProfileMenu();

    // Temporary profile page behavior.
    // Change this route later if you create
    // a dedicated /admin/profile page.

    this.router.navigate([
      '/admin/settings',
    ]);

  }


  // =====================================================
  // SETTINGS
  // =====================================================

  openSettings(): void {

    this.closeProfileMenu();

    this.router.navigate([
      '/admin/settings',
    ]);

  }


  // =====================================================
  // LOGOUT
  // =====================================================

  async logout(): Promise<void> {

    this.closeProfileMenu();

    this.closeSidebar();


    try {

      await this.supabase.client.auth.signOut();

    } catch (error) {

      console.error(
        'Logout error:',
        error,
      );

    } finally {

      // Remove local user information

      localStorage.removeItem(
        'currentUser',
      );


      // Make sure no old user data remains

      sessionStorage.removeItem(
        'currentUser',
      );


      // Return to login

      await this.router.navigate([
        '/login',
      ]);

    }

  }


  // =====================================================
  // CLOSE PROFILE WHEN CLICKING OUTSIDE
  // =====================================================

@HostListener('document:click')
onDocumentClick(): void {

  this.closeProfileMenu();
  this.closeNotificationMenu();

}

}