import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';

// Components
import { SupplierListComponent } from './supplier-list.component';
import { SupplierFormComponent } from './supplier-form.component';
import { SupplierViewComponent } from './supplier-view.component';
import { SupplierDetailDialog } from './supplier-detail-dialog.component';

const routes: Routes = [
  { path: '', component: SupplierListComponent },
  { path: 'new', component: SupplierFormComponent },
  { path: 'edit/:id', component: SupplierFormComponent },
  { path: 'view/:id', component: SupplierViewComponent }
];

@NgModule({
  declarations: [
    SupplierListComponent,
    SupplierFormComponent,
    SupplierViewComponent,
    SupplierDetailDialog
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    
    // Material Modules
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule
  ]
})
export class SuppliersModule { } 