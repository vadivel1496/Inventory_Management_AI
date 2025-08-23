import { Component, OnInit, ViewChild } from '@angular/core';
import { Chart, ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { AnalyticsService } from '../../services/analytics.service';
import { DashboardAnalytics } from '../../models/analytics.model';

@Component({
  selector: 'app-analytics-dashboard',
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.scss']
})
export class AnalyticsDashboardComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  dashboardData: DashboardAnalytics | null = null;
  
  loading = false;
  error = false;

  // Chart configurations
  public categoryChartType: ChartType = 'doughnut';
  public categoryChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
      ]
    }]
  };

  public stockChartType: ChartType = 'bar';
  public stockChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Current Stock',
      data: [],
      backgroundColor: '#36A2EB',
      borderColor: '#36A2EB',
      borderWidth: 1
    }]
  };

  public movementChartType: ChartType = 'line';
  public movementChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      label: 'Stock In',
      data: [],
      borderColor: '#4BC0C0',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.4
    }, {
      label: 'Stock Out',
      data: [],
      borderColor: '#FF6384',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      tension: 0.4
    }]
  };

  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      }
    }
  };

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.loadAnalyticsData();
  }

  loadAnalyticsData(): void {
    this.loading = true;
    this.error = false;

    // Load dashboard analytics
    this.analyticsService.getDashboardAnalytics().subscribe({
      next: (response) => {
        if (response.success) {
          this.dashboardData = response.data;
          this.updateCategoryChart();
        }
      },
      error: (error) => {
        console.error('Error loading dashboard analytics:', error);
        this.error = true;
      }
    });

    // Note: Sales and inventory analytics would require additional backend endpoints
    // For now, we'll just load dashboard data
    this.loading = false;
  }

  updateCategoryChart(): void {
    if (this.dashboardData?.categoryDistribution) {
      this.categoryChartData.labels = this.dashboardData.categoryDistribution.map(cat => cat.category);
      this.categoryChartData.datasets[0].data = this.dashboardData.categoryDistribution.map(cat => cat.productCount);
    }
  }

  updateStockChart(): void {
    // Placeholder data for demonstration
    this.stockChartData.labels = ['Product 1', 'Product 2', 'Product 3', 'Product 4', 'Product 5'];
    this.stockChartData.datasets[0].data = [100, 85, 72, 65, 58];
  }

  updateMovementChart(): void {
    // Placeholder data for demonstration
    this.movementChartData.labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    this.movementChartData.datasets[0].data = [65, 59, 80, 81, 56, 55];
    this.movementChartData.datasets[1].data = [28, 48, 40, 19, 86, 27];
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

  formatPercentage(value: number, total: number): string {
    return ((value / total) * 100).toFixed(1) + '%';
  }

  refreshData(): void {
    this.loadAnalyticsData();
  }
} 