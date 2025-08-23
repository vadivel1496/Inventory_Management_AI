import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

// Material Imports (only for dialog)
import { MatDialogModule } from '@angular/material/dialog';

// Components
import { StockListComponent } from './stock-list.component';
import { StockFormComponent } from './stock-form.component';
import { StockMovementDetailDialog } from './stock-movement-detail.component';

const routes: Routes = [
  { path: '', component: StockListComponent },
  { path: 'new', component: StockFormComponent }
];

@NgModule({
  declarations: [
    StockListComponent,
    StockFormComponent,
    StockMovementDetailDialog
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    
    // Only Material Dialog Module for the detail view
    MatDialogModule
  ]
})
export class StockModule { } 