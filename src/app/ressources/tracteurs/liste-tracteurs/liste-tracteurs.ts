// src/app/ressources/tracteurs/liste-tracteurs/liste-tracteurs.ts
import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TracteurService } from '../../../services/tracteur';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { SideBarResponsable } from '../../../sidebar-responsable/sidebar-responsable';
import { Tracteur } from '../../../models/Tracteur';

@Component({
  selector: 'app-liste-tracteurs',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SideBarResponsable],
  templateUrl: './liste-tracteurs.html',
  styleUrls: ['./liste-tracteurs.css']
})
export class ListeTracteursComponent implements OnInit {
  tracteurs: Tracteur[] = [];
  filteredTracteurs: Tracteur[] = [];
  paginatedTracteurs: Tracteur[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  selectedStatut: string = 'TOUS';
  deleteConfirmId: string | null = null;
  searchQuery: string = '';

  isSidebarCollapsed = false;
  isMobile = false;
  userRole: string = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  statuts: string[] = ['TOUS', 'DISPONIBLE', 'EN_USE', 'MAINTENANCE', 'HORS_SERVICE'];

  constructor(
    private tracteurService: TracteurService,
    public router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUserRole();
    this.checkMobile();
    this.loadTracteurs();
  }

  loadUserRole(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userRole = user.role?.toUpperCase() || '';
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.isSidebarCollapsed = false;
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  loadTracteurs(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.tracteurService.getAll().subscribe({
      next: (data: Tracteur[]) => {
        this.tracteurs = data || [];
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.message || 'Erreur lors du chargement des tracteurs';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.tracteurs];

    // Filter by status
    if (this.selectedStatut !== 'TOUS') {
      filtered = filtered.filter(tracteur => tracteur.statut === this.selectedStatut);
    }

    // Filter by search query
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(tracteur =>
        tracteur.nom?.toLowerCase().includes(query) ||
        tracteur.immatriculation?.toLowerCase().includes(query)
      );
    }

    this.filteredTracteurs = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredTracteurs.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedTracteurs = this.filteredTracteurs.slice(startIndex, endIndex);
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedStatut = 'TOUS';
    this.applyFilters();
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

  deleteTracteur(id: string): void {
    this.deleteConfirmId = id;
  }

  confirmDelete(): void {
    if (this.deleteConfirmId) {
      this.tracteurService.delete(this.deleteConfirmId).subscribe({
        next: () => {
          this.successMessage = 'Tracteur supprimé avec succès';
          this.deleteConfirmId = null;
          this.loadTracteurs();
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = err.message || 'Erreur lors de la suppression';
          this.deleteConfirmId = null;
          setTimeout(() => {
            this.errorMessage = '';
          }, 3000);
        }
      });
    }
  }

  cancelDelete(): void {
    this.deleteConfirmId = null;
  }

  navigateToAdd(): void {
    this.router.navigate(['/ressources/tracteurs/ajouter']);
  }

  navigateToEdit(id: string): void {
    this.router.navigate([`/ressources/tracteurs/modifier/${id}`]);
  }

  // Same as bennes list - using bg-success, bg-warning, bg-danger, bg-secondary classes
  getStatutClass(statut: string): string {
    switch(statut) {
      case 'DISPONIBLE': return 'bg-success';
      case 'EN_USE': return 'bg-warning text-dark';
      case 'MAINTENANCE': return 'bg-danger';
      case 'HORS_SERVICE': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }

  getStatutLabel(statut: string): string {
    switch(statut) {
      case 'DISPONIBLE': return 'Disponible';
      case 'EN_USE': return 'En usage';
      case 'MAINTENANCE': return 'Maintenance';
      case 'HORS_SERVICE': return 'Hors service';
      default: return statut;
    }
  }
}