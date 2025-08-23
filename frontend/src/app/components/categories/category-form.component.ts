import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/product.model';

@Component({
  selector: 'app-category-form',
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.scss']
})
export class CategoryFormComponent implements OnInit {
  categoryForm: FormGroup;
  loading = false;
  isEditMode = false;
  categoryId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.checkEditMode();
  }

  checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.categoryId = parseInt(id);
      this.loadCategory(this.categoryId);
    }
  }

  loadCategory(id: number): void {
    this.loading = true;
    this.categoryService.getCategory(id).subscribe({
      next: (response) => {
        if (response.success) {
          const category = response.data;
          this.categoryForm.patchValue({
            name: category.name,
            description: category.description
          });
        }
      },
      error: (error) => {
        console.error('Error loading category:', error);
        this.snackBar.open('Failed to load category', 'Close', {
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
    if (this.categoryForm.valid) {
      this.loading = true;
      const formData = this.categoryForm.value;

      if (this.isEditMode && this.categoryId) {
        this.categoryService.updateCategory(this.categoryId, formData).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('Category updated successfully', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.router.navigate(['/categories']);
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
        this.categoryService.createCategory(formData).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('Category created successfully', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.router.navigate(['/categories']);
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
    this.router.navigate(['/categories']);
  }
} 