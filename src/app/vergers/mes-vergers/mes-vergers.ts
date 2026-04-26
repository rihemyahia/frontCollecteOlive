// src/app/ressources/vergers/mes-vergers/mes-vergers.ts
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
  filteredVergers: VergerResponse[] = [];
  paginatedVergers: VergerResponse[] = [];
  isLoading = true;
  errorMessage = '';

  // Search & Filter
  searchQuery = '';
  selectedType = '';
  selectedStatus = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 1;

  isSidebarCollapsed = false;
  isMobile = false;
  userRole = '';
  agriculteurId = '';

  // Map properties
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
        this.applyFilters();
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

  // ====================== FILTER METHODS ======================
  applyFilters(): void {
    let result = [...this.vergers];

    // Search filter
    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(v =>
        v.typeOlive?.toLowerCase().includes(q) ||
        v.geolocalisation?.adresseIndicative?.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (this.selectedType) {
      result = result.filter(v => v.typeOlive === this.selectedType);
    }

    // Status filter
    if (this.selectedStatus) {
      result = result.filter(v => v.statut === this.selectedStatus);
    }

    this.filteredVergers = result;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredVergers.length / this.itemsPerPage) || 1;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedVergers = this.filteredVergers.slice(startIndex, endIndex);
    this.cdr.detectChanges();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedType = '';
    this.selectedStatus = '';
    this.applyFilters();
  }

  // ====================== PAGINATION METHODS ======================
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ====================== MAP METHODS ======================
  zoomToSelected(): void {
    if (!this.selectedVergerId) {
      this.selectedVergerIds = [];
      return;
    }
    this.selectedVergerIds = [this.selectedVergerId];
    this.cdr.detectChanges();
  }

  // ====================== STATS METHODS ======================
  get totalArbres(): number {
    return this.vergers.reduce((s, v) => s + (v.nbArbre ?? 0), 0);
  }

  get totalSuperficie(): number {
    return this.vergers.reduce((s, v) => s + (v.superficie ?? 0), 0);
  }

  get vergersRecoltes(): number {
    return this.vergers.filter(v => v.statut === StatutVerger.RECOLTE).length;
  }

  get vergerTypes(): string[] {
    const types = this.vergers
      .map(v => v.typeOlive)
      .filter((v, i, a) => a.indexOf(v) === i);
    return types.sort();
  }

  // ====================== HELPER METHODS ======================
  getMaturiteColor(val: number): string {
    if (val < 40) return '#E8A838';
    if (val < 75) return '#A8B84B';
    return '#4A7A2A';
  }

  getStatutClass(statut: string): string {
    switch(statut) {
      case 'NON_RECOLTE': return 'badge-warning';
      case 'EN_COURS': return 'badge-info';
      case 'RECOLTE': return 'badge-success';
      default: return '';
    }
  }

  getStatutDotClass(statut: string): string {
    switch(statut) {
      case 'NON_RECOLTE': return 'dot-warning';
      case 'EN_COURS': return 'dot-info';
      case 'RECOLTE': return 'dot-success';
      default: return '';
    }
  }

  getStatutLabel(statut: string): string {
    switch(statut) {
      case 'NON_RECOLTE': return 'Non récolté';
      case 'EN_COURS': return 'En cours';
      case 'RECOLTE': return 'Récolté';
      default: return statut;
    }
  }

  // ====================== ALERT METHOD ======================
  openAlertModal(verger: VergerResponse): void {
    this.router.navigate(['/alertes/creer'], {
      queryParams: { vergerId: (verger as any).id }
    });
  }
}