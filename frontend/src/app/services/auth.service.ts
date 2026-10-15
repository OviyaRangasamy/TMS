import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  catchError,
  concatWith,
  finalize,
  ignoreElements,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { environment } from '../environments/environment';
import { User, UserRole } from '../models/user.model';
import { normalizeRole } from '../models/role.utils';

interface ApiResponse<T> {
  data: T;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
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
  readonly currentUser$ = toObservable(this.currentUser);
  private currentUserRequest$: Observable<User | null> | null = null;
  private sessionVersion = 0;

  login(credentials: LoginInput): Observable<User> {
    return this.http
      .post<ApiResponse<User>>(`${this.authUrl}/login`, credentials)
      .pipe(
        tap(({ data }) => this.currentUser.set(this.normalizeApiUser(data))),
        switchMap(() => this.refreshCurrentUser(true)),
        map((user) => {
          if (!user) {
            throw new Error('Login succeeded but no authenticated user was returned');
          }
          return user;
        }),
      );
  }

  register(input: RegisterInput): Observable<User> {
    return this.http
      .post<ApiResponse<User>>(`${this.authUrl}/register`, input)
      .pipe(
        tap(({ data }) => this.currentUser.set(this.normalizeApiUser(data))),
        switchMap(() => this.refreshCurrentUser(true)),
        map((user) => {
          if (!user) {
            throw new Error('Registration succeeded but no authenticated user was returned');
          }
          return user;
        }),
      );
  }

  restoreSession(): Observable<User | null> {
    return this.refreshCurrentUser();
  }

  refreshCurrentUser(force = false): Observable<User | null> {
    if (!force && this.currentUserRequest$) {
      return this.currentUserRequest$;
    }

    const requestVersion = ++this.sessionVersion;
    let request$: Observable<User | null>;
    request$ = this.http
      .get<ApiResponse<User>>(`${this.authUrl}/me`)
      .pipe(
        map(({ data }) => this.normalizeApiUser(data)),
        tap((user) => {
          if (requestVersion === this.sessionVersion) {
            this.currentUser.set(user);
          }
        }),
        catchError((error: unknown) => {
          if (requestVersion === this.sessionVersion) {
            this.currentUser.set(null);
          }
          if (error instanceof HttpErrorResponse && error.status === 401) {
            return of(null);
          }
          return throwError(() => error);
        }),
        finalize(() => {
          if (this.currentUserRequest$ === request$) {
            this.currentUserRequest$ = null;
          }
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    this.currentUserRequest$ = request$;
    return request$;
  }

  private normalizeApiUser(apiUser: User): User {
    const normalizedRole = normalizeRole(apiUser.role);
    console.info('Authentication API role:', apiUser.role);
    console.info('Normalized authentication role:', normalizedRole);
    if (!normalizedRole) {
      throw new Error(`Authentication API returned an unsupported role: ${apiUser.role}`);
    }
    return { ...apiUser, role: normalizedRole };
  }

  logout(): Observable<void> {
    const logoutRequest = this.http
      .post<void>(`${this.authUrl}/logout`, {})
      .pipe(
        catchError((error: unknown) =>
          this.refreshCurrentUser(true).pipe(
            ignoreElements(),
            concatWith(throwError(() => error)),
          ),
        ),
      );

    return logoutRequest.pipe(
      switchMap(() => this.refreshCurrentUser(true).pipe(map(() => undefined))),
    );
  }
}
