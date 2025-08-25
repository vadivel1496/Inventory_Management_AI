import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SupplierService } from '../../services/supplier.service';
import { Supplier } from '../../models/supplier.model';
import { ApiResponse } from '../../models/user.model';

@Component({
  selector: 'app-supplier-view',
  templateUrl: './supplier-view.component.html',
  styleUrls: ['./supplier-view.component.scss']
})
export class SupplierViewComponent implements OnInit {
  supplier: Supplier | null = null;
  loading = false;
  error = '';

  constructor(
    private supplierService: SupplierService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSupplier();
  }

  loadSupplier(): void {
    this.loading = true;
    const supplierId = this.route.snapshot.paramMap.get('id');
    
    if (!supplierId) {
      this.error = 'Supplier ID not provided';
      this.loading = false;
      return;
    }

    this.supplierService.getSupplier(parseInt(supplierId)).subscribe({
      next: (response: ApiResponse<Supplier>) => {
        this.supplier = response.data || null;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load supplier';
        this.loading = false;
        console.error('Error loading supplier:', error);
      }
    });
  }

  editSupplier(): void {
    if (this.supplier) {
      this.router.navigate(['/suppliers/edit', this.supplier.id]);
    }
  }

  goBack(): void {
    this.router.navigate(['/suppliers']);
  }

  // Status helper methods
  getStatusClass(supplier: Supplier): string {
    return supplier.status === 'active' ? 'status-active' : 'status-inactive';
  }

  getStatusIcon(supplier: Supplier): string {
    return supplier.status === 'active' ? 'bi-check-circle' : 'bi-x-circle';
  }

  getStatusText(supplier: Supplier): string {
    return supplier.status === 'active' ? 'Active' : 'Inactive';
  }
} 