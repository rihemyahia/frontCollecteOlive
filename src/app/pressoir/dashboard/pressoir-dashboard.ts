// src/app/pressoir/dashboard/pressoir-dashboard.ts
import { AfterViewInit, Component, HostListener, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CollecteHuile, PressoirDashboard, PressoirService } from '../../services/pressoir';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';

@Component({
  selector: 'app-pressoir-dashboard',
  standalone: true,
  imports: [CommonModule, SideBarResponsable],
  templateUrl: './pressoir-dashboard.html',
  styleUrls: ['./pressoir-dashboard.css']
})
export class PressoirDashboardComponent implements OnInit, AfterViewInit {
  isSidebarCollapsed = false;
  isMobile = false;
  userRole = 'RESPONSABLE_PRESSOIR';
  isLoading = false;
  errorMessage = '';
  data: PressoirDashboard | null = null;
  private wasMobile = false;

  user: any = null;
  currentSeason = '';

  constructor(
    private pressoirService: PressoirService,
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole() || 'RESPONSABLE_PRESSOIR';
    this.loadUser();
    this.currentSeason = this.getSeasonLabel(new Date());
    this.loadDashboard();
    this.checkMobile();
  }

  ngAfterViewInit(): void {
    this.refreshLayout();
  }

  @HostListener('window:resize')
  checkMobile(): void {
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      this.isSidebarCollapsed = true;
    } else if (this.wasMobile) {
      this.isSidebarCollapsed = false;
    }

    this.wasMobile = isMobile;
    this.isMobile = isMobile;
  }

  toggleSidebar(collapsed?: boolean): void {
    this.isSidebarCollapsed = typeof collapsed === 'boolean' ? collapsed : !this.isSidebarCollapsed;
    this.refreshLayout();
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.pressoirService.getDashboard().subscribe({
      next: (data) => {
        this.data = { ...data, collectesHuile: data.collectesHuile || [] };
        this.isLoading = false;
        this.refreshLayout();
      },
      error: (err) => {
        this.errorMessage = this.getError(err, 'Erreur lors du chargement du tableau de bord pressoir');
        this.isLoading = false;
      }
    });
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  initials(): string {
    const first = this.user?.prenom?.charAt(0) || 'P';
    const last = this.user?.nom?.charAt(0) || 'R';
    return `${first}${last}`.toUpperCase();
  }

  percent(value: number = 0, total: number = 0): number {
    if (total === 0) return 0;
    return Math.min(100, Math.round((value / total) * 100));
  }

  getTotalExtractions(): number {
    const counts = this.statusCounts();
    return counts.recue + counts.extraite + counts.validee;
  }

  maxOil(): number {
    return Math.max(...(this.data?.collectesHuile || []).map(c => c.totalHuileExtraiteL || 0), 1);
  }

  maxYield(): number {
    return Math.max(...(this.data?.collectesHuile || []).map(c => c.rendementMoyenPourcentage || 0), 1);
  }

  statusCounts(): { recue: number; extraite: number; validee: number } {
    const collectes = this.data?.collectesHuile || [];
    const extractions = collectes.flatMap(c => c.extractions || []);
    return {
      recue: extractions.filter(e => e.statut === 'RECUE').length,
      extraite: extractions.filter(e => e.statut === 'EXTRAITE').length,
      validee: this.data?.extractionsValidees || extractions.filter(e => e.statut === 'VALIDEE').length
    };
  }

  getCollecteLabel(collecte?: CollecteHuile | null): string {
    if (!collecte) return 'Aucune donnée';
    return `${collecte.collecteCode} - ${this.formatPercent(collecte.rendementMoyenPourcentage)}`;
  }

  formatKg(value?: number | null): string {
    if (!value) return '0 kg';
    return value >= 1000 ? (value / 1000).toFixed(1) + ' t' : value.toFixed(0) + ' kg';
  }

  formatLiters(value?: number | null): string {
    if (!value) return '0 L';
    return value.toLocaleString('fr-FR') + ' L';
  }

  formatPercent(value?: number | null): string {
    if (!value) return '0%';
    return value.toFixed(2) + '%';
  }

  private getError(err: any, fallback: string): string {
    return err?.error?.error || err?.error?.message || err?.message || fallback;
  }

  private loadUser(): void {
    const stored = localStorage.getItem('currentUser');
    if (!stored) return;

    try {
      this.user = JSON.parse(stored);
      this.userRole = this.user.role?.toUpperCase() || 'RESPONSABLE_PRESSOIR';
    } catch {
      this.user = null;
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

  private refreshLayout(): void {
    if (typeof window === 'undefined' || typeof requestAnimationFrame === 'undefined') return;

    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    });
  }
}