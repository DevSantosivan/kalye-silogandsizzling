export type NotificationType =
  | 'order'
  | 'stock'
  | 'staff'
  | 'login'
  | 'system';

export interface Notification {
  id: number;

  userId: string | null;

  type: NotificationType;

  title: string;

  message: string;

  referenceId: string | null;

  read: boolean;

  createdAt: string;
}

export interface CreateNotificationPayload {
  userId?: string | null;

  type: NotificationType;

  title: string;

  message: string;

  referenceId?: string | null;
}