// src/app/agriculteurs/liste-agriculteurs/liste-agriculteurs.ts
import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AgriculteurService, Agriculteur } from '../../services/agriculteur';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';

@Component({
  selector: 'app-liste-agriculteurs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SideBarResponsable],
  templateUrl: './liste-agriculteurs.html',
  styleUrls: ['./liste-agriculteurs.css']
})
export class ListeAgriculteurs implements OnInit {
  agriculteurs: Agriculteur[] = [];
  isLoading = true;
  errorMessage = '';
  searchTerm = '';

  // Propriétés pour la sidebar
  isSidebarCollapsed = false;
  isMobile = false;
  userRole: string = '';

  constructor(
    public router: Router,
    private agriculteurService: AgriculteurService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUserRole();
    this.checkMobile();
    this.loadAgriculteurs();
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

  loadAgriculteurs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.agriculteurService.getAll().subscribe({
      next: (data) => {
        this.agriculteurs = data || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des agriculteurs:', err);
        this.errorMessage = 'Erreur lors du chargement des agriculteurs. Veuillez réessayer.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get filteredAgriculteurs(): Agriculteur[] {
    if (!this.searchTerm?.trim()) {
      return this.agriculteurs;
    }

    const term = this.searchTerm.toLowerCase().trim();
    return this.agriculteurs.filter(a =>
      a.nom?.toLowerCase().includes(term) ||
      a.prenom?.toLowerCase().includes(term) ||
      a.email?.toLowerCase().includes(term) ||
      a.nomExploitation?.toLowerCase().includes(term)
    );
  }

  getStatusBadgeClass(compteActif: boolean | undefined): string {
    if (compteActif === true) return 'bg-success';
    if (compteActif === false) return 'bg-warning text-dark';
    return 'bg-secondary';
  }

  getStatusText(compteActif: boolean | undefined): string {
    if (compteActif === true) return 'Actif';
    if (compteActif === false) return 'En attente';
    return 'Inconnu';
  }

  modifierAgriculteur(id: string): void {
    this.router.navigate(['/agriculteurs/modifier', id]);
  }

  supprimerAgriculteur(id: string, nom: string): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'agriculteur ${nom} ?`)) {
      this.agriculteurService.delete(id).subscribe({
        next: () => {
          this.loadAgriculteurs();
        },
        error: (err) => {
          console.error('Erreur suppression:', err);
          this.errorMessage = 'Erreur lors de la suppression de l\'agriculteur';
          this.cdr.detectChanges();
        }
      });
    }
  }
}
