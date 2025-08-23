import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { Product, Category } from '../../models/product.model';
import { ApiResponse } from '../../models/user.model';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  loading = false;
  error = '';

  // Filter properties
  searchTerm = '';
  selectedCategory = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  selectedStockStatus = '';

  // Pagination properties
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getProducts().subscribe({
      next: (response: ApiResponse<any>) => {
        if (response.data && response.data.products) {
          this.products = response.data.products;
          this.totalPages = response.data.pagination?.pages || 1;
        } else {
          this.products = response.data || [];
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load products';
        this.loading = false;
        console.error('Error loading products:', error);
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (response: ApiResponse<Category[]>) => {
        this.categories = response.data || [];
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  get filteredProducts(): Product[] {
    let filtered = this.products;

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(search) || 
        product.sku.toLowerCase().includes(search)
      );
    }

    if (this.selectedCategory) {
      filtered = filtered.filter(product => 
        product.category?.id === parseInt(this.selectedCategory)
      );
    }

    if (this.minPrice !== null) {
      filtered = filtered.filter(product => product.price >= this.minPrice!);
    }

    if (this.maxPrice !== null) {
      filtered = filtered.filter(product => product.price <= this.maxPrice!);
    }

    if (this.selectedStockStatus) {
      filtered = filtered.filter(product => {
        const status = this.getStockStatusText(product);
        return status.toLowerCase() === this.selectedStockStatus.toLowerCase();
      });
    }

    return filtered;
  }

  getStockStatusClass(product: Product): string {
    if (product.quantity === 0) return 'bg-danger';
    if (product.quantity <= (product.lowStockThreshold || 10)) return 'bg-warning';
    return 'bg-success';
  }

  getStockClass(product: Product): string {
    if (product.quantity === 0) return 'out-of-stock';
    if (product.quantity <= (product.lowStockThreshold || 10)) return 'low-stock';
    return 'in-stock';
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

  viewProduct(product: Product): void {
    this.router.navigate(['/products/view', product.id]);
  }

  applyFilters(): void {
    this.currentPage = 1;
    // Filters are applied automatically through the getter
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.selectedStockStatus = '';
    this.currentPage = 1;
  }

  editProduct(product: Product): void {
    this.router.navigate(['/products/edit', product.id]);
  }

  deleteProduct(product: Product): void {
    if (confirm(`Are you sure you want to delete ${product.name}?`)) {
      this.productService.deleteProduct(product.id).subscribe({
        next: () => {
          this.loadProducts();
        },
        error: (error) => {
          console.error('Error deleting product:', error);
          alert('Failed to delete product');
        }
      });
    }
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