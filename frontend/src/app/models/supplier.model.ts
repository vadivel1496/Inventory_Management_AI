export interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface SupplierListResponse {
  success: boolean;
  data: Supplier[];
  message: string;
  timestamp: string;
}

export interface SupplierResponse {
  success: boolean;
  data: Supplier;
  message: string;
  timestamp: string;
}

export interface CreateSupplierRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
}

export interface UpdateSupplierRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  status?: 'active' | 'inactive';
} 