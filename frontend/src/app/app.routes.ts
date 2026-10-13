import { Routes } from '@angular/router';
import { adminGuard } from './core/admin.guard';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then(
        (module) => module.LoginComponent,
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/pages/register/register.component').then(
        (module) => module.RegisterComponent,
      ),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard/dashboard.component').then(
        (module) => module.DashboardComponent,
      ),
  },
  {
    path: 'tickets',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tickets/pages/ticket-list/ticket-list.component').then(
        (module) => module.TicketListComponent,
      ),
  },
  {
    path: 'users',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/users/pages/user-list/user-list.component').then(
        (module) => module.UserListComponent,
      ),
  },
  { path: '**', redirectTo: 'dashboard' },
];
