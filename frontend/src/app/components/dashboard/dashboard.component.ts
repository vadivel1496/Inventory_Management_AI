import { Component, OnInit } from '@angular/core';
import { AnalyticsService } from '../../services/analytics.service';
import { DashboardAnalytics } from '../../models/analytics.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  analytics: DashboardAnalytics | null = null;
  loading = true;
  error = false;

  // Real data from analytics service
  stats = {
    totalProducts: 0,
    totalCategories: 0,
    totalSuppliers: 0,
    totalUsers: 0
  };

  recentActivities: any[] = [];
  lowStockAlerts: any[] = [];
  recentMovements: any[] = [];

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = false;

    this.analyticsService.getDashboardAnalytics().subscribe({
      next: (response) => {
        if (response.success) {
          this.analytics = response.data;
          // Update stats from analytics data
          if (this.analytics) {
            this.stats = {
              totalProducts: this.analytics.totalProducts || 0,
              totalCategories: this.analytics.totalCategories || 0,
              totalSuppliers: this.analytics.totalSuppliers || 0,
              totalUsers: this.analytics.totalUsers || 0
            };

            // Populate recent movements with real data
            if (this.analytics.recentMovements) {
              this.recentMovements = this.analytics.recentMovements.map(movement => ({
                type: movement.type,
                quantity: movement.quantity,
                productName: movement.product?.name || 'Unknown Product',
                date: new Date(movement.createdAt),
                timestamp: new Date(movement.createdAt)
              }));
            }

            // Generate low stock alerts from products data
            if (this.analytics.lowStockItems && this.analytics.lowStockItems > 0) {
              this.lowStockAlerts = [{
                productId: 0,
                productName: 'Low Stock Items',
                currentStock: this.analytics.lowStockItems,
                threshold: 10
              }];
            }

            // Generate recent activities from movements
            if (this.recentMovements.length > 0) {
              this.recentActivities = this.recentMovements.slice(0, 3).map(movement => ({
                type: 'stock',
                title: `Stock ${movement.type === 'in' ? 'Added' : 'Removed'}`,
                description: `${movement.quantity} units of ${movement.productName}`,
                message: `Stock ${movement.type === 'in' ? 'added' : 'removed'}`,
                timestamp: movement.timestamp
              }));
            }
          }
        }
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.error = true;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'product': return 'bi-box';
      case 'stock': return 'bi-arrow-left-right';
      case 'supplier': return 'bi-truck';
      case 'user': return 'bi-person';
      default: return 'bi-info-circle';
    }
  }

  restockProduct(productId: number): void {
    // Implementation for restocking product
    console.log('Restocking product:', productId);
  }

  getStockStatusClass(quantity: number, threshold: number): string {
    if (quantity === 0) return 'out-of-stock';
    if (quantity <= threshold) return 'low-stock';
    return 'in-stock';
  }

  getStockStatusText(quantity: number, threshold: number): string {
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= threshold) return 'Low Stock';
    return 'In Stock';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
} 