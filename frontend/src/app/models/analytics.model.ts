export interface DashboardAnalytics {
  totalProducts: number;
  totalCategories: number;
  totalSuppliers: number;
  totalUsers: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  recentMovements: StockMovement[];
  categoryDistribution: CategoryDistribution[];
  topProducts: TopProduct[];
  monthlyTrends: MonthlyTrend[];
}

export interface CategoryDistribution {
  category: string;
  productCount: number;
  value: number;
}

export interface TopProduct {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  value: number;
}

export interface MonthlyTrend {
  month: string;
  inQuantity: number;
  outQuantity: number;
  netQuantity: number;
}

export interface StockMovement {
  id: number;
  product: {
    id: number;
    name: string;
    sku: string;
  };
  quantity: number;
  type: 'in' | 'out';
  reason: string;
  user: {
    id: number;
    name: string;
  };
  createdAt: string;
} 