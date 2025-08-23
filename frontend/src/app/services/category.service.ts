import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Category } from '../models/product.model';
import { ApiResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(private http: HttpClient) { }

  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(`${environment.apiUrl}/categories`);
  }

  getCategory(id: number): Observable<ApiResponse<Category>> {
    return this.http.get<ApiResponse<Category>>(`${environment.apiUrl}/categories/${id}`);
  }

  createCategory(category: { name: string; description?: string }): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(`${environment.apiUrl}/categories`, category);
  }

  updateCategory(id: number, category: { name: string; description?: string }): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(`${environment.apiUrl}/categories/${id}`, category);
  }

  deleteCategory(id: number): Observable<ApiResponse<Category>> {
    return this.http.delete<ApiResponse<Category>>(`${environment.apiUrl}/categories/${id}`);
  }
} 