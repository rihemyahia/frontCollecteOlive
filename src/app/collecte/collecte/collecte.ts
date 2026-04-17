// src/app/collecte/collecte.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { StatutCollectePipe } from '../../pipes/statut-collecte-pipe-pipe';
import { CollecteService } from '../../services/collecte';

@Component({
  selector: 'app-collecte',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SideBarResponsable, StatutCollectePipe],
  templateUrl: './collecte.html',
  styleUrls: ['./collecte.css']
})
export class CollecteComponent implements OnInit {
  isSidebarCollapsed = false;
  userRole = 'ADMIN';
  isMobile = false;

  collectes: any[] = [];
  filteredCollectes: any[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  selectedStatut = 'TOUS';
  statuts = ['TOUS', 'PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'];
  searchTerm = '';

  deleteConfirmId: string | null = null;

  constructor(private collecteService: CollecteService) {}

  ngOnInit() {
    this.loadCollectes();
    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());
  }
  // collecte.component.ts - Ajoutez cette méthode

voirDetails(collecte: any) {
  // Afficher les détails dans une modal ou une alerte
  // Pour l'instant, on affiche dans la console
  console.log('Détails de la collecte:', collecte);

  // Ou afficher une alerte avec les infos principales
  alert(`
    Campagne: ${collecte.code}
    Statut: ${this.getStatutLabel(collecte.statut)}
    Tournées: ${collecte.nombreTourneesTerminees || 0} / ${collecte.nombreTournees || 0}
    Quantité totale: ${collecte.quantiteTotaleKg || 0} kg
    Rendement moyen: ${collecte.rendementMoyenParArbre || 0} kg/arbre
    Observations: ${collecte.observations || 'Aucune'}
  `);
}

  checkMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  loadCollectes() {
    this.isLoading = true;
    this.collecteService.getAll().subscribe({
      next: (data) => {
        this.collectes = data;
        this.filterCollectes();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.errorMessage = 'Erreur lors du chargement des campagnes';
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  filterCollectes() {
    this.filteredCollectes = this.collectes.filter(collecte => {
      const matchStatut = this.selectedStatut === 'TOUS' || collecte.statut === this.selectedStatut;
      const matchSearch = !this.searchTerm ||
        collecte.code?.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchStatut && matchSearch;
    });
  }

  onFilterChange() {
    this.filterCollectes();
  }

  onSearchChange() {
    this.filterCollectes();
  }

  getStatutLabel(statut: string): string {
    const labels: any = {
      'PLANIFIEE': 'Planifiée',
      'EN_COURS': 'En cours',
      'TERMINEE': 'Terminée',
      'ANNULEE': 'Annulée'
    };
    return labels[statut] || statut;
  }

  getStatutClass(statut: string): string {
    const classes: any = {
      'PLANIFIEE': 'statut-planifiee',
      'EN_COURS': 'statut-encours',
      'TERMINEE': 'statut-terminee',
      'ANNULEE': 'statut-annulee'
    };
    return classes[statut] || '';
  }

  getProgress(collecte: any): number {
    if (!collecte.nombreTournees || collecte.nombreTournees === 0) return 0;
    return Math.round((collecte.nombreTourneesTerminees || 0) / collecte.nombreTournees * 100);
  }

  getProgressClass(progress: number): string {
    if (progress >= 100) return 'bg-success';
    if (progress >= 75) return 'bg-info';
    if (progress >= 50) return 'bg-primary';
    if (progress >= 25) return 'bg-warning';
    return 'bg-secondary';
  }

  creerCollecte() {
    this.collecteService.creer("").subscribe({
      next: (collecte) => {
        this.successMessage = `Campagne ${collecte.code} créée avec succès`;
        this.loadCollectes();
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors de la création';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  demarrerCollecte(collecte: any) {
    this.collecteService.demarrer(collecte.id).subscribe({
      next: () => {
        this.successMessage = `Campagne ${collecte.code} démarrée`;
        this.loadCollectes();
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du démarrage';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  terminerCollecte(collecte: any) {
    this.collecteService.terminer(collecte.id).subscribe({
      next: () => {
        this.successMessage = `Campagne ${collecte.code} terminée`;
        this.loadCollectes();
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors de la terminaison';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  annulerCollecte(collecte: any) {
    this.collecteService.annuler(collecte.id).subscribe({
      next: () => {
        this.successMessage = `Campagne ${collecte.code} annulée`;
        this.loadCollectes();
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors de l\'annulation';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  supprimerCollecte(collecte: any) {
    this.collecteService.supprimer(collecte.id).subscribe({
      next: () => {
        this.successMessage = `Campagne ${collecte.code} supprimée`;
        this.loadCollectes();
        this.deleteConfirmId = null;
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors de la suppression';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  confirmDelete(id: string) {
    this.deleteConfirmId = id;
  }

  cancelDelete() {
    this.deleteConfirmId = null;
  }

  getTotalCollecteLabel(total: number): string {
    if (total >= 1000) {
      return `${(total / 1000).toFixed(1)} t`;
    }
    return `${total.toFixed(0)} kg`;
  }
}
