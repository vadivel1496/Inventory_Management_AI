import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SupplierService } from '../../services/supplier.service';
import { Supplier, SupplierListResponse } from '../../models/supplier.model';
import { ApiResponse } from '../../models/user.model';
import { SupplierDetailDialog } from './supplier-detail-dialog.component';

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
  selectedCountry = '';
  sortBy = 'name';

  // Pagination properties
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  constructor(
    private supplierService: SupplierService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.loading = true;
    this.supplierService.getSuppliers().subscribe({
      next: (response: SupplierListResponse) => {
        if (response.success && response.data) {
          this.suppliers = response.data;
          this.calculateTotalPages();
        } else {
          this.suppliers = [];
          this.calculateTotalPages();
        }
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
      filtered = filtered.filter(supplier => 
        this.getStatusText(supplier).toLowerCase() === this.selectedStatus.toLowerCase()
      );
    }

    if (this.selectedCountry) {
      filtered = filtered.filter(supplier => supplier.address && supplier.address.includes(this.selectedCountry));
    }

    // Sort suppliers
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'createdAt':
          return new Date(b.createdAt || new Date()).getTime() - new Date(a.createdAt || new Date()).getTime();
        case 'productCount':
          return 0; // No product count available
        default:
          return 0;
      }
    });

    return filtered;
  }

  get paginatedSuppliers(): Supplier[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredSuppliers.slice(startIndex, endIndex);
  }

  get uniqueCountries(): string[] {
    const addresses = this.suppliers
      .map(supplier => supplier.address)
      .filter(address => address && address.trim() !== '')
      .filter((address, index, arr) => arr.indexOf(address) === index);
    return addresses.sort();
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.filteredSuppliers.length / this.pageSize);
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1;
    }
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.calculateTotalPages();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedCountry = '';
    this.sortBy = 'name';
    this.currentPage = 1;
    this.calculateTotalPages();
  }

  editSupplier(supplier: Supplier): void {
    this.router.navigate(['/suppliers/edit', supplier.id]);
  }

  viewSupplier(supplier: Supplier): void {
    const dialogRef = this.dialog.open(SupplierDetailDialog, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '95vh',
      data: supplier,
      panelClass: 'supplier-detail-dialog',
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
      disableClose: true,
      autoFocus: true,
      restoreFocus: true,
      closeOnNavigation: true
    });

    // Block body scrolling when dialog opens
    dialogRef.afterOpened().subscribe(() => {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    });

    dialogRef.afterClosed().subscribe(result => {
      // Restore body scrolling when dialog closes
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    });
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

  // Pagination methods
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
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