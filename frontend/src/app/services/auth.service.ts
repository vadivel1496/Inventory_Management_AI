import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            this.currentUserSubject.next(response.data.user);
          }
        })
      );
  }

  register(userData: RegisterRequest): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${environment.apiUrl}/auth/register`, userData);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    // Return the stored user object instead of parsing the JWT token
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  updateUser(userId: number, userData: Partial<User>): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${environment.apiUrl}/auth/users/${userId}`, userData);
  }

  deleteUser(userId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${environment.apiUrl}/auth/users/${userId}`);
  }

  getAllUsers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${environment.apiUrl}/auth/users`);
  }

  getUsers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${environment.apiUrl}/auth/users`);
  }

  createUser(userData: { name: string; email: string; password: string; role?: string; status?: string }): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${environment.apiUrl}/auth/users`, userData);
  }

  toggleUserStatus(userId: number, status: 'active' | 'inactive'): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${environment.apiUrl}/auth/users/${userId}/status`, { status });
  }
} 