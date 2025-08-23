import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SupplierService } from '../../services/supplier.service';
import { Supplier } from '../../models/supplier.model';

@Component({
  selector: 'app-supplier-form',
  templateUrl: './supplier-form.component.html',
  styleUrls: ['./supplier-form.component.scss']
})
export class SupplierFormComponent implements OnInit {
  supplierForm: FormGroup;
  isEditMode = false;
  supplierId: number | null = null;
  loading = false;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private supplierService: SupplierService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.supplierForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)]],
      address: ['', [Validators.required, Validators.minLength(10)]],
      contactPerson: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.supplierId = +params['id'];
        this.loadSupplier();
      }
    });
  }

  loadSupplier(): void {
    if (!this.supplierId) return;
    
    this.loading = true;
    this.supplierService.getSupplier(this.supplierId).subscribe({
      next: (response) => {
        if (response.success) {
          const supplier = response.data;
          this.supplierForm.patchValue({
            name: supplier.name,
            email: supplier.email,
            phone: supplier.phone,
            address: supplier.address,
            contactPerson: supplier.contactPerson
          });
        }
      },
      error: (error) => {
        console.error('Error loading supplier:', error);
        this.snackBar.open('Failed to load supplier details', 'Close', {
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
    if (this.supplierForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.submitting = true;
    const formData = this.supplierForm.value;

    if (this.isEditMode && this.supplierId) {
      this.supplierService.updateSupplier(this.supplierId, formData).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Supplier updated successfully', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.router.navigate(['/suppliers']);
          }
        },
        error: (error) => {
          console.error('Error updating supplier:', error);
          this.snackBar.open('Failed to update supplier', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        },
        complete: () => {
          this.submitting = false;
        }
      });
    } else {
      this.supplierService.createSupplier(formData).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Supplier created successfully', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.router.navigate(['/suppliers']);
          }
        },
        error: (error) => {
          console.error('Error creating supplier:', error);
          this.snackBar.open('Failed to create supplier', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        },
        complete: () => {
          this.submitting = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/suppliers']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.supplierForm.controls).forEach(key => {
      const control = this.supplierForm.get(key);
      control?.markAsTouched();
    });
  }
} 