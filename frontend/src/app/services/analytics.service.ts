import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DashboardAnalytics } from '../models/analytics.model';
import { ApiResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor(private http: HttpClient) { }

  getDashboardAnalytics(): Observable<ApiResponse<DashboardAnalytics>> {
    return this.http.get<ApiResponse<DashboardAnalytics>>(`${environment.apiUrl}/analytics/dashboard`);
  }

  getCategoryDistribution(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/analytics/categories`);
  }

  getTopProducts(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/analytics/products/top`);
  }

  getMonthlyTrends(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/analytics/trends/monthly`);
  }

  getStockMovementsReport(startDate?: string, endDate?: string): Observable<ApiResponse<any[]>> {
    let url = `${environment.apiUrl}/analytics/movements`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return this.http.get<ApiResponse<any[]>>(url);
  }
} 