// src/app/dashboard/admin-dashboard/admin-dashboard.component.ts
import { Component, OnInit, HostListener, ChangeDetectorRef, AfterViewInit } from '@angular/core';
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
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  data: AdminDashboard | null = null;
  loading = true;
  error = '';
  Math = Math;
  metricsAnimated = false;

  isSidebarCollapsed = false;
  isMobile = false;
  userRole = 'ADMIN';
  user: any = {};
  currentSeason = 'Printemps 2025';

  constructor(
    private dashboardService: DashboardService, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUser();
    this.checkMobile();
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.metricsAnimated = true;
      this.cdr.detectChanges();
    }, 100);
  }

  loadDashboardData(): void {
    this.loading = true;
    this.dashboardService.getAdminDashboard().subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Dashboard error:', err);
        this.error = 'Erreur de chargement du tableau de bord';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get nonRecolteCircumference(): string {
    if (!this.data || this.data.totalVergers === 0) return '0 301';
    const percent = this.percent(this.data.vergersNonRecolte, this.data.totalVergers);
    const circumference = 2 * Math.PI * 48;
    return `${(percent / 100) * circumference} ${circumference}`;
  }

  get enCoursCircumference(): string {
    if (!this.data || this.data.totalVergers === 0) return '0 301';
    const percent = this.percent(this.data.vergersEnCours, this.data.totalVergers);
    const circumference = 2 * Math.PI * 48;
    return `${(percent / 100) * circumference} ${circumference}`;
  }

  get recolteCircumference(): string {
    if (!this.data || this.data.totalVergers === 0) return '0 301';
    const percent = this.percent(this.data.vergersRecolte, this.data.totalVergers);
    const circumference = 2 * Math.PI * 48;
    return `${(percent / 100) * circumference} ${circumference}`;
  }

  get nonRecolteOffset(): string {
    if (!this.data || this.data.totalVergers === 0) return '0';
    const percent = this.percent(this.data.vergersNonRecolte, this.data.totalVergers);
    const circumference = 2 * Math.PI * 48;
    return `-${(percent / 100) * circumference}`;
  }

  get recolteOffset(): string {
    if (!this.data || this.data.totalVergers === 0) return '0';
    const nonRecoltePercent = this.percent(this.data.vergersNonRecolte, this.data.totalVergers);
    const enCoursPercent = this.percent(this.data.vergersEnCours, this.data.totalVergers);
    const circumference = 2 * Math.PI * 48;
    return `-${((nonRecoltePercent + enCoursPercent) / 100) * circumference}`;
  }

  loadUser(): void {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try { 
        this.user = JSON.parse(stored); 
        this.userRole = this.user.role?.toUpperCase() || 'ADMIN'; 
      } catch (_) { 
        this.userRole = 'ADMIN'; 
      }
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

  navigate(path: string): void { 
    this.router.navigate([path]); 
  }

  percent(part: number, total: number): number {
    return total > 0 ? Math.round((part / total) * 100) : 0;
  }

  formatKg(kg: number): string {
    if (!kg) return '0 kg';
    return kg >= 1000 ? (kg / 1000).toFixed(1) + ' t' : kg.toFixed(0) + ' kg';
  }

  formatKgShort(kg: number): string {
    if (!kg) return '0 kg';
    return kg >= 1000 ? (kg / 1000).toFixed(1) + ' t' : kg.toFixed(0) + ' kg';
  }
}