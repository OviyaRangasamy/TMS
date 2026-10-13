import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.restoreSession().pipe(
    map((user) => {
      if (user?.role === 'ADMIN') {
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
