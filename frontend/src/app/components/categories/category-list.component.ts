import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/product.model';
import { ApiResponse } from '../../models/user.model';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss']
})
export class CategoryListComponent implements OnInit {
  categories: Category[] = [];
  loading = false;
  error = '';

  // Filter properties
  searchTerm = '';
  selectedStatus = '';
  sortBy = 'name';

  // Pagination properties
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  constructor(
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.categoryService.getCategories().subscribe({
      next: (response: ApiResponse<Category[]>) => {
        this.categories = response.data || [];
        this.calculateTotalPages();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load categories';
        this.loading = false;
        console.error('Error loading categories:', error);
      }
    });
  }

  get filteredCategories(): Category[] {
    let filtered = this.categories;

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(category => 
        category.name.toLowerCase().includes(search) || 
        (category.description && category.description.toLowerCase().includes(search))
      );
    }

    if (this.selectedStatus) {
      filtered = filtered.filter(category => 
        this.getStatusText(category).toLowerCase() === this.selectedStatus.toLowerCase()
      );
    }

    // Sort categories
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'createdAt':
          return new Date(b.createdAt || new Date()).getTime() - new Date(a.createdAt || new Date()).getTime();
        case 'productCount':
          return (b.productCount || 0) - (a.productCount || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }

  get paginatedCategories(): Category[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredCategories.slice(startIndex, endIndex);
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.filteredCategories.length / this.pageSize);
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
    this.selectedStatus = '';
    this.sortBy = 'name';
    this.currentPage = 1;
    this.calculateTotalPages();
  }

  editCategory(category: Category): void {
    this.router.navigate(['/categories/edit', category.id]);
  }

  viewCategory(category: Category): void {
    this.router.navigate(['/categories/view', category.id]);
  }

  deleteCategory(category: Category): void {
    if (confirm(`Are you sure you want to delete ${category.name}?`)) {
      this.categoryService.deleteCategory(category.id).subscribe({
        next: () => {
          this.loadCategories();
        },
        error: (error) => {
          console.error('Error deleting category:', error);
          alert('Failed to delete category');
        }
      });
    }
  }

  // Status helper methods
  getStatusClass(category: Category): string {
    return category.isActive ? 'status-active' : 'status-inactive';
  }

  getStatusIcon(category: Category): string {
    return category.isActive ? 'bi-check-circle' : 'bi-x-circle';
  }

  getStatusText(category: Category): string {
    return category.isActive ? 'Active' : 'Inactive';
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