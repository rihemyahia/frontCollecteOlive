// src/app/ressources/bennes/liste-bennes/liste-bennes.ts
import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BenneService } from '../../../services/benne';
import { Benne } from '../../../models/benne';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { SideBarResponsable } from '../../../sidebar-responsable/sidebar-responsable';

@Component({
  selector: 'app-liste-bennes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SideBarResponsable],
  templateUrl: './liste-bennes.html',
  styleUrls: ['./liste-bennes.css']
})
export class ListeBennesComponent implements OnInit {
  bennes: Benne[] = [];
  filteredBennes: Benne[] = [];
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
    private benneService: BenneService,
    public router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUserRole();
    this.checkMobile();
    this.loadBennes();
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

  loadBennes(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.benneService.getAll().subscribe({
      next: (data: Benne[]) => {
        this.bennes = data || [];
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.message || 'Erreur lors du chargement des bennes';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    if (this.selectedStatut === 'TOUS') {
      this.filteredBennes = [...this.bennes];
    } else {
      this.filteredBennes = this.bennes.filter(benne => benne.statut === this.selectedStatut);
    }
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  deleteBenne(id: string): void {
    this.deleteConfirmId = id;
  }

  confirmDelete(): void {
    if (this.deleteConfirmId) {
      this.benneService.delete(this.deleteConfirmId).subscribe({
        next: () => {
          this.successMessage = 'Benne supprimée avec succès';
          this.deleteConfirmId = null;
          this.loadBennes();
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = err.message || 'Erreur lors de la suppression';
          this.deleteConfirmId = null;
        }
      });
    }
  }

  cancelDelete(): void {
    this.deleteConfirmId = null;
  }

  navigateToAdd(): void {
    this.router.navigate(['/ressources/bennes/ajouter']);
  }

  navigateToEdit(id: string): void {
    this.router.navigate([`/ressources/bennes/modifier/${id}`]);
  }

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