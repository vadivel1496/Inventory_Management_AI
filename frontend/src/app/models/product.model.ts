export interface Category {
  id: number;
  name: string;
  description?: string;
  productCount?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  sku: string;
  category: Category;
  price: number;
  quantity: number;
  lowStockThreshold: number;
  supplierId: number;
  supplierName?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  sku: string;
  categoryId: number;
  price: number;
  quantity: number;
  lowStockThreshold: number;
  supplierId: number;
}

export interface UpdateProductRequest extends CreateProductRequest {}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export interface ProductListResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
} 