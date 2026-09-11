
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SupabaseService } from '../services/supabase.service';
import { UserService } from '../services/user.service';

export const loginGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const userService = inject(UserService);
  const router = inject(Router);

  try {
    // =====================================================
    // CHECK SUPABASE SESSION
    // =====================================================

    const {
      data: { session },
    } = await supabase.client.auth.getSession();

    // =====================================================
    // WALANG SESSION
    // → ALLOWED TO OPEN LOGIN
    // =====================================================

    if (!session?.user) {
      return true;
    }

    // =====================================================
    // MAY SESSION
    // → GET USER PROFILE
    // =====================================================

    const user = await userService.getUserById(session.user.id);

    // =====================================================
    // AUTH EXISTS BUT PROFILE DOES NOT EXIST
    // → SIGN OUT SO USER CAN LOGIN AGAIN
    // =====================================================

    if (!user) {
      await supabase.client.auth.signOut();

      localStorage.removeItem('currentUser');

      return true;
    }

    // =====================================================
    // ACCOUNT INACTIVE
    // =====================================================

    if (user.status !== 'Active') {
      await supabase.client.auth.signOut();

      localStorage.removeItem('currentUser');

      return true;
    }

    // =====================================================
    // UPDATE LOCAL USER DATA
    // =====================================================

    localStorage.setItem(
      'currentUser',
      JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      }),
    );

    // =====================================================
    // REDIRECT BASED ON ROLE
    // =====================================================

    switch (user.role) {
      case 'Owner':
      case 'Admin':
        return router.createUrlTree(['/admin']);

      case 'Cashier':
        return router.createUrlTree(['/cashier']);

      case 'Kitchen Staff':
        return router.createUrlTree(['/kitchen']);

      case 'User':
        return router.createUrlTree(['/']);

      default:
        await supabase.client.auth.signOut();

        localStorage.removeItem('currentUser');

        return true;
    }
  } catch (error) {
    console.error('Login guard error:', error);

    // Kapag may unexpected error,
    // hayaan pa rin mag-open ang login.
    return true;
  }
};

