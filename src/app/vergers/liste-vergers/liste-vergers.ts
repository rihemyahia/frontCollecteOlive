// src/app/ressources/vergers/liste-vergers/liste-vergers.ts
import { AuthService } from './../../services/auth';
import { Component, OnInit, HostListener, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VergerService } from '../../services/verger';
import { VergerResponse } from '../../models/verger';
import { StatutVerger } from '../../models/enums/statut-verger';
import { StatutVergerLabelPipe } from '../../shared/pipes/statut-verger-label-pipe';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';

@Component({
  selector: 'app-liste-vergers',
  standalone: true,
  imports: [CommonModule, FormsModule, StatutVergerLabelPipe, SideBarResponsable],
  templateUrl: './liste-vergers.html',
  styleUrl: './liste-vergers.css'
})
export class ListeVergersComponent implements OnInit {

  vergers: VergerResponse[] = [];
  filteredVergers: VergerResponse[] = [];
  paginatedVergers: VergerResponse[] = [];
  searchTerm = '';
  selectedStatus = '';
  isLoading = false;
  errorMessage = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  isSidebarCollapsed = false;
  isMobile = false;
  userRole: string = '';

  constructor(
    private vergerService: VergerService,
    public router: Router,
    private authService: AuthService,
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
    this.checkMobile();
    this.loadVergers();
  }

  trackById(index: number, item: VergerResponse): string {
    return item.id;
  }

  loadVergers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    const role = this.authService.getUserRole();

    const obs = (role === 'AGRICULTEUR')
      ? this.vergerService.getByAgriculteur(this.authService.getUserId())
      : this.vergerService.getAll();

    obs.subscribe({
      next: data => {
        this.vergers = [...data];
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    let filtered = [...this.vergers];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(v =>
        v.agriculteurNom?.toLowerCase().includes(term) ||
        v.typeOlive?.toLowerCase().includes(term) ||
        (v.statut || '').toLowerCase().includes(term)
      );
    }

    if (this.selectedStatus) {
      filtered = filtered.filter(v => v.statut === this.selectedStatus);
    }

    this.filteredVergers = filtered;
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

  applyFilterDebounced(): void {
    this.applyFilter();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.applyFilter();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  getStatutCount(statut: string): number {
    return this.filteredVergers.filter(v => v.statut === statut).length;
  }

  supprimer(id: string): void {
    if (!confirm('Supprimer ce verger ?')) return;
    this.vergerService.desactiver(id).subscribe({
      next: () => this.loadVergers(),
      error: () => {
        this.errorMessage = 'Erreur lors de la suppression.';
        this.cdr.detectChanges();
      }
    });
  }

  getStatutClass(statut: string): string {
    switch(statut) {
      case 'NON_RECOLTE': return 'badge-warning';
      case 'EN_COURS': return 'badge-info';
      case 'RECOLTE': return 'badge-success';
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

  getMaturiteColor(value: number): string {
    if (value < 40) return '#E8A838';
    if (value < 75) return '#A8B84B';
    return '#4A7A2A';
  }

  isResponsableOrAdmin(): boolean {
    return this.userRole === 'RESPONSABLE' || this.userRole === 'ADMIN';
  }
}