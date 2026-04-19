import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VergerService } from '../../services/verger';
import { VergerResponse } from '../../models/verger';
import { StatutVerger } from '../../models/enums/statut-verger';
import { AuthService } from '../../services/auth';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { VergerMapComponent } from '../../shared/verger-map/verger-map';

@Component({
  selector: 'app-mes-vergers',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    DatePipe,
    SideBarResponsable,
    FormsModule,
    VergerMapComponent
  ],
  templateUrl: './mes-vergers.html',
  styleUrl: './mes-vergers.css'
})
export class MesVergersComponent implements OnInit {

  vergers: VergerResponse[] = [];
  isLoading = true;
  errorMessage = '';

  // Search & Filter
  searchQuery = '';
  selectedType = '';
  selectedStatus = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 6;

  isSidebarCollapsed = false;
  isMobile = false;
  userRole = '';
  agriculteurId = '';

  // =========================
  // ✅ MAP CONTROL (FIXED)
  // =========================
  selectedVergerId: string = '';
  selectedVergerIds: string[] = [];

  constructor(
    private vergerService: VergerService,
    private authService: AuthService,
    public router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) this.isSidebarCollapsed = false;
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    this.agriculteurId = this.authService.getUserId();
    this.checkMobile();
    this.loadVergers();
  }

  loadVergers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.vergerService.getByAgriculteur(this.agriculteurId).subscribe({
      next: (data) => {
        this.vergers = data.filter(v => !v.estSupprimer);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading vergers:', err);
        this.errorMessage = 'Erreur lors du chargement de vos vergers.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // =========================
  // ✅ DROPDOWN MAP LOGIC FIXED
  // =========================
  zoomToSelected(): void {

    if (!this.selectedVergerId) {
      // reset → show all
      this.selectedVergerIds = [];
      return;
    }

    const selected = this.vergers.find(v =>
      (v as any).id === this.selectedVergerId ||
      (v as any)._id === this.selectedVergerId
    );

    if (!selected) {
      this.selectedVergerIds = [];
      return;
    }

    // single selection zoom
    this.selectedVergerIds = [this.selectedVergerId];

    // optional: force UI refresh
    this.cdr.detectChanges();
  }

  // =========================
  // STATS
  // =========================
  get totalArbres(): number {
    return this.vergers.reduce((s, v) => s + (v.nbArbre ?? 0), 0);
  }

  get totalSuperficie(): number {
    return this.vergers.reduce((s, v) => s + (v.superficie ?? 0), 0);
  }

  get vergersRecoltes(): number {
    return this.vergers.filter(v => v.statut === StatutVerger.RECOLTE).length;
  }

  // =========================
  // FILTERS
  // =========================
  get filteredVergers(): VergerResponse[] {
    let result = [...this.vergers];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(v =>
        v.typeOlive?.toLowerCase().includes(q)
      );
    }

    if (this.selectedType) {
      result = result.filter(v => v.typeOlive === this.selectedType);
    }

    if (this.selectedStatus) {
      result = result.filter(v => v.statut === this.selectedStatus);
    }

    return result;
  }

  // =========================
  // PAGINATION
  // =========================
  get totalPages(): number {
    return Math.ceil(this.filteredVergers.length / this.itemsPerPage) || 1;
  }

  get paginatedVergers(): VergerResponse[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredVergers.slice(start, start + this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.goToPage(this.currentPage + 1);
  }

  previousPage(): void {
    if (this.currentPage > 1) this.goToPage(this.currentPage - 1);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedType = '';
    this.selectedStatus = '';
    this.currentPage = 1;
  }

  // =========================
  // ALERT
  // =========================
  openAlertModal(verger: VergerResponse): void {
    sessionStorage.setItem('preSelectedVergerId', (verger as any).id);
    this.router.navigate(['/mes-alertes']);
  }

  // =========================
  // HELPERS
  // =========================
  get vergerTypes(): string[] {
    const types = this.vergers
      .map(v => v.typeOlive)
      .filter((v, i, a) => a.indexOf(v) === i);

    return types.sort();
  }

  getMaturiteColor(val: number): string {
    if (val < 40) return '#E8A838';
    if (val < 75) return '#A8B84B';
    return '#4A7A2A';
  }

  getStatutLabel(s: string | StatutVerger): string {
    const map: Record<string, string> = {
      'NON_RECOLTE': 'Non récolté',
      'EN_COURS': 'En cours',
      'RECOLTE': 'Récolté'
    };
    return map[s as string] ?? (s as string);
  }
}