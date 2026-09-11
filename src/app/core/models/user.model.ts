export type UserRole = 'Owner' | 'Admin' | 'Cashier' | 'Kitchen Staff' | 'User';

export type UserStatus = 'Active' | 'Inactive';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface UpdateUserPayload {
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}
