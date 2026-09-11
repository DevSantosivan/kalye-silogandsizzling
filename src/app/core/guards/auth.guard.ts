
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  try {
    // =====================================================
    // CHECK CURRENT SUPABASE SESSION
    // =====================================================

    const {
      data: { session },
    } = await supabase.client.auth.getSession();

    // =====================================================
    // WALANG LOGIN SESSION
    // =====================================================

    if (!session?.user) {
      localStorage.removeItem('currentUser');

      return router.createUrlTree(['/login']);
    }

    // =====================================================
    // MAY ACTIVE SESSION
    // =====================================================

    return true;
  } catch (error) {
    console.error('Auth guard error:', error);

    localStorage.removeItem('currentUser');

    return router.createUrlTree(['/login']);
  }
};

