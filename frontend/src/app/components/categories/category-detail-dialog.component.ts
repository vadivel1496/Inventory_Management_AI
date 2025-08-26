import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Category } from '../../models/product.model';

@Component({
  selector: 'app-category-detail-dialog',
  templateUrl: './category-detail-dialog.component.html',
  styleUrls: ['./category-detail-dialog.component.scss']
})
export class CategoryDetailDialog {
  constructor(
    public dialogRef: MatDialogRef<CategoryDetailDialog>,
    @Inject(MAT_DIALOG_DATA) public data: Category
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

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  close(): void {
    this.dialogRef.close();
  }
}