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

    return filtered;
  }

  applyFilters(): void {
    this.currentPage = 1;
    // Filters are applied automatically through the getter
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.currentPage = 1;
  }

  editCategory(category: Category): void {
    this.router.navigate(['/categories/edit', category.id]);
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