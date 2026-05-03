// src/app/dashboard/responsable-dashboard/responsable-dashboard.ts
import { Component, OnInit, HostListener, ChangeDetectorRef, AfterViewInit } from '@angular/core';
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
export class ResponsableDashboardComponent implements OnInit, AfterViewInit {
  data: ResponsableDashboard | null = null;
  loading = true;
  error = '';
  Math = Math;
  metricsAnimated = false;

  isSidebarCollapsed = false;
  isMobile = false;
  userRole = 'RESPONSABLE';
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
    this.dashboardService.getResponsableDashboard().subscribe({
      next: (res) => {
        this.data = res;
        console.log('=== RESPONSABLE DASHBOARD DATA ===');
        console.log('Total Tournees:', this.data?.totalMesTournees);
        console.log('Planifiées:', this.data?.mesTourneesPlanifiees);
        console.log('En Cours:', this.data?.mesTourneesEnCours);
        console.log('Terminées:', this.data?.mesTourneesTerminees);
        console.log('Planifiées Percent:', this.getPlanifieesPercent() + '%');
        console.log('En Cours Percent:', this.getEnCoursPercent() + '%');
        console.log('Terminées Percent:', this.getTermineesPercent() + '%');
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

  // Helper methods for percentage calculations
  getPlanifieesPercent(): number {
    const total = this.data?.totalMesTournees || 0;
    const planifiees = this.data?.mesTourneesPlanifiees || 0;
    if (total === 0) return 0;
    return Math.min(100, Math.round((planifiees / total) * 100));
  }

  getEnCoursPercent(): number {
    const total = this.data?.totalMesTournees || 0;
    const enCours = this.data?.mesTourneesEnCours || 0;
    if (total === 0) return 0;
    return Math.min(100, Math.round((enCours / total) * 100));
  }

  getTermineesPercent(): number {
    const total = this.data?.totalMesTournees || 0;
    const terminees = this.data?.mesTourneesTerminees || 0;
    if (total === 0) return 0;
    console.log(`Terminees Percent calc: ${terminees} / ${total} = ${(terminees / total) * 100}%`);
    return Math.min(100, Math.round((terminees / total) * 100));
  }

  loadUser(): void {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try { 
        this.user = JSON.parse(stored); 
        this.userRole = this.user.role?.toUpperCase() || 'RESPONSABLE'; 
      } catch (_) { 
        this.userRole = 'RESPONSABLE'; 
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