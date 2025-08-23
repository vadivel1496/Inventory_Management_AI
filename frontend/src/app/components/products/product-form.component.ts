import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { SupplierService } from '../../services/supplier.service';
import { Product, Category } from '../../models/product.model';
import { Supplier } from '../../models/supplier.model';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss']
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  categories: Category[] = [];
  suppliers: Supplier[] = [];
  loading = false;
  isEditMode = false;
  productId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private supplierService: SupplierService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      sku: ['', [Validators.required, Validators.minLength(3)]],
      categoryId: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      lowStockThreshold: [10, [Validators.required, Validators.min(0)]],
      supplierId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadSuppliers();
    this.checkEditMode();
  }

  checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.productId = parseInt(id);
      this.loadProduct(this.productId);
    }
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        if (response.success) {
          this.categories = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadSuppliers(): void {
    this.supplierService.getSuppliers().subscribe({
      next: (response) => {
        if (response.success) {
          this.suppliers = response.data.filter(s => s.status === 'active');
        }
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
      }
    });
  }

  loadProduct(id: number): void {
    this.loading = true;
    this.productService.getProduct(id).subscribe({
      next: (response) => {
        if (response.success) {
          const product = response.data;
          this.productForm.patchValue({
            name: product.name,
            description: product.description,
            sku: product.sku,
            categoryId: product.category.id,
            price: product.price,
            quantity: product.quantity,
            lowStockThreshold: product.lowStockThreshold,
            supplierId: product.supplierId
          });
        }
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.snackBar.open('Failed to load product', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      this.loading = true;
      const formData = this.productForm.value;

      if (this.isEditMode && this.productId) {
        this.productService.updateProduct(this.productId, formData).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('Product updated successfully', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.router.navigate(['/products']);
            }
          },
          error: (error) => {
            this.handleError(error);
          },
          complete: () => {
            this.loading = false;
          }
        });
      } else {
        this.productService.createProduct(formData).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('Product created successfully', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.router.navigate(['/products']);
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
  }

  handleError(error: any): void {
    this.loading = false;
    const message = error.error?.error?.message || 'An error occurred. Please try again.';
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  cancel(): void {
    this.router.navigate(['/products']);
  }
} 