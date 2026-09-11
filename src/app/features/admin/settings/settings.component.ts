import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  // =========================================================
  // NOTIFICATION SETTINGS
  // =========================================================

  orderNotifications = signal(true);
  lowStockNotifications = signal(true);
  systemNotifications = signal(true);

  // =========================================================
  // SECURITY SETTINGS
  // =========================================================

  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  // =========================================================
  // TOGGLE NOTIFICATION
  // =========================================================

  toggleOrderNotifications(): void {
    this.orderNotifications.update((value) => !value);
  }

  toggleLowStockNotifications(): void {
    this.lowStockNotifications.update((value) => !value);
  }

  toggleSystemNotifications(): void {
    this.systemNotifications.update((value) => !value);
  }

  // =========================================================
  // PASSWORD VISIBILITY
  // =========================================================

  toggleCurrentPassword(): void {
    this.showCurrentPassword.update((value) => !value);
  }

  toggleNewPassword(): void {
    this.showNewPassword.update((value) => !value);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((value) => !value);
  }

  // =========================================================
  // SAVE NOTIFICATIONS
  // =========================================================

  saveNotifications(): void {
    console.log('Notification settings saved', {
      orderNotifications: this.orderNotifications(),
      lowStockNotifications: this.lowStockNotifications(),
      systemNotifications: this.systemNotifications(),
    });
  }

  // =========================================================
  // CHANGE PASSWORD
  // =========================================================

  changePassword(): void {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      return;
    }

    if (this.newPassword.length < 8) {
      return;
    }

    console.log('Password change requested');

    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }
}