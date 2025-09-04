import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  StockMovement, 
  CreateStockMovementRequest, 
  StockMovementFilters, 
  StockMovementListResponse
} from '../models/stock.model';
import { ApiResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class StockService {

  constructor(private http: HttpClient) { }

  updateStock(productId: number, movement: CreateStockMovementRequest): Observable<ApiResponse<StockMovement>> {
    return this.http.post<ApiResponse<StockMovement>>(`${environment.apiUrl}/stock/products/${productId}`, movement);
  }

  getStockMovements(filters: StockMovementFilters = {}): Observable<ApiResponse<StockMovementListResponse>> {
    let params = new HttpParams();
    
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.productId) params = params.set('productId', filters.productId.toString());
    if (filters.type) params = params.set('type', filters.type);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);

    return this.http.get<ApiResponse<StockMovementListResponse>>(`${environment.apiUrl}/stock/movements`, { params });
  }

  getStockMovement(id: number): Observable<ApiResponse<StockMovement>> {
    return this.http.get<ApiResponse<StockMovement>>(`${environment.apiUrl}/stock/movements/${id}`);
  }

  getProductStockHistory(productId: number): Observable<ApiResponse<StockMovement[]>> {
    return this.http.get<ApiResponse<StockMovement[]>>(`${environment.apiUrl}/stock/products/${productId}/history`);
  }

  getStockHistory(productId: number, filters?: StockMovementFilters): Observable<ApiResponse<StockMovementListResponse>> {
    const params = new HttpParams()
      .set('productId', productId.toString())
      .set('page', filters?.page?.toString() || '1')
      .set('limit', filters?.limit?.toString() || '20');
    
    return this.http.get<ApiResponse<StockMovementListResponse>>(`${environment.apiUrl}/stock/products/${productId}/movements`, { params });
  }

  updateStockMovement(movementId: number, movement: CreateStockMovementRequest): Observable<ApiResponse<StockMovement>> {
    return this.http.put<ApiResponse<StockMovement>>(`${environment.apiUrl}/stock/movements/${movementId}`, movement);
  }

  deleteStockMovement(movementId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${environment.apiUrl}/stock/movements/${movementId}`);
  }
} 