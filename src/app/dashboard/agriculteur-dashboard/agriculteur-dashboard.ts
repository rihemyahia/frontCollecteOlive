import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
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
export class AgriculteurDashboardComponent implements OnInit {
  data: AgriculteurDashboard | null = null;
  loading = true;
  error = '';

  isSidebarCollapsed = false;
  isMobile = false;
  userRole = 'AGRICULTEUR';
  user: any = {};

  constructor(
    private dashboardService: DashboardService, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUser();
    this.checkMobile();
    this.dashboardService.getAgriculteurDashboard().subscribe({
      next: d => { 
        this.data = d; 
        this.loading = false; 
        this.cdr.detectChanges(); 
      },
      error: e => { 
        this.error = 'Erreur de chargement du tableau de bord'; 
        this.loading = false; 
        this.cdr.detectChanges();
      }
    });
  }

  // --- ADD THIS METHOD TO FIX THE TS2339 ERROR ---
  phaseIcon(phase: string): string {
    const icons: Record<string, string> = {
      'REPOS': '💤',
      'FLORAISON': '🌸',
      'FRUCTIFICATION': '🌳',
      'MATURATION': '🎨',
      'RECOLTE': '🧺',
      'TAILLE': '✂️'
    };
    return icons[phase?.toUpperCase()] || '🌱';
  }

  loadUser(): void {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try { 
        this.user = JSON.parse(stored); 
        this.userRole = this.user.role?.toUpperCase() || 'AGRICULTEUR'; 
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
    const p = total > 0 ? Math.round((part / total) * 100) : 0;
    return p;
  }

  formatKg(kg: number): string {
    if (!kg) return '0 kg';
    if (kg >= 1000) return (kg / 1000).toFixed(1) + ' t';
    return kg.toFixed(0) + ' kg';
  }

  statutBadge(s: string): string {
    const m: Record<string, string> = {
      NON_RECOLTE: 'badge-blue',
      EN_COURS: 'badge-amber',
      RECOLTE: 'badge-green'
    };
    return m[s] || '';
  }

  statutLabel(s: string): string {
    const m: Record<string, string> = {
      NON_RECOLTE: 'Non récolté',
      EN_COURS: 'En cours',
      RECOLTE: 'Récolté'
    };
    return m[s] || s;
  }

  maturiteColor(p: number): string {
    if (p < 30) return '#b5892a';
    if (p < 70) return '#d97706';
    return '#2d6a4f';
  }
}