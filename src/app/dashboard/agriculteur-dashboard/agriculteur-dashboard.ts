// src/app/dashboard/agriculteur-dashboard/agriculteur-dashboard.ts
import { Component, OnInit, HostListener, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { DashboardService, AgriculteurDashboard } from '../../services/Dashboard';

@Component({
  selector: 'app-agriculteur-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SideBarResponsable],
  templateUrl: './agriculteur-dashboard.html',
  styleUrls: ['./agriculteur-dashboard.css']
})
export class AgriculteurDashboardComponent implements OnInit, AfterViewInit {
  data: AgriculteurDashboard | null = null;
  loading = true;
  error = '';
  Math = Math;
  metricsAnimated = false;

  isSidebarCollapsed = false;
  isMobile = false;
  userRole = 'AGRICULTEUR';
  user: any = {};
  currentSeason = 'Printemps 2026';

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
    this.dashboardService.getAgriculteurDashboard().subscribe({
      next: (res) => {
        this.data = res;
        console.log('Agriculteur Dashboard data:', this.data);
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

  getTotalTournees(): number {
    if (!this.data) return 0;
    return (this.data.mesTourneesPlanifiees || 0) + 
           (this.data.mesTourneesEnCours || 0) + 
           (this.data.mesTourneesTerminees || 0);
  }

  getTotalVergers(): number {
    if (!this.data) return 0;
    return this.data.totalMesVergers || 0;
  }

  loadUser(): void {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try { 
        this.user = JSON.parse(stored); 
        this.userRole = this.user.role?.toUpperCase() || 'AGRICULTEUR'; 
      } catch (_) { 
        this.userRole = 'AGRICULTEUR'; 
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
    if (total === 0) return 0;
    if (part === undefined || part === null) return 0;
    const result = Math.round((part / total) * 100);
    return Math.min(100, Math.max(0, result));
  }

  formatKg(kg: number): string {
    if (!kg) return '0 kg';
    return kg >= 1000 ? (kg / 1000).toFixed(1) + ' t' : kg.toFixed(0) + ' kg';
  }

  statutBadge(statut: string): string {
    switch(statut) {
      case 'NON_RECOLTE': return 'badge-info';
      case 'EN_COURS': return 'badge-warning';
      case 'RECOLTE': return 'badge-success';
      default: return '';
    }
  }

  statutLabel(statut: string): string {
    switch(statut) {
      case 'NON_RECOLTE': return 'Non récolté';
      case 'EN_COURS': return 'En cours';
      case 'RECOLTE': return 'Récolté';
      default: return statut;
    }
  }

  maturiteColor(value: number): string {
    if (value < 40) return '#E8A838';
    if (value < 75) return '#A8B84B';
    return '#4A7A2A';
  }
}