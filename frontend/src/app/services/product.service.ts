import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  Product, 
  CreateProductRequest, 
  UpdateProductRequest, 
  ProductFilters, 
  ProductListResponse
} from '../models/product.model';
import { ApiResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(private http: HttpClient) { }

  getProducts(filters: ProductFilters = {}): Observable<ApiResponse<ProductListResponse>> {
    let params = new HttpParams();
    
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.category) params = params.set('category', filters.category.toString());
    if (filters.minPrice) params = params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params = params.set('maxPrice', filters.maxPrice.toString());
    if (filters.inStock !== undefined) params = params.set('inStock', filters.inStock.toString());

    return this.http.get<ApiResponse<ProductListResponse>>(`${environment.apiUrl}/products`, { params });
  }

  getProduct(id: number): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${environment.apiUrl}/products/${id}`);
  }

  createProduct(product: CreateProductRequest): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(`${environment.apiUrl}/products`, product);
  }

  updateProduct(id: number, product: UpdateProductRequest): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${environment.apiUrl}/products/${id}`, product);
  }

  deleteProduct(id: number): Observable<ApiResponse<Product>> {
    return this.http.delete<ApiResponse<Product>>(`${environment.apiUrl}/products/${id}`);
  }

  getLowStockProducts(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${environment.apiUrl}/products?inStock=true`);
  }

  getOutOfStockProducts(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${environment.apiUrl}/products?inStock=false`);
  }
} 