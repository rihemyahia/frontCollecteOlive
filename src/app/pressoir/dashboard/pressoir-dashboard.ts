import { Component, HostListener, OnInit } from '@angular/core';
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
  styleUrls: ['../pressoir.css']
})
export class PressoirDashboardComponent implements OnInit {
  isSidebarCollapsed = false;
  userRole = 'RESPONSABLE_PRESSOIR';
  isLoading = false;
  errorMessage = '';
  data: PressoirDashboard | null = null;

  constructor(private pressoirService: PressoirService, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole() || 'RESPONSABLE_PRESSOIR';
    this.loadDashboard();
    this.checkMobile();
  }

  @HostListener('window:resize')
  checkMobile(): void {
    if (window.innerWidth < 768) this.isSidebarCollapsed = true;
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.pressoirService.getDashboard().subscribe({
      next: (data) => {
        this.data = { ...data, collectesHuile: data.collectesHuile || [] };
        this.isLoading = false;
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

  percent(value: number = 0, total: number = 0): number {
    return total ? Math.min(100, Math.round((value / total) * 100)) : 0;
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
    if (!collecte) return 'Aucune donnee';
    return `${collecte.collecteCode} - ${this.formatPercent(collecte.rendementMoyenPourcentage)}`;
  }

  formatKg(value?: number | null): string {
    return `${Number(value || 0).toLocaleString('fr-FR')} kg`;
  }

  formatLiters(value?: number | null): string {
    return `${Number(value || 0).toLocaleString('fr-FR')} L`;
  }

  formatPercent(value?: number | null): string {
    return `${Number(value || 0).toFixed(2)}%`;
  }

  private getError(err: any, fallback: string): string {
    return err?.error?.error || err?.error?.message || err?.message || fallback;
  }
}
