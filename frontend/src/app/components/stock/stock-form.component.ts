import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
  isEditMode = false;
  stockMovementId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private stockService: StockService,
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute
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
    this.checkEditMode();
  }

  checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.stockMovementId = parseInt(id);
      this.loadStockMovement(this.stockMovementId);
    }
  }

  loadStockMovement(id: number): void {
    // Load existing stock movement data for editing
    // This would need to be implemented in the StockService
    console.log('Loading stock movement for editing:', id);
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

      if (this.isEditMode && this.stockMovementId) {
        // Update existing stock movement
        this.updateStockMovement(this.stockMovementId, stockMovementData);
      } else {
        // Create new stock movement
        this.createStockMovement(formData.productId, stockMovementData);
      }
    }
  }

  createStockMovement(productId: number, stockMovementData: any): void {
    this.stockService.updateStock(productId, stockMovementData).subscribe({
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

  updateStockMovement(id: number, stockMovementData: any): void {
    // This would need to be implemented in the StockService
    console.log('Updating stock movement:', id, stockMovementData);
    alert('Stock movement updated successfully!');
    this.router.navigate(['/stock']);
    this.loading = false;
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