import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  isEditMode = false;
  userId: number | null = null;
  loading = false;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['user', Validators.required],
      status: ['active', Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.userId = +params['id'];
        this.loadUser();
        // Remove password requirement for edit mode
        this.userForm.get('password')?.clearValidators();
        this.userForm.get('password')?.updateValueAndValidity();
      }
    });
  }

  loadUser(): void {
    if (!this.userId) return;
    
    this.loading = true;
    // For now, we'll get the user from the users list
    // In a real app, you might want a separate endpoint for getting a single user
    this.authService.getUsers().subscribe({
      next: (response) => {
        if (response.success) {
          const user = response.data.find(u => u.id === this.userId);
          if (user) {
            this.userForm.patchValue({
              name: user.name,
              email: user.email,
              role: user.role,
              status: user.status
            });
          }
        }
      },
      error: (error) => {
        console.error('Error loading user:', error);
        this.snackBar.open('Failed to load user', 'Close', {
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
    if (this.userForm.valid) {
      this.submitting = true;
      const formData = this.userForm.value;

      if (this.isEditMode && this.userId) {
        // Update existing user
        const updateData: any = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: formData.status
        };
        
        if (formData.password) {
          updateData.password = formData.password;
        }

        this.authService.updateUser(this.userId, updateData).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('User updated successfully', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.router.navigate(['/users']);
            }
          },
          error: (error) => {
            this.handleError(error);
          },
          complete: () => {
            this.submitting = false;
          }
        });
      } else {
        // Create new user
        this.authService.createUser(formData).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('User created successfully', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.router.navigate(['/users']);
            }
          },
          error: (error) => {
            this.handleError(error);
          },
          complete: () => {
            this.submitting = false;
          }
        });
      }
    }
  }

  handleError(error: any): void {
    this.submitting = false;
    const message = error.error?.error?.message || 'An error occurred. Please try again.';
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  cancel(): void {
    this.router.navigate(['/users']);
  }

  getRoleBadgeClass(role: string): string {
    return role === 'admin' ? 'role-admin' : 'role-user';
  }

  getStatusBadgeClass(status: string): string {
    return status === 'active' ? 'status-active' : 'status-inactive';
  }
} 