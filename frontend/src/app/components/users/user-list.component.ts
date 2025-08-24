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
  sortBy = 'name';

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
        this.calculateTotalPages();
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

    // Sort users
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'email':
          return a.email.localeCompare(b.email);
        case 'role':
          return a.role.localeCompare(b.role);
        case 'createdAt':
          return new Date(b.createdAt || new Date()).getTime() - new Date(a.createdAt || new Date()).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }

  get paginatedUsers(): User[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredUsers.slice(startIndex, endIndex);
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1;
    }
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.calculateTotalPages();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedRole = '';
    this.selectedStatus = '';
    this.sortBy = 'name';
    this.currentPage = 1;
    this.calculateTotalPages();
  }

  editUser(user: User): void {
    this.router.navigate(['/users/edit', user.id]);
  }

  viewUser(user: User): void {
    this.router.navigate(['/users/view', user.id]);
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

  // Role helper methods
  getRoleClass(user: User): string {
    switch (user.role) {
      case 'admin':
        return 'role-admin';
      case 'user':
        return 'role-user';
      default:
        return 'role-user';
    }
  }

  getRoleIcon(user: User): string {
    switch (user.role) {
      case 'admin':
        return 'bi-shield-check';
      case 'user':
        return 'bi-person';
      default:
        return 'bi-person';
    }
  }

  getRoleText(user: User): string {
    switch (user.role) {
      case 'admin':
        return 'Admin';
      case 'user':
        return 'User';
      default:
        return 'User';
    }
  }

  // Status helper methods
  getStatusClass(user: User): string {
    return user.status === 'active' ? 'status-active' : 'status-inactive';
  }

  getStatusIcon(user: User): string {
    return user.status === 'active' ? 'bi-check-circle' : 'bi-x-circle';
  }

  getStatusText(user: User): string {
    return user.status === 'active' ? 'Active' : 'Inactive';
  }

  // Pagination methods
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
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