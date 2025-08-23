import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { ApiResponse } from '../../models/user.model';

@Component({
  selector: 'app-product-view',
  templateUrl: './product-view.component.html',
  styleUrls: ['./product-view.component.scss']
})
export class ProductViewComponent implements OnInit {
  product: Product | null = null;
  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadProduct();
  }

  loadProduct(): void {
    this.loading = true;
    const productId = this.route.snapshot.paramMap.get('id');
    
    if (!productId) {
      this.error = 'Product ID not found';
      this.loading = false;
      return;
    }

    this.productService.getProduct(parseInt(productId)).subscribe({
      next: (response: ApiResponse<Product>) => {
        this.product = response.data;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load product';
        this.loading = false;
        console.error('Error loading product:', error);
      }
    });
  }

  editProduct(): void {
    if (this.product) {
      this.router.navigate(['/products/edit', this.product.id]);
    }
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }

  getStockClass(product: Product): string {
    if (product.quantity === 0) return 'out-of-stock';
    if (product.quantity <= (product.lowStockThreshold || 10)) return 'low-stock';
    return 'in-stock';
  }

  getStockStatusClass(product: Product): string {
    if (product.quantity === 0) return 'bg-danger';
    if (product.quantity <= (product.lowStockThreshold || 10)) return 'bg-warning';
    return 'bg-success';
  }

  getStockStatusIcon(product: Product): string {
    if (product.quantity === 0) return 'bi-exclamation-circle';
    if (product.quantity <= (product.lowStockThreshold || 10)) return 'bi-exclamation-triangle';
    return 'bi-check-circle';
  }

  getStockStatusText(product: Product): string {
    if (product.quantity === 0) return 'Out of Stock';
    if (product.quantity <= (product.lowStockThreshold || 10)) return 'Low Stock';
    return 'In Stock';
  }
} 