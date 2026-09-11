
import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';

import { SupabaseService } from '../services/supabase.service';
import { UserService } from '../services/user.service';

export const roleGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const supabase = inject(SupabaseService);
  const userService = inject(UserService);
  const router = inject(Router);

  try {
    // =====================================================
    // CHECK SESSION
    // =====================================================

    const {
      data: { session },
    } = await supabase.client.auth.getSession();

    if (!session?.user) {
      return router.createUrlTree(['/login']);
    }

    // =====================================================
    // GET USER PROFILE
    // =====================================================

    const user = await userService.getUserById(session.user.id);

    if (!user) {
      await supabase.client.auth.signOut();

      localStorage.removeItem('currentUser');

      return router.createUrlTree(['/login']);
    }

    // =====================================================
    // CHECK STATUS
    // =====================================================

    if (user.status !== 'Active') {
      await supabase.client.auth.signOut();

      localStorage.removeItem('currentUser');

      return router.createUrlTree(['/login']);
    }

    // =====================================================
    // SAVE CURRENT USER
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
    // GET ALLOWED ROLES FROM ROUTE
    // =====================================================

    const allowedRoles = route.data['roles'] as string[] | undefined;

    // Walang restriction
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    // =====================================================
    // CHECK ROLE
    // =====================================================

    if (allowedRoles.includes(user.role)) {
      return true;
    }

    // =====================================================
    // WRONG ROLE
    // → SEND USER TO THEIR OWN AREA
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

        return router.createUrlTree(['/login']);
    }
  } catch (error) {
    console.error('Role guard error:', error);

    await supabase.client.auth.signOut();

    localStorage.removeItem('currentUser');

    return router.createUrlTree(['/login']);
  }
};

