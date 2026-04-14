// src/app/travailleurs/liste-travailleurs/liste-travailleurs.ts
import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TravailleurService, Travailleur } from '../../services/travailleur';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
@Component({
  selector: 'app-liste-travailleurs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SideBarResponsable],
  templateUrl: './liste-travailleurs.html',
  styleUrls: ['./liste-travailleurs.css']
})
export class ListeTravailleurs implements OnInit {
  travailleurs: Travailleur[] = [];
  isLoading = true;
  errorMessage = '';
  searchTerm = '';  // ← Assurez-vous que cette propriété existe

  // Propriétés pour la sidebar
  isSidebarCollapsed = false;
  isMobile = false;
  userRole: string = '';

  constructor(
    public router: Router,
    private travailleurService: TravailleurService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUserRole();
    this.checkMobile();
    this.loadTravailleurs();
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

  loadTravailleurs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.travailleurService.getAll().subscribe({
      next: (data) => {
        this.travailleurs = data || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des travailleurs:', err);
        this.errorMessage = 'Erreur lors du chargement des travailleurs. Veuillez réessayer.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ✅ AJOUTEZ CETTE MÉTHODE pour la recherche
  get filteredTravailleurs(): Travailleur[] {
    if (!this.searchTerm?.trim()) {
      return this.travailleurs;
    }

    const term = this.searchTerm.toLowerCase().trim();
    return this.travailleurs.filter(t =>
      t.nom?.toLowerCase().includes(term) ||
      t.prenom?.toLowerCase().includes(term) ||
      t.email?.toLowerCase().includes(term) ||
      t.cin?.toLowerCase().includes(term)
    );
  }

  getStatutBadgeClass(statut: string): string {
    switch (statut?.toUpperCase()) {
      case 'SAISONNIER':
        return 'bg-warning text-dark';
      case 'PERMANENT':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
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

  getStatutCount(statut: string): number {
    return this.travailleurs.filter(t => t.statutEmploye === statut).length;
  }

  modifierTravailleur(id: string): void {
    this.router.navigate(['/travailleurs/modifier', id]);
  }

  supprimerTravailleur(id: string, nom: string): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le travailleur ${nom} ?`)) {
      this.travailleurService.delete(id).subscribe({
        next: () => {
          this.loadTravailleurs();
        },
        error: (err) => {
          console.error('Erreur suppression:', err);
          this.errorMessage = 'Erreur lors de la suppression du travailleur';
          this.cdr.detectChanges();
        }
      });
    }
  }
}
