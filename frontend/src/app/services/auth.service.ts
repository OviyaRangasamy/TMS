import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import {
  catchError,
  finalize,
  map,
  Observable,
  of,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';
import { environment } from '../environments/environment';
import { User, UserRole } from '../models/user.model';

interface ApiResponse<T> {
  data: T;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authUrl = `${environment.apiBaseUrl}/auth`;

  readonly currentUser = signal<User | null>(null);
  private sessionRestore$: Observable<User | null> | null = null;

  login(credentials: LoginInput): Observable<User> {
    return this.http
      .post<ApiResponse<User>>(`${this.authUrl}/login`, credentials)
      .pipe(
        map(({ data }) => data),
        tap((user) => this.currentUser.set(user)),
      );
  }

  register(input: RegisterInput): Observable<User> {
    return this.http
      .post<ApiResponse<User>>(`${this.authUrl}/register`, input)
      .pipe(
        map(({ data }) => data),
        tap((user) => {
          if (!this.currentUser()) {
            this.currentUser.set(user);
          }
        }),
      );
  }

  restoreSession(): Observable<User | null> {
    const currentUser = this.currentUser();
    if (currentUser) {
      return of(currentUser);
    }

    if (this.sessionRestore$) {
      return this.sessionRestore$;
    }

    this.sessionRestore$ = this.http
      .get<ApiResponse<User>>(`${this.authUrl}/me`)
      .pipe(
        map(({ data }) => data),
        tap((user) => this.currentUser.set(user)),
        catchError((error: unknown) => {
          this.currentUser.set(null);
          if (
            typeof error !== 'object'
            || error === null
            || !('status' in error)
            || error.status !== 401
          ) {
            console.error('Failed to restore the authenticated session:', error);
          }
          return of(null);
        }),
        finalize(() => {
          this.sessionRestore$ = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.sessionRestore$;
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.authUrl}/logout`, {}).pipe(
      tap(() => this.currentUser.set(null)),
      catchError((error: unknown) => {
        this.currentUser.set(null);
        return throwError(() => error);
      }),
    );
  }
}
