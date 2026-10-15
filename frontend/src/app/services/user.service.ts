import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { User, UserRole } from '../models/user.model';
import { normalizeRole } from '../models/role.utils';

interface ApiResponse<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly usersUrl = `${environment.apiBaseUrl}/users`;

  getAllUsers(): Observable<User[]> {
    return this.http
      .get<ApiResponse<User[]>>(this.usersUrl)
      .pipe(map(({ data }) => data.map((user) => this.normalizeUser(user))));
  }

  getUserById(userId: string): Observable<User> {
    return this.http
      .get<ApiResponse<User>>(
        `${this.usersUrl}/${encodeURIComponent(userId)}`,
      )
      .pipe(map(({ data }) => this.normalizeUser(data)));
  }

  updateRole(userId: string, role: UserRole): Observable<User> {
    return this.http
      .patch<ApiResponse<User>>(
        `${this.usersUrl}/${encodeURIComponent(userId)}/role`,
        { role },
      )
      .pipe(map(({ data }) => this.normalizeUser(data)));
  }

  private normalizeUser(user: User): User {
    const role = normalizeRole(user.role);
    if (!role) {
      throw new Error(`Users API returned an unsupported role: ${user.role}`);
    }
    return { ...user, role };
  }
}
