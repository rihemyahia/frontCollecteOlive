import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { SideBarResponsable } from '../sidebar-responsable/sidebar-responsable';   // Adjust the path if necessary

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SideBarResponsable
  ],
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  user: any;

  // Sidebar properties
  isSidebarCollapsed = false;
  isMobile = false;
  userRole = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    const stored = localStorage.getItem('user');
    if (stored) {
      this.user = JSON.parse(stored);
    }

    this.checkMobile();
    this.loadUserRole();
  }

  // ==================== SIDEBAR METHODS ====================
  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.isSidebarCollapsed = false;
    }
  }

  loadUserRole(): void {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const userData = JSON.parse(stored);
        this.userRole = userData.role?.toUpperCase() || '';
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  // ==================== YOUR ORIGINAL METHODS ====================
  goToTravailleurs(): void {
    this.router.navigate(['/travailleurs']);
  }  goToVergers(): void {
    this.router.navigate(['/vergers']);
  }

  goToTournees(): void {
    this.router.navigate(['/tournees']);
  }

  goToAlertes(): void {
    this.router.navigate(['/alertes']);
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
