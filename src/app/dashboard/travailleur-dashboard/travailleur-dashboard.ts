// src/app/dashboard/travailleur-dashboard/travailleur-dashboard.ts
import { Component, OnInit, HostListener, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { CalendrierService, EvenementCalendrier } from '../../services/calendrier';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-travailleur-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SideBarResponsable],
  templateUrl: './travailleur-dashboard.html',
  styleUrls: ['./travailleur-dashboard.css']
})
export class TravailleurDashboardComponent implements OnInit, AfterViewInit {
  userRole = 'TRAVAILLEUR';
  user: any = {};
  isSidebarCollapsed = false;
  isMobile = false;
  loading = true;
  error = '';
  metricsAnimated = false;

  events: EvenementCalendrier[] = [];
  totalTournees = 0;
  tourneesPlanifiees = 0;
  tourneesEnCours = 0;
  tourneesTerminees = 0;
  tourneeEvents: EvenementCalendrier[] = [];
  currentSeason = '';

  constructor(
    private calendrierService: CalendrierService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUser();
    this.checkMobile();
    this.currentSeason = this.getSeasonLabel(new Date());
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.metricsAnimated = true;
      this.cdr.detectChanges();
    }, 100);
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.isSidebarCollapsed = false;
    }
  }

  loadUser(): void {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        this.user = JSON.parse(stored);
        this.userRole = (this.user.role || 'TRAVAILLEUR').toUpperCase();
      } catch {
        this.userRole = 'TRAVAILLEUR';
      }
    }
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = '';
    this.events = [];

    const now = new Date();
    const debut = new Date(now.getFullYear(), now.getMonth(), 1);
    const fin = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.calendrierService.getMonPlanning(debut, fin).subscribe({
      next: (data) => {
        this.events = data || [];
        this.calculateMetrics();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement planning travailleur:', err);
        this.error = 'Impossible de charger votre planning pour le moment.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calculateMetrics(): void {
    this.totalTournees = this.events.length;
    this.tourneesPlanifiees = this.events.filter(e => e.statut === 'PLANIFIEE').length;
    this.tourneesEnCours = this.events.filter(e => e.statut === 'EN_COURS').length;
    this.tourneesTerminees = this.events.filter(e => e.statut === 'TERMINEE').length;
    this.tourneeEvents = this.events
      .slice()
      .sort((a, b) => new Date(a.debut).getTime() - new Date(b.debut).getTime())
      .slice(0, 4);
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  toggleSidebar(collapsed?: boolean): void {
    this.isSidebarCollapsed = typeof collapsed === 'boolean' ? collapsed : !this.isSidebarCollapsed;
  }

  get displayName(): string {
    return `${this.user?.prenom || ''} ${this.user?.nom || ''}`.trim() || 'Travailleur';
  }

  get initials(): string {
    const first = this.user?.prenom?.charAt(0) ?? 'T';
    const last = this.user?.nom?.charAt(0) ?? 'W';
    return `${first}${last}`.toUpperCase();
  }

  formatDate(dateValue: Date | string | undefined): string {
    if (!dateValue) return '-';
    const date = new Date(dateValue);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    });
  }

  getStatusLabel(statut: string): string {
    switch (statut) {
      case 'PLANIFIEE': return 'Planifiée';
      case 'EN_COURS': return 'En cours';
      case 'TERMINEE': return 'Terminée';
      default: return statut || 'N/A';
    }
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'PLANIFIEE': return 'planifiee';
      case 'EN_COURS': return 'en-cours';
      case 'TERMINEE': return 'terminee';
      default: return '';
    }
  }

  private getSeasonLabel(date: Date): string {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    if (month >= 3 && month <= 5) return `Printemps ${year}`;
    if (month >= 6 && month <= 8) return `Été ${year}`;
    if (month >= 9 && month <= 11) return `Automne ${year}`;
    return `Hiver ${year}`;
  }
}