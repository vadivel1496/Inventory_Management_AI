import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { StockService } from '../../services/stock.service';
import { StockMovement, StockMovementListResponse } from '../../models/stock.model';
import { ApiResponse } from '../../models/user.model';
import { StockMovementDetailDialog } from './stock-movement-detail.component';

@Component({
  selector: 'app-stock-list',
  templateUrl: './stock-list.component.html',
  styleUrls: ['./stock-list.component.scss']
})
export class StockListComponent implements OnInit {
  movements: StockMovement[] = [];
  loading = false;
  error = '';

  // Filter properties
  searchTerm = '';
  selectedMovementType = '';
  startDate = '';
  endDate = '';
  sortBy = 'date';

  // Pagination properties
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  constructor(
    private stockService: StockService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadMovements();
  }

  loadMovements(): void {
    this.loading = true;
    this.stockService.getStockMovements().subscribe({
      next: (response: ApiResponse<StockMovementListResponse>) => {
        if (response.success && response.data && response.data.movements) {
          this.movements = response.data.movements;
          this.calculateTotalPages();
        } else if (response.success && response.data) {
          // Handle case where data might be directly an array
          this.movements = Array.isArray(response.data) ? response.data : [];
          this.calculateTotalPages();
        } else {
          this.movements = [];
          this.calculateTotalPages();
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load stock movements';
        this.loading = false;
        console.error('Error loading stock movements:', error);
      }
    });
  }

  get filteredMovements(): StockMovement[] {
    let filtered = this.movements;

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(movement => 
        (movement.product?.name && movement.product.name.toLowerCase().includes(search)) ||
        (movement.reference && movement.reference.toLowerCase().includes(search)) ||
        (movement.user?.name && movement.user.name.toLowerCase().includes(search))
      );
    }

    if (this.selectedMovementType) {
      filtered = filtered.filter(movement => movement.type === this.selectedMovementType);
    }

    if (this.startDate) {
      const start = new Date(this.startDate);
      filtered = filtered.filter(movement => new Date(movement.createdAt) >= start);
    }

    if (this.endDate) {
      const end = new Date(this.endDate);
      filtered = filtered.filter(movement => new Date(movement.createdAt) <= end);
    }

    // Sort movements
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'product':
          return (a.product?.name || '').localeCompare(b.product?.name || '');
        case 'quantity':
          return b.quantity - a.quantity;
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    return filtered;
  }

  get paginatedMovements(): StockMovement[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredMovements.slice(startIndex, endIndex);
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.filteredMovements.length / this.pageSize);
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
    this.selectedMovementType = '';
    this.startDate = '';
    this.endDate = '';
    this.sortBy = 'date';
    this.currentPage = 1;
    this.calculateTotalPages();
  }

  editMovement(movement: StockMovement): void {
    this.router.navigate(['/stock/edit', movement.id]);
  }

  viewMovement(movement: StockMovement): void {
    const dialogRef = this.dialog.open(StockMovementDetailDialog, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '95vh',
      data: movement,
      panelClass: 'stock-movement-dialog',
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

  deleteMovement(movement: StockMovement): void {
    if (confirm('Are you sure you want to delete this stock movement?')) {
      // Implement delete logic here
      console.log('Deleting movement:', movement.id);
    }
  }

  // Movement helper methods
  getMovementIconClass(movement: StockMovement): string {
    switch (movement.type) {
      case 'in':
        return 'movement-in';
      case 'out':
        return 'movement-out';
      default:
        return 'movement-in';
    }
  }

  getMovementIcon(movement: StockMovement): string {
    switch (movement.type) {
      case 'in':
        return 'bi-arrow-down-circle';
      case 'out':
        return 'bi-arrow-up-circle';
      default:
        return 'bi-arrow-down-circle';
    }
  }

  getTypeClass(movement: StockMovement): string {
    switch (movement.type) {
      case 'in':
        return 'type-in';
      case 'out':
        return 'type-out';
      default:
        return 'type-in';
    }
  }

  getTypeIcon(movement: StockMovement): string {
    switch (movement.type) {
      case 'in':
        return 'bi-arrow-down-circle';
      case 'out':
        return 'bi-arrow-up-circle';
      default:
        return 'bi-arrow-down-circle';
    }
  }

  getTypeText(movement: StockMovement): string {
    switch (movement.type) {
      case 'in':
        return 'Stock In';
      case 'out':
        return 'Stock Out';
      default:
        return 'Stock In';
    }
  }

  getQuantityClass(movement: StockMovement): string {
    switch (movement.type) {
      case 'in':
        return 'quantity-in';
      case 'out':
        return 'quantity-out';
      default:
        return 'quantity-in';
    }
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