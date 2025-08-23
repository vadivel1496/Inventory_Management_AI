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
  selectedMovementType = '';
  startDate = '';
  endDate = '';

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
          this.totalPages = response.data.pagination?.pages || 1;
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

    return filtered;
  }

  applyFilters(): void {
    this.currentPage = 1;
    // Filters are applied automatically through the getter
  }

  clearFilters(): void {
    this.selectedMovementType = '';
    this.startDate = '';
    this.endDate = '';
    this.currentPage = 1;
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
      position: { top: '50px' },
      hasBackdrop: true,
      backdropClass: 'dialog-backdrop',
      data: movement
    });

    // Ensure proper positioning after dialog opens
    dialogRef.afterOpened().subscribe(() => {
      const dialogElement = document.querySelector('.stock-movement-dialog');
      if (dialogElement) {
        (dialogElement as HTMLElement).style.position = 'fixed';
        (dialogElement as HTMLElement).style.top = '50%';
        (dialogElement as HTMLElement).style.left = '50%';
        (dialogElement as HTMLElement).style.transform = 'translate(-50%, -50%)';
        (dialogElement as HTMLElement).style.zIndex = '1001';
      }
    });
  }

  editMovement(movement: StockMovement): void {
    this.router.navigate(['/stock/edit', movement.id]);
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

  getMovementTypeClass(type: string): string {
    return type === 'in' ? 'bg-success' : 'bg-danger';
  }

  getMovementTypeText(type: string): string {
    return type === 'in' ? 'Stock In' : 'Stock Out';
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