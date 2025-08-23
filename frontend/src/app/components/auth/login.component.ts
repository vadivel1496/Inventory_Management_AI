import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  createAccountForm: FormGroup;
  loading = false;
  showPassword = false;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.createAccountForm = this.formBuilder.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      role: ['', [Validators.required]],
      phone: [''],
      department: ['']
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Check if user is already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword && confirmPassword.errors) {
      delete confirmPassword.errors['passwordMismatch'];
    }
    
    return null;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  clearError(): void {
    this.errorMessage = '';
  }

  // Method to test error message display (for development purposes)
  testError(): void {
    this.errorMessage = 'Invalid email or password';
  }

  forgotPassword(): void {
    // Show the forgot password modal
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
      const bootstrapModal = new (window as any).bootstrap.Modal(modal);
      bootstrapModal.show();
    }
  }

  createAccount(): void {
    // Show the create account modal
    const modal = document.getElementById('createAccountModal');
    if (modal) {
      const bootstrapModal = new (window as any).bootstrap.Modal(modal);
      bootstrapModal.show();
    }
  }

  sendResetEmail(): void {
    const email = (document.getElementById('resetEmail') as HTMLInputElement).value;
    
    if (!email || !this.isValidEmail(email)) {
      this.snackBar.open('Please enter a valid email address', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
      return;
    }

    // TODO: Implement actual password reset functionality
    console.log('Sending reset email to:', email);
    
    this.snackBar.open(`Password reset link sent to ${email}`, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });

    // Close the modal
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
      const bootstrapModal = (window as any).bootstrap.Modal.getInstance(modal);
      bootstrapModal.hide();
    }
  }

  submitCreateAccount(): void {
    if (this.createAccountForm.valid) {
      const userData = this.createAccountForm.value;
      
      // TODO: Implement actual user creation functionality
      console.log('Creating account for:', userData);
      
      this.snackBar.open('Account created successfully! Please check your email for verification.', 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });

      // Close the modal and reset form
      const modal = document.getElementById('createAccountModal');
      if (modal) {
        const bootstrapModal = (window as any).bootstrap.Modal.getInstance(modal);
        bootstrapModal.hide();
      }
      
      this.createAccountForm.reset();
    } else {
      this.snackBar.open('Please fill in all required fields correctly', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = ''; // Clear any previous errors
      
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Login successful!', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.router.navigate(['/dashboard']);
          }
        },
        error: (error) => {
          this.loading = false;
          console.log('Login error:', error); // Debug logging
          
          // Handle different error response structures
          if (error.error?.message) {
            this.errorMessage = error.error.message;
          } else if (error.error?.error?.message) {
            this.errorMessage = error.error.error.message;
          } else if (error.message) {
            this.errorMessage = error.message;
          } else if (error.status === 401) {
            this.errorMessage = 'Invalid email or password';
          } else if (error.status === 0) {
            this.errorMessage = 'Unable to connect to server. Please check your connection.';
          } else {
            this.errorMessage = 'An error occurred during login. Please try again.';
          }
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        const control = this.loginForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
    }
  }
} 