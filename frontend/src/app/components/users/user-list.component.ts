import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { ApiResponse } from '../../models/user.model';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  loading = false;
  error = '';

  // Filter properties
  searchTerm = '';
  selectedRole = '';
  selectedStatus = '';

  // Pagination properties
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.authService.getUsers().subscribe({
      next: (response: ApiResponse<User[]>) => {
        this.users = response.data || [];
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load users';
        this.loading = false;
        console.error('Error loading users:', error);
      }
    });
  }

  get filteredUsers(): User[] {
    let filtered = this.users;

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(search) || 
        user.email.toLowerCase().includes(search)
      );
    }

    if (this.selectedRole) {
      filtered = filtered.filter(user => user.role === this.selectedRole);
    }

    if (this.selectedStatus) {
      filtered = filtered.filter(user => user.status === this.selectedStatus);
    }

    return filtered;
  }

  applyFilters(): void {
    this.currentPage = 1;
    // Filters are applied automatically through the getter
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedRole = '';
    this.selectedStatus = '';
    this.currentPage = 1;
  }

  editUser(user: User): void {
    this.router.navigate(['/users/edit', user.id]);
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      this.authService.deleteUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          alert('Failed to delete user');
        }
      });
    }
  }

  resetPassword(user: User): void {
    if (confirm(`Are you sure you want to reset the password for ${user.name}?`)) {
      // Implementation for password reset
      console.log('Resetting password for user:', user.id);
      alert('Password reset functionality to be implemented');
    }
  }

  getRoleClass(role: string): string {
    switch (role) {
      case 'admin': return 'bg-danger';
      case 'manager': return 'bg-warning';
      case 'user': return 'bg-info';
      default: return 'bg-secondary';
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