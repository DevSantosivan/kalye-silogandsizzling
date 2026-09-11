
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { SupabaseService } from '../../../core/services/supabase.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly supabase =
    inject(SupabaseService);

  private readonly userService =
    inject(UserService);

  private readonly router =
    inject(Router);

  // =========================================================
  // FORM
  // =========================================================

  email = '';

  password = '';

  rememberMe = false;

  showPassword = false;

  loading = false;

  errorMessage = '';

  // =========================================================
  // PASSWORD
  // =========================================================

  togglePassword(): void {
    this.showPassword =
      !this.showPassword;
  }

  // =========================================================
  // LOGIN
  // =========================================================

  async login(): Promise<void> {
    // Reset previous error
    this.errorMessage = '';

    const email =
      this.email
        .trim()
        .toLowerCase();

    const password =
      this.password;

    // =======================================================
    // VALIDATION
    // =======================================================

    if (!email || !password) {
      this.errorMessage =
        'Please enter your email and password.';

      return;
    }

    this.loading = true;

    try {
      // =====================================================
      // 1. AUTHENTICATION
      // =====================================================

      console.log(
        'LOGIN: Attempting Supabase Auth login...',
      );

      const {
        data: authData,
        error: authError,
      } =
        await this.supabase.client.auth
          .signInWithPassword({
            email,
            password,
          });

      // =====================================================
      // AUTH ERROR
      // =====================================================

      if (authError) {
        console.error(
          'LOGIN: Supabase Auth error:',
          authError,
        );

        console.error(
          'LOGIN: Error message:',
          authError.message,
        );

        console.error(
          'LOGIN: Error status:',
          authError.status,
        );

        console.error(
          'LOGIN: Error code:',
          authError.code,
        );

        if (
          authError.message
            ?.toLowerCase()
            .includes(
              'invalid login credentials',
            )
        ) {
          throw new Error(
            'Invalid email or password.',
          );
        }

        throw new Error(
          authError.message ||
            'Unable to sign in.',
        );
      }

      // =====================================================
      // AUTH USER CHECK
      // =====================================================

      const authUser =
        authData.user;

      if (!authUser) {
        throw new Error(
          'User account was not found.',
        );
      }

      console.log(
        'LOGIN: Auth successful.',
      );

      console.log(
        'LOGIN: Auth user ID:',
        authUser.id,
      );

      console.log(
        'LOGIN: Auth email:',
        authUser.email,
      );

      // =====================================================
      // 2. GET PUBLIC.USERS PROFILE
      // =====================================================

      console.log(
        'LOGIN: Loading public.users profile...',
      );

      const user =
        await this.userService.getUserById(
          authUser.id,
        );

      // =====================================================
      // PROFILE NOT FOUND
      // =====================================================

      if (!user) {
        console.error(
          'LOGIN: public.users profile not found.',
        );

        await this.supabase.client.auth.signOut();

        this.errorMessage =
          'User profile was not found. Please contact the administrator.';

        return;
      }

      console.log(
        'LOGIN: public.users profile:',
        user,
      );

      // =====================================================
      // 3. CHECK STATUS
      // =====================================================

      if (user.status !== 'Active') {
        console.warn(
          'LOGIN: Account is inactive.',
        );

        await this.supabase.client.auth.signOut();

        this.errorMessage =
          'Your account is inactive. Please contact the administrator.';

        return;
      }

      // =====================================================
      // 4. SAVE CURRENT USER
      // =====================================================

      const currentUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      };

      localStorage.setItem(
        'currentUser',
        JSON.stringify(
          currentUser,
        ),
      );

      console.log(
        'LOGIN: Current user saved.',
        currentUser,
      );

      // =====================================================
      // 5. REDIRECT BY ROLE
      // =====================================================

      switch (user.role) {
        // ---------------------------------------------------
        // CASHIER
        // ---------------------------------------------------

        case 'Cashier':
          console.log(
            'LOGIN: Redirecting to cashier...',
          );

          await this.router.navigate([
            '/cashier',
          ]);

          return;

        // ---------------------------------------------------
        // KITCHEN STAFF
        // ---------------------------------------------------

        case 'Kitchen Staff':
          console.log(
            'LOGIN: Redirecting to kitchen...',
          );

          await this.router.navigate([
            '/kitchen',
          ]);

          return;

        // ---------------------------------------------------
        // NORMAL USER
        // ---------------------------------------------------

        case 'User':
          console.log(
            'LOGIN: Redirecting to home...',
          );

          await this.router.navigate([
            '/',
          ]);

          return;

        // ---------------------------------------------------
        // OWNER
        // ---------------------------------------------------

        case 'Owner':
          console.log(
            'LOGIN: Redirecting to admin...',
          );

          await this.router.navigate([
            '/admin',
          ]);

          return;

        // ---------------------------------------------------
        // ADMIN
        // ---------------------------------------------------

        case 'Admin':
          console.log(
            'LOGIN: Redirecting to admin...',
          );

          await this.router.navigate([
            '/admin',
          ]);

          return;

        // ---------------------------------------------------
        // INVALID ROLE
        // ---------------------------------------------------

        default:
          console.error(
            'LOGIN: Invalid role:',
            user.role,
          );

          await this.supabase.client.auth.signOut();

          localStorage.removeItem(
            'currentUser',
          );

          this.errorMessage =
            'This account does not have a valid role.';

          return;
      }
    } catch (error: any) {
      // =====================================================
      // ERROR
      // =====================================================

      console.error(
        '========== LOGIN FAILED ==========',
      );

      console.error(
        'Login error:',
        error,
      );

      console.error(
        'Message:',
        error?.message,
      );

      console.error(
        'Status:',
        error?.status,
      );

      console.error(
        'Code:',
        error?.code,
      );

      console.error(
        '==================================',
      );

      this.errorMessage =
        error?.message ||
        'Unable to sign in. Please check your credentials.';
    } finally {
      this.loading = false;
    }
  }
}

