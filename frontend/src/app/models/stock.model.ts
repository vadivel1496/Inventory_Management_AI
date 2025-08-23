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
  reference?: string;
  user: {
    id: number;
    name: string;
  };
  previousStock: number;
  newStock: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface CreateStockMovementRequest {
  quantity: number;
  type: 'in' | 'out';
  reason: string;
  reference?: string;
}

export interface StockMovementFilters {
  page?: number;
  limit?: number;
  productId?: number;
  type?: 'in' | 'out';
  startDate?: string;
  endDate?: string;
}

export interface StockMovementListResponse {
  movements: StockMovement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
} 