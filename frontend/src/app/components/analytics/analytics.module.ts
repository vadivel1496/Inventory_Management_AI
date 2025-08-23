import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Chart.js Module
import { NgChartsModule } from 'ng2-charts';

// Components
import { AnalyticsDashboardComponent } from './analytics-dashboard.component';

const routes: Routes = [
  { path: '', component: AnalyticsDashboardComponent }
];

@NgModule({
  declarations: [
    AnalyticsDashboardComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    NgChartsModule,
    
    // Material Modules
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ]
})
export class AnalyticsModule { } 