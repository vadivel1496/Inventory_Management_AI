import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupplierService } from '../../services/supplier.service';
import { Supplier } from '../../models/supplier.model';
import { ApiResponse } from '../../models/user.model';

@Component({
  selector: 'app-supplier-list',
  templateUrl: './supplier-list.component.html',
  styleUrls: ['./supplier-list.component.scss']
})
export class SupplierListComponent implements OnInit {
  suppliers: Supplier[] = [];
  loading = false;
  error = '';

  // Filter properties
  searchTerm = '';
  selectedStatus = '';

  // Pagination properties
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  constructor(
    private supplierService: SupplierService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.loading = true;
    this.supplierService.getSuppliers().subscribe({
      next: (response: ApiResponse<Supplier[]>) => {
        this.suppliers = response.data || [];
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load suppliers';
        this.loading = false;
        console.error('Error loading suppliers:', error);
      }
    });
  }

  get filteredSuppliers(): Supplier[] {
    let filtered = this.suppliers;

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(supplier => 
        supplier.name.toLowerCase().includes(search) || 
        supplier.email.toLowerCase().includes(search) ||
        (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(search))
      );
    }

    if (this.selectedStatus) {
      filtered = filtered.filter(supplier => supplier.status === this.selectedStatus);
    }

    return filtered;
  }

  applyFilters(): void {
    this.currentPage = 1;
    // Filters are applied automatically through the getter
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.currentPage = 1;
  }

  editSupplier(supplier: Supplier): void {
    this.router.navigate(['/suppliers/edit', supplier.id]);
  }

  deleteSupplier(supplier: Supplier): void {
    if (confirm(`Are you sure you want to delete ${supplier.name}?`)) {
      this.supplierService.deleteSupplier(supplier.id).subscribe({
        next: () => {
          this.loadSuppliers();
        },
        error: (error) => {
          console.error('Error deleting supplier:', error);
          alert('Failed to delete supplier');
        }
      });
    }
  }

  // Pagination methods
  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
} 