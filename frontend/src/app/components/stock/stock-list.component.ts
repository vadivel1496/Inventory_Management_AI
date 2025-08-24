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
        if (response.data && response.data.movements) {
          this.movements = response.data.movements;
          this.calculateTotalPages();
        } else {
          this.movements = [];
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
      filtered = filtered.filter(movement => new Date(movement.date) >= start);
    }

    if (this.endDate) {
      const end = new Date(this.endDate);
      filtered = filtered.filter(movement => new Date(movement.date) <= end);
    }

    // Sort movements
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
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
    // Open the stock movement detail dialog with proper positioning
    const dialogRef = this.dialog.open(StockMovementDetailDialog, {
      width: '500px',
      maxWidth: '90vw',
      height: 'auto',
      maxHeight: '90vh',
      panelClass: 'stock-movement-dialog',
      disableClose: false,
      autoFocus: false,
      data: movement
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'refresh') {
        this.loadMovements();
      }
    });
  }

  deleteMovement(movement: StockMovement): void {
    if (confirm(`Are you sure you want to delete this stock movement?`)) {
      this.stockService.deleteStockMovement(movement.id).subscribe({
        next: () => {
          this.loadMovements();
        },
        error: (error) => {
          console.error('Error deleting stock movement:', error);
          alert('Failed to delete stock movement');
        }
      });
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