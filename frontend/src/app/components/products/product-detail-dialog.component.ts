import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-detail-dialog',
  templateUrl: './product-detail-dialog.component.html',
  styleUrls: ['./product-detail-dialog.component.scss']
})
export class ProductDetailDialog {
  constructor(
    public dialogRef: MatDialogRef<ProductDetailDialog>,
    @Inject(MAT_DIALOG_DATA) public data: Product
  ) {}

  getStockStatusText(product: Product): string {
    if (product.quantity === 0) return 'Out of Stock';
    if (product.quantity <= (product.lowStockThreshold || 10)) return 'Low Stock';
    return 'In Stock';
  }

  getStockStatusClass(product: Product): string {
    if (product.quantity === 0) return 'badge-danger';
    if (product.quantity <= (product.lowStockThreshold || 10)) return 'badge-warning';
    return 'badge-success';
  }

  getActiveStatusText(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }

  getActiveStatusClass(isActive: boolean): string {
    return isActive ? 'badge-success' : 'badge-danger';
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  formatPrice(price: number): string {
    return price.toFixed(2);
  }

  close(): void {
    this.dialogRef.close();
  }
}