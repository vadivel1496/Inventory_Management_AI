import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  Supplier, 
  SupplierListResponse, 
  SupplierResponse, 
  CreateSupplierRequest, 
  UpdateSupplierRequest 
} from '../models/supplier.model';
import { ApiResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private apiUrl = `${environment.apiUrl}/suppliers`;

  constructor(private http: HttpClient) {}

  getSuppliers(): Observable<SupplierListResponse> {
    return this.http.get<SupplierListResponse>(this.apiUrl);
  }

  getSupplier(id: number): Observable<SupplierResponse> {
    return this.http.get<SupplierResponse>(`${this.apiUrl}/${id}`);
  }

  createSupplier(supplier: CreateSupplierRequest): Observable<SupplierResponse> {
    return this.http.post<SupplierResponse>(this.apiUrl, supplier);
  }

  updateSupplier(id: number, supplier: UpdateSupplierRequest): Observable<SupplierResponse> {
    return this.http.put<SupplierResponse>(`${this.apiUrl}/${id}`, supplier);
  }

  deleteSupplier(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  toggleSupplierStatus(id: number, status: 'active' | 'inactive'): Observable<SupplierResponse> {
    return this.http.patch<SupplierResponse>(`${this.apiUrl}/${id}/status`, { status });
  }
} 