import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Register a new user
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/signup`, userData);
  }
 // Login an existing user
 login(credentials: { email: string; password: string }): Observable<any> {
  return this.http.post(`${this.apiUrl}/auth/login`, credentials).pipe(
    tap((response: any) => {
      // Assuming the response contains the user ID, access token, and refresh token
      localStorage.setItem('userId', response.userId);
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
    })
  );
}

  // Refresh access token
  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post(`${this.apiUrl}/auth/refresh-token`, { token: refreshToken });
  }

  // Logout user
  logout(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post(`${this.apiUrl}/auth/logout`, { token: refreshToken });
  }

  // Get access token from local storage
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  // Set access token in local storage
  setAccessToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  // Set refresh token in local storage
  setRefreshToken(token: string): void {
    localStorage.setItem('refreshToken', token);
  }

  // Clear tokens from local storage
  clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
  // Get user ID from local storage
  getUserId(): string | null {
    return localStorage.getItem('userId');
  }
  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
  
    return this.http.post(`${this.apiUrl}/auth/upload-file`, formData);
  }
}