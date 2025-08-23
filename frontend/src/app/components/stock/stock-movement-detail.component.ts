import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { StockMovement } from '../../models/stock.model';

@Component({
  selector: 'app-stock-movement-detail',
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 class="dialog-title">
          <i class="bi bi-box-arrow-in-down me-2"></i>Stock Movement Details
        </h2>
        <button type="button" class="dialog-close-btn" (click)="close()" aria-label="Close">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      
      <div class="dialog-content">
        <div class="row g-3">
          <div class="col-12">
            <div class="detail-item">
              <span class="detail-label">Product:</span>
              <span class="detail-value">{{ data.product.name }} ({{ data.product.sku }})</span>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="detail-item">
              <span class="detail-label">Movement Type:</span>
              <span class="badge" [ngClass]="getMovementTypeClass(data.type)">
                {{ getMovementTypeText(data.type) }}
              </span>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="detail-item">
              <span class="detail-label">Quantity:</span>
              <span class="detail-value" [ngClass]="getMovementTypeClass(data.type)">
                {{ data.type === 'in' ? '+' : '-' }}{{ data.quantity }}
              </span>
            </div>
          </div>
          
          <div class="col-12">
            <div class="detail-item">
              <span class="detail-label">Reason:</span>
              <span class="detail-value">{{ data.reason }}</span>
            </div>
          </div>
          
          <div class="col-12" *ngIf="data.reference">
            <div class="detail-item">
              <span class="detail-label">Reference:</span>
              <span class="detail-value">{{ data.reference }}</span>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="detail-item">
              <span class="detail-label">User:</span>
              <span class="detail-value">{{ data.user.name }}</span>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="detail-item">
              <span class="detail-label">Date:</span>
              <span class="detail-value">{{ formatDate(data.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="dialog-footer">
        <button type="button" class="btn btn-secondary" (click)="close()">
          <i class="bi bi-x-circle me-2"></i>Close
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 0;
      border-radius: 12px;
      overflow: hidden;
    }
    
    .dialog-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: none;
    }
    
    .dialog-title {
      color: white;
      font-weight: 600;
      font-size: 1.25rem;
      margin: 0;
    }
    
    .dialog-close-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
    }
    
    .dialog-close-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }
    
    .dialog-content {
      padding: 1.5rem;
      background: white;
    }
    
    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 0.5rem;
    }
    
    .detail-label {
      color: #6c757d;
      font-weight: 600;
      font-size: 0.875rem;
    }
    
    .detail-value {
      font-weight: 600;
      color: #212529;
    }
    
    .badge {
      padding: 0.5rem 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      border-radius: 20px;
    }
    
    .badge-success {
      background-color: #d1e7dd;
      color: #0f5132;
    }
    
    .badge-danger {
      background-color: #f8d7da;
      color: #721c24;
    }
    
    .dialog-footer {
      padding: 1rem 1.5rem;
      background: #f8f9fa;
      border-top: 1px solid #dee2e6;
      display: flex;
      justify-content: flex-end;
    }
    
    .btn {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: 500;
      transition: all 0.3s ease;
    }
    
    .btn-secondary {
      background-color: #6c757d;
      border-color: #6c757d;
      color: white;
    }
    
    .btn-secondary:hover {
      background-color: #5a6268;
      border-color: #545b62;
    }
  `]
})
export class StockMovementDetailDialog {
  constructor(
    public dialogRef: MatDialogRef<StockMovementDetailDialog>,
    @Inject(MAT_DIALOG_DATA) public data: StockMovement
  ) {}

  getMovementTypeText(type: string): string {
    return type === 'in' ? 'Stock In' : 'Stock Out';
  }

  getMovementTypeClass(type: string): string {
    return type === 'in' ? 'badge-success' : 'badge-danger';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }

  close(): void {
    this.dialogRef.close();
  }
} 