import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { normalizeRole } from '../models/role.utils';

export const adminGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.refreshCurrentUser().pipe(
    map((user) => {
      const role = normalizeRole(user?.role ?? null);
      console.info('Admin guard current user role:', role);
      if (role === 'ADMIN') {
        return true;
      }
      return user
        ? router.createUrlTree(['/dashboard'])
        : router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url },
          });
    }),
  );
};
