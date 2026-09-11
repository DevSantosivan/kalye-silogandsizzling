
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  AppNotification,
  NotificationService,
} from '../../../core/services/notification.service';

interface AdminNotification {
  id: number;

  type:
    | 'order'
    | 'stock'
    | 'system'
    | 'user';

  title: string;

  message: string;

  time: string;

  read: boolean;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss',
})
export class NotificationComponent
  implements OnInit, OnDestroy
{
  private readonly notificationService =
    inject(NotificationService);

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  notifications =
    signal<AdminNotification[]>([]);

  // =====================================================
  // STATE
  // =====================================================

  isLoading = signal(false);

  errorMessage = signal('');

  // =====================================================
  // FILTER
  // =====================================================

  activeFilter =
    signal<'all' | 'unread'>('all');

  // =====================================================
  // INIT
  // =====================================================

  async ngOnInit(): Promise<void> {
    await this.loadNotifications();

    // START REALTIME
    this.subscribeToNotifications();
  }

  // =====================================================
  // DESTROY
  // =====================================================

  ngOnDestroy(): void {
    // STOP REALTIME
    this.notificationService
      .unsubscribeFromNotifications();
  }

  // =====================================================
  // LOAD NOTIFICATIONS
  // =====================================================

  async loadNotifications(): Promise<void> {
    this.isLoading.set(true);

    this.errorMessage.set('');

    try {
      const data =
        await this.notificationService
          .getNotifications();

      this.notifications.set(
        data.map(
          (notification) =>
            this.mapNotification(
              notification,
            ),
        ),
      );
    } catch (error) {
      console.error(
        'Failed to load notifications:',
        error,
      );

      this.errorMessage.set(
        'Failed to load notifications.',
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  // =====================================================
  // REALTIME SUBSCRIPTION
  // =====================================================

  private subscribeToNotifications(): void {
    this.notificationService
      .subscribeToNotifications(
        (notification) => {
          const mapped =
            this.mapNotification(
              notification,
            );

          // =================================================
          // PREVENT DUPLICATES
          // =================================================

          const exists =
            this.notifications().some(
              (item) =>
                item.id === mapped.id,
            );

          if (exists) {
            return;
          }

          // =================================================
          // ADD NEW NOTIFICATION AT TOP
          // =================================================

          this.notifications.update(
            (notifications) => [
              mapped,
              ...notifications,
            ],
          );

          console.log(
            'REALTIME NOTIFICATION:',
            notification,
          );
        },
      );
  }

  // =====================================================
  // FILTERED
  // =====================================================

  filteredNotifications =
    computed(() => {
      const notifications =
        this.notifications();

      if (
        this.activeFilter() ===
        'unread'
      ) {
        return notifications.filter(
          (notification) =>
            !notification.read,
        );
      }

      return notifications;
    });

  // =====================================================
  // COUNTS
  // =====================================================

  unreadCount =
    computed(() => {
      return this.notifications().filter(
        (notification) =>
          !notification.read,
      ).length;
    });

  totalCount =
    computed(() => {
      return this.notifications().length;
    });

  readCount =
    computed(() => {
      return (
        this.totalCount() -
        this.unreadCount()
      );
    });

  // =====================================================
  // FILTER
  // =====================================================

  setFilter(
    filter: 'all' | 'unread',
  ): void {
    this.activeFilter.set(filter);
  }

  // =====================================================
  // READ NOTIFICATION
  // =====================================================

  async readNotification(
    id: number,
  ): Promise<void> {
    const notification =
      this.notifications().find(
        (item) => item.id === id,
      );

    if (!notification) {
      return;
    }

    if (notification.read) {
      return;
    }

    // =================================================
    // OPTIMISTIC UI
    // =================================================

    this.notifications.update(
      (notifications) =>
        notifications.map(
          (item) =>
            item.id === id
              ? {
                  ...item,
                  read: true,
                }
              : item,
        ),
    );

    try {
      await this.notificationService
        .markAsRead(id);
    } catch (error) {
      console.error(
        'Failed to mark notification as read:',
        error,
      );
    }
  }

  // =====================================================
  // MARK ALL AS READ
  // =====================================================

  async markAllAsRead(): Promise<void> {
    this.notifications.update(
      (notifications) =>
        notifications.map(
          (notification) => ({
            ...notification,
            read: true,
          }),
        ),
    );

    try {
      await this.notificationService
        .markAllAsRead();
    } catch (error) {
      console.error(
        'Failed to mark all notifications as read:',
        error,
      );
    }
  }

  // =====================================================
  // CLEAR READ
  // =====================================================

  async clearReadNotifications(): Promise<void> {
    try {
      await this.notificationService
        .clearReadNotifications();

      this.notifications.update(
        (notifications) =>
          notifications.filter(
            (notification) =>
              !notification.read,
          ),
      );
    } catch (error) {
      console.error(
        'Failed to clear notifications:',
        error,
      );
    }
  }

  // =====================================================
  // FORMAT TIME
  // =====================================================

  private formatRelativeTime(
    createdAt: string,
  ): string {
    const date =
      new Date(createdAt);

    const now =
      new Date();

    const diff =
      now.getTime() -
      date.getTime();

    const seconds =
      Math.floor(diff / 1000);

    if (seconds < 60) {
      return 'Just now';
    }

    const minutes =
      Math.floor(seconds / 60);

    if (minutes < 60) {
      return `${minutes} minute${
        minutes !== 1 ? 's' : ''
      } ago`;
    }

    const hours =
      Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours} hour${
        hours !== 1 ? 's' : ''
      } ago`;
    }

    const days =
      Math.floor(hours / 24);

    if (days < 7) {
      return `${days} day${
        days !== 1 ? 's' : ''
      } ago`;
    }

    return date.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      },
    );
  }

  // =====================================================
  // MAP
  // =====================================================

  private mapNotification(
    notification: AppNotification,
  ): AdminNotification {
    return {
      id: notification.id,

      type: notification.type,

      title: notification.title,

      message: notification.message,

      time: this.formatRelativeTime(
        notification.created_at,
      ),

      read: notification.read,
    };
  }

  // =====================================================
  // TRACK
  // =====================================================

  trackNotification(
    index: number,
    notification: AdminNotification,
  ): number {
    return notification.id;
  }
}

