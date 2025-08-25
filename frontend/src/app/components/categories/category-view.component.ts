import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/product.model';
import { ApiResponse } from '../../models/user.model';

@Component({
  selector: 'app-category-view',
  templateUrl: './category-view.component.html',
  styleUrls: ['./category-view.component.scss']
})
export class CategoryViewComponent implements OnInit {
  category: Category | null = null;
  loading = false;
  error = '';

  constructor(
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategory();
  }

  loadCategory(): void {
    this.loading = true;
    const categoryId = this.route.snapshot.paramMap.get('id');
    
    if (!categoryId) {
      this.error = 'Category ID not provided';
      this.loading = false;
      return;
    }

    this.categoryService.getCategory(parseInt(categoryId)).subscribe({
      next: (response: ApiResponse<Category>) => {
        this.category = response.data || null;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load category';
        this.loading = false;
        console.error('Error loading category:', error);
      }
    });
  }

  editCategory(): void {
    if (this.category) {
      this.router.navigate(['/categories/edit', this.category.id]);
    }
  }

  goBack(): void {
    this.router.navigate(['/categories']);
  }

  // Status helper methods
  getStatusClass(category: Category): string {
    return category.status === 'active' ? 'status-active' : 'status-inactive';
  }

  getStatusIcon(category: Category): string {
    return category.status === 'active' ? 'bi-check-circle' : 'bi-x-circle';
  }

  getStatusText(category: Category): string {
    return category.status === 'active' ? 'Active' : 'Inactive';
  }
} 