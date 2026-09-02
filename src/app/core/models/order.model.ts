export type OrderType = 'Dine-in' | 'Take-out';

export type PaymentMethod = 'Cash' | 'GCash' | 'Card';

export type OrderStatus =
  | 'Pending'
  | 'Preparing'
  | 'Ready'
  | 'Completed'
  | 'Cancelled';

export interface CreateOrderItem {
  menuItemId: number;
  quantity: number;
}

export interface CreateOrderPayload {
  orderType: OrderType;

  customerName: string | null;

  customerContact: string | null;

  tableNumber: string | null;

  paymentMethod: PaymentMethod;

  cashReceived: number;

  discount: number;

  items: CreateOrderItem[];
}

export interface Order {
  id: number;

  orderType: OrderType;

  customerName: string | null;

  customerContact: string | null;

  tableNumber: string | null;

  paymentMethod: PaymentMethod;

  cashReceived: number;

  changeAmount: number;

  subtotal: number;

  discount: number;

  total: number;

  status: OrderStatus;

  createdAt: string;

  updatedAt: string;
}
