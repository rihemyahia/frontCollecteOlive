import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { DashboardService, ResponsableDashboard } from '../../services/Dashboard';

@Component({
  selector: 'app-responsable-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SideBarResponsable],
  templateUrl: './responsable-dashboard.html',
  styleUrls: ['./responsable-dashboard.css']
})
export class ResponsableDashboardComponent implements OnInit {
  data: ResponsableDashboard | null = null;
  loading = true;
  error = '';

  isSidebarCollapsed = false;
  isMobile = false;
  userRole = 'RESPONSABLE';
  user: any = {};

  constructor(
    private dashboardService: DashboardService, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUser();
    this.checkMobile();
    this.dashboardService.getResponsableDashboard().subscribe({
      next: d => { 
        this.data = d; 
        this.loading = false; 
        this.cdr.detectChanges(); 
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
        this.userRole = this.user.role?.toUpperCase() || 'RESPONSABLE'; 
      } catch (_) {}
    }
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) this.isSidebarCollapsed = false;
    this.cdr.detectChanges();
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

  statutBadge(s: string): string {
    const m: any = { NON_RECOLTE: 'badge-blue', EN_COURS: 'badge-amber', RECOLTE: 'badge-green' };
    return m[s] || '';
  }

  statutLabel(s: string): string {
    const m: any = { NON_RECOLTE: 'Non récolté', EN_COURS: 'En cours', RECOLTE: 'Récolté' };
    return m[s] || s;
  }

  maturiteColor(p: number): string {
    if (p < 30) return '#b5892a';
    if (p < 70) return '#d97706';
    return '#2d6a4f';
  }
}