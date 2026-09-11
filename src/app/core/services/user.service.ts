
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

// =========================================================
// ROLES
// =========================================================

export type UserRole =
  | 'Owner'
  | 'Admin'
  | 'Cashier'
  | 'Kitchen Staff'
  | 'User';

export type StaffRole =
  | 'Cashier'
  | 'Kitchen Staff'
  | 'User';

export type UserStatus =
  | 'Active'
  | 'Inactive';

// =========================================================
// USER
// =========================================================

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

// =========================================================
// CREATE USER
// =========================================================

export interface CreateUserPayload {
  name: string;
  email: string;

  /**
   * Password is ONLY sent to the create-staff
   * Edge Function.
   *
   * It is NEVER stored in public.users.
   */
  password: string;

  role: StaffRole;
  status: UserStatus;
}

// =========================================================
// UPDATE USER
// =========================================================

export interface UpdateUserPayload {
  name: string;
  email: string;
  role: StaffRole;
  status: UserStatus;
}

// =========================================================
// EDGE FUNCTION RESPONSE
// =========================================================

interface CreateStaffResponse {
  success: boolean;
  user?: User;
  error?: string;
}

// =========================================================
// SERVICE
// =========================================================

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly supabase = inject(SupabaseService);

  // =========================================================
  // GET STAFF ONLY
  //
  // Owner / Admin are excluded.
  // =========================================================

 async getUsers(): Promise<User[]> {
  const { data, error } = await this.supabase.client
    .from('users')
    .select(`
      id,
      name,
      email,
      role,
      status,
      created_at
    `)
    .order('created_at', {
      ascending: false,
    });

  if (error) {
    console.error('Get users error:', error);
    throw error;
  }

  console.log('ALL USERS FROM DATABASE:', data);

  return (data ?? []) as User[];
}
  // =========================================================
  // GET USER BY ID
  // =========================================================

  async getUserById(
    id: string,
  ): Promise<User | null> {
    const { data, error } =
      await this.supabase.client
        .from('users')
        .select(
          'id, name, email, role, status, created_at',
        )
        .eq('id', id)
        .maybeSingle();

    if (error) {
      console.error(
        'Get user error:',
        error,
      );

      throw error;
    }

    return data as User | null;
  }

  // =========================================================
  // CREATE STAFF
  //
  // IMPORTANT:
  //
  // Angular does NOT call auth.signUp().
  //
  // Angular calls:
  //
  //     create-staff
  //
  // Edge Function handles:
  //
  // 1. Supabase Auth user
  // 2. Password
  // 3. public.users profile
  // 4. Rollback if profile creation fails
  //
  // Password is NEVER stored in public.users.
  // =========================================================

  async createUser(
    payload: CreateUserPayload,
  ): Promise<User> {
    const name =
      payload.name.trim();

    const email =
      payload.email
        .trim()
        .toLowerCase();

    const password =
      payload.password.trim();

    // =======================================================
    // VALIDATION
    // =======================================================

    if (!name) {
      throw new Error(
        'Name is required.',
      );
    }

    if (!email) {
      throw new Error(
        'Email is required.',
      );
    }

    if (!password) {
      throw new Error(
        'Password is required.',
      );
    }

    if (password.length < 6) {
      throw new Error(
        'Password must be at least 6 characters.',
      );
    }

    // =======================================================
    // CALL EDGE FUNCTION
    // =======================================================

    let response:
      | CreateStaffResponse
      | null = null;

    try {
      const result =
        await this.supabase.client.functions.invoke(
          'create-staff',
          {
            body: {
              name,
              email,
              password,
              role: payload.role,
              status: payload.status,
            },
          },
        );

      // Supabase Functions can return
      // both data and error.

      if (result.error) {
        console.error(
          'Create staff function error:',
          result.error,
        );

        throw result.error;
      }

      response =
        result.data as CreateStaffResponse;
    } catch (error: any) {
      console.error(
        'Create staff request failed:',
        error,
      );

      // =====================================================
      // FRIENDLY ERROR MESSAGES
      // =====================================================

      const message =
        error?.message ||
        error?.context?.message ||
        '';

      if (
        message
          .toLowerCase()
          .includes('already exists')
      ) {
        throw new Error(
          'A user with this email already exists.',
        );
      }

      if (
        message
          .toLowerCase()
          .includes('email rate limit')
      ) {
        throw new Error(
          'Supabase email rate limit exceeded. Please wait a moment and try again.',
        );
      }

      if (
        message
          .toLowerCase()
          .includes('failed to send')
      ) {
        throw new Error(
          'Unable to connect to the create-staff function. Make sure the Edge Function is deployed.',
        );
      }

      throw error;
    }

    // =======================================================
    // CHECK FUNCTION RESPONSE
    // =======================================================

    if (!response) {
      throw new Error(
        'No response received from create-staff function.',
      );
    }

    if (!response.success) {
      throw new Error(
        response.error ||
          'Unable to create staff account.',
      );
    }

    if (!response.user) {
      throw new Error(
        'Staff account was created but no user profile was returned.',
      );
    }

    return response.user;
  }

  // =========================================================
  // UPDATE USER
  //
  // Password is NOT changed here.
  // =========================================================

  async updateUser(
    id: string,
    payload: UpdateUserPayload,
  ): Promise<User> {
    const name =
      payload.name.trim();

    const email =
      payload.email
        .trim()
        .toLowerCase();

    // =======================================================
    // VALIDATION
    // =======================================================

    if (!name) {
      throw new Error(
        'Name is required.',
      );
    }

    if (!email) {
      throw new Error(
        'Email is required.',
      );
    }

    // =======================================================
    // UPDATE PUBLIC.USERS
    // =======================================================

    const { data, error } =
      await this.supabase.client
        .from('users')
        .update({
          name,
          email,
          role: payload.role,
          status: payload.status,
        })
        .eq('id', id)
        .select(
          'id, name, email, role, status, created_at',
        )
        .single();

    if (error) {
      console.error(
        'Update user error:',
        error,
      );

      throw error;
    }

    return data as User;
  }

  // =========================================================
  // UPDATE STATUS
  // =========================================================

  async updateStatus(
    id: string,
    status: UserStatus,
  ): Promise<User> {
    const { data, error } =
      await this.supabase.client
        .from('users')
        .update({
          status,
        })
        .eq('id', id)
        .select(
          'id, name, email, role, status, created_at',
        )
        .single();

    if (error) {
      console.error(
        'Update user status error:',
        error,
      );

      throw error;
    }

    return data as User;
  }

  // =========================================================
  // DELETE USER PROFILE
  //
  // IMPORTANT:
  //
  // This only deletes public.users.
  //
  // It does NOT delete the Supabase Auth account.
  //
  // If you want complete deletion:
  //
  // Auth user
  // +
  // public.users
  //
  // create a delete-staff Edge Function.
  // =========================================================

  async deleteUser(
    id: string,
  ): Promise<void> {
    const { error } =
      await this.supabase.client
        .from('users')
        .delete()
        .eq('id', id);

    if (error) {
      console.error(
        'Delete user error:',
        error,
      );

      throw error;
    }
  }
}

