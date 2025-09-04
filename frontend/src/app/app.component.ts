import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Inventory AI';
  currentUser: any = null;
  sidebarOpened = true; // Sidebar is always open since toggle button is removed

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToProfile(): void {
    // TODO: Implement profile page navigation
    console.log('Navigate to profile page');
  }

  goToSettings(): void {
    // TODO: Implement settings page navigation
    console.log('Navigate to settings page');
  }
} 