import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core'; // 1. Added ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { DashboardService, AdminDashboard } from '../../services/Dashboard';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SideBarResponsable],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit {
  data: AdminDashboard | null = null;
  loading = true;
  error = '';

  isSidebarCollapsed = false;
  isMobile = false;
  userRole = 'ADMIN';
  user: any = {};

  constructor(
    private dashboardService: DashboardService, 
    private router: Router,
    private cdr: ChangeDetectorRef // 2. Injected
  ) {}

  ngOnInit(): void {
    this.loadUser();
    this.checkMobile();
    this.dashboardService.getAdminDashboard().subscribe({
      next: d => { 
        this.data = d; 
        this.loading = false; 
        this.cdr.detectChanges(); // 3. Force update
      },
      error: e => { 
        this.error = 'Erreur de chargement'; 
        this.loading = false; 
        this.cdr.detectChanges(); 
      }
    });
  }

  loadUser(): void {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try { 
        this.user = JSON.parse(stored); 
        this.userRole = this.user.role?.toUpperCase() || 'ADMIN'; 
      } catch (_) {}
    }
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) this.isSidebarCollapsed = false;
    this.cdr.detectChanges(); // Keep UI in sync on resize
  }

  toggleSidebar(val?: boolean): void {
    this.isSidebarCollapsed = val !== undefined ? val : !this.isSidebarCollapsed;
    this.cdr.detectChanges();
  }

  navigate(path: string): void { this.router.navigate([path]); }

  percent(part: number, total: number): number {
    return total > 0 ? Math.round((part / total) * 100) : 0;
  }

  formatKg(kg: number): string {
    if (!kg) return '0 kg';
    return kg >= 1000 ? (kg / 1000).toFixed(1) + ' t' : kg.toFixed(0) + ' kg';
  }

  statutColor(s: string): string {
    const colors: any = { 'Terminée': '#2d6a4f', 'En cours': '#d97706', 'Planifiée': '#2563eb' };
    return colors[s] || '#6b7560';
  }
}