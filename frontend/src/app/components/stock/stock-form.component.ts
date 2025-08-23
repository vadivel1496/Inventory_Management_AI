import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { StockService } from '../../services/stock.service';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-stock-form',
  templateUrl: './stock-form.component.html',
  styleUrls: ['./stock-form.component.scss']
})
export class StockFormComponent implements OnInit {
  stockForm: FormGroup;
  products: Product[] = [];
  loading = false;
  productsLoading = false;

  constructor(
    private fb: FormBuilder,
    private stockService: StockService,
    private productService: ProductService,
    private router: Router
  ) {
    this.stockForm = this.fb.group({
      productId: ['', Validators.required],
      type: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      reason: ['', Validators.required],
      reference: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productsLoading = true;
    this.productService.getProducts().subscribe({
      next: (response) => {
        if (response.success) {
          this.products = response.data.products;
        }
      },
      error: (error) => {
        console.error('Error loading products:', error);
        alert('Failed to load products. Please try again.');
      },
      complete: () => {
        this.productsLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.stockForm.valid) {
      this.loading = true;
      const formData = this.stockForm.value;
      
      // Extract only the fields needed for stock movement validation
      const stockMovementData = {
        quantity: parseInt(formData.quantity),
        type: formData.type,
        reason: formData.reason,
        reference: formData.reference || ''
      };

      this.stockService.updateStock(formData.productId, stockMovementData).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Stock movement created successfully!');
            this.router.navigate(['/stock']);
          }
        },
        error: (error) => {
          this.handleError(error);
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }

  handleError(error: any): void {
    this.loading = false;
    const message = error.error?.error?.message || 'An error occurred. Please try again.';
    alert(message);
  }

  cancel(): void {
    this.router.navigate(['/stock']);
  }

  getMovementTypeText(type: string): string {
    return type === 'in' ? 'Stock In' : 'Stock Out';
  }

  getSelectedProduct(): Product | undefined {
    const productId = this.stockForm.get('productId')?.value;
    return this.products.find(p => p.id === productId);
  }
} 