import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Supplier } from '../../models/supplier.model';

@Component({
  selector: 'app-supplier-detail-dialog',
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 class="dialog-title">
          <i class="bi bi-building me-2"></i>Supplier Details
        </h2>
        <button type="button" class="dialog-close-btn" (click)="close()" aria-label="Close">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      
      <div class="dialog-content">
        <div class="row g-1">
          <div class="col-12">
            <div class="detail-item">
              <span class="detail-label">Company Name:</span>
              <span class="detail-value">{{ data.name }}</span>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="detail-item">
              <span class="detail-label">Email:</span>
              <span class="detail-value">{{ data.email }}</span>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="detail-item">
              <span class="detail-label">Phone:</span>
              <span class="detail-value">{{ data.phone }}</span>
            </div>
          </div>
          
          <div class="col-12">
            <div class="detail-item">
              <span class="detail-label">Contact Person:</span>
              <span class="detail-value">{{ data.contactPerson }}</span>
            </div>
          </div>
          
          <div class="col-12">
            <div class="detail-item">
              <span class="detail-label">Address:</span>
              <span class="detail-value">{{ data.address }}</span>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="detail-item">
              <span class="detail-label">Status:</span>
              <span class="badge" [ngClass]="getStatusClass(data.status)">
                <i class="bi" [ngClass]="getStatusIcon(data.status)"></i>
                {{ getStatusText(data.status) }}
              </span>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="detail-item">
              <span class="detail-label">Created:</span>
              <span class="detail-value">{{ formatDate(data.createdAt) }}</span>
            </div>
          </div>
          
          <div class="col-12" *ngIf="data.updatedAt && data.updatedAt !== data.createdAt">
            <div class="detail-item">
              <span class="detail-label">Last Updated:</span>
              <span class="detail-value">{{ formatDate(data.updatedAt) }}</span>
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
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: .7rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: none;
    }
    
    .dialog-title {
      color: white;
      font-weight: 700;
      font-size: 1.1rem;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .dialog-title i {
      font-size: 1.2rem;
      opacity: 0.9;
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
      padding: 1rem;
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
      border: 1px solid #e9ecef;
    }
    
    .detail-label {
      color: #6c757d;
      font-weight: 600;
      font-size: 0.75rem;
      min-width: 100px;
    }
    
    .detail-value {
      font-weight: 600;
      color: #212529;
      font-size: 0.75rem;
      text-align: left;
      flex: 1;
    }
    
    .badge {
      padding: 0.5rem 1rem;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      border-radius: 20px;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 0.25rem;
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
      padding: 0.75rem 1rem;
      background: #f8f9fa;
      border-top: 1px solid #dee2e6;
      display: flex;
      justify-content: flex-end;
    }
    
    .btn {
      padding: 0.5rem 0.5rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.7rem;
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
export class SupplierDetailDialog {
  constructor(
    public dialogRef: MatDialogRef<SupplierDetailDialog>,
    @Inject(MAT_DIALOG_DATA) public data: Supplier
  ) {}

  getStatusText(status: string): string {
    return status === 'active' ? 'Active' : 'Inactive';
  }

  getStatusClass(status: string): string {
    return status === 'active' ? 'badge-success' : 'badge-danger';
  }

  getStatusIcon(status: string): string {
    return status === 'active' ? 'bi-check-circle' : 'bi-x-circle';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }

  close(): void {
    this.dialogRef.close();
  }
}