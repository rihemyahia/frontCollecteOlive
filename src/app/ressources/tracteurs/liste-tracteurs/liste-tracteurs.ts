// src/app/ressources/tracteurs/liste-tracteurs/liste-tracteurs.ts
import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TracteurService } from '../../../services/tracteur';
import { Tracteur } from '../../../models/tracteur';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { SideBarResponsable } from '../../../sidebar-responsable/sidebar-responsable';

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
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  selectedStatut: string = 'TOUS';
  deleteConfirmId: string | null = null;

  isSidebarCollapsed = false;
  isMobile = false;
  userRole: string = '';

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
    if (this.selectedStatut === 'TOUS') {
      this.filteredTracteurs = [...this.tracteurs];
    } else {
      this.filteredTracteurs = this.tracteurs.filter(tracteur => tracteur.statut === this.selectedStatut);
    }
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  updateKilometrage(id: string): void {
    const kilometrage = prompt('Entrez le nouveau kilométrage:');
    if (kilometrage && !isNaN(Number(kilometrage))) {
      this.tracteurService.updateKilometrage(id, Number(kilometrage)).subscribe({
        next: () => {
          this.loadTracteurs();
          this.successMessage = 'Kilométrage mis à jour';
          setTimeout(() => { this.successMessage = ''; }, 3000);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = err.message || 'Erreur lors de la mise à jour du kilométrage';
          setTimeout(() => { this.errorMessage = ''; }, 3000);
        }
      });
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
          setTimeout(() => { this.successMessage = ''; }, 3000);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = err.message || 'Erreur lors de la suppression';
          this.deleteConfirmId = null;
          setTimeout(() => { this.errorMessage = ''; }, 3000);
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

  startMaintenance(id: string): void {
    if (confirm('Mettre ce tracteur en maintenance ?')) {
      this.tracteurService.startMaintenance(id).subscribe({
        next: () => {
          this.loadTracteurs();
          this.successMessage = 'Tracteur en maintenance';
          setTimeout(() => { this.successMessage = ''; }, 3000);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = err.message || 'Erreur lors de la mise en maintenance';
          setTimeout(() => { this.errorMessage = ''; }, 3000);
        }
      });
    }
  }

  endMaintenance(id: string): void {
    if (confirm('Sortir ce tracteur de maintenance ?')) {
      this.tracteurService.endMaintenance(id).subscribe({
        next: () => {
          this.loadTracteurs();
          this.successMessage = 'Tracteur disponible';
          setTimeout(() => { this.successMessage = ''; }, 3000);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = err.message || 'Erreur lors de la sortie de maintenance';
          setTimeout(() => { this.errorMessage = ''; }, 3000);
        }
      });
    }
  }

  getStatutClass(statut: string): string {
    switch(statut) {
      case 'DISPONIBLE': return 'statut-disponible';
      case 'EN_USE': return 'statut-en-usage';
      case 'MAINTENANCE': return 'statut-maintenance';
      case 'HORS_SERVICE': return 'statut-hors-service';
      default: return '';
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