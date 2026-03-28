// liste-travailleurs.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TravailleurService, Travailleur } from '../../services/travailleur';

@Component({
  selector: 'app-liste-travailleurs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './liste-travailleurs.html',
  styleUrls: ['./liste-travailleurs.css']
})
export class ListeTravailleurs implements OnInit {
  travailleurs: Travailleur[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private travailleurService: TravailleurService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTravailleurs();
  }

  loadTravailleurs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.travailleurService.getAll().subscribe({
      next: (data) => {
        console.log('✅ Réponse reçue avec', data.length, 'travailleurs');

        // Mise à jour en dehors de la zone puis force le change detection
        this.travailleurs = [...data];
        this.isLoading = false;

        // Force fortement la détection de changement
        setTimeout(() => {
          this.cdr.detectChanges();
          console.log('✅ isLoading = false + Change Detection forcée avec setTimeout');
        }, 0);
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement:', err);
        this.errorMessage = err.error?.message || 'Erreur lors du chargement';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteTravailleur(id: string, nom: string): void {
    if (!id) {
      this.errorMessage = 'ID du travailleur non valide';
      this.cdr.detectChanges();
      return;
    }

    if (confirm(`Supprimer ${nom} ?`)) {
      this.travailleurService.delete(id).subscribe({
        next: () => {
          this.loadTravailleurs();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erreur lors de la suppression';
          this.cdr.detectChanges();
        }
      });
    }
  }

  getBadgeClass(statut: string): string {
    return statut === 'DISPONIBLE' ? 'badge-success' : 'badge-warning';
  }
// liste-travailleurs.ts
getTypeBadgeClass(type: string | undefined): string {
  switch(type) {
    case 'PERMANENT': return 'type-permanent';
    case 'SAISONNIER': return 'type-saisonnier';
    case 'CDD': return 'type-cdd';
    default: return 'type-permanent';
  }
  }
  getInitials(prenom: string, nom: string): string {
  return ((prenom?.[0] ?? '') + (nom?.[0] ?? '')).toUpperCase();
}

getCountByStatut(statut: string): number {
  return this.travailleurs.filter(t => t.statut === statut).length;
}

getCountByType(type: string): number {
  return this.travailleurs.filter(t => t.typeTravailleur === type).length;
}
  getTypeTravailleurLabel(type: string | undefined): string {
    switch(type) {
      case 'PERMANENT': return 'Permanent';
      case 'SAISONNIER': return 'Saisonnier';
      case 'CDD': return 'CDD';
      default: return type || 'Non défini';
    }
  }
}