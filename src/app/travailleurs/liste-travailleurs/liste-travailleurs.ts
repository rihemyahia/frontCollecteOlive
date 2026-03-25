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
    private cdr: ChangeDetectorRef   // ← Ajouté
  ) {}

  ngOnInit(): void {
    this.loadTravailleurs();
  }

  loadTravailleurs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.travailleurService.getAll().subscribe({
      next: (data) => {
        console.log('🟢 COMPONENT next() called, data:', data);

        this.travailleurs = data;
        this.isLoading = false;

        this.cdr.markForCheck();   // ← Force la détection de changement
      },
      error: (err) => {
        console.error('❌ COMPONENT error():', err);
        this.errorMessage = 'Erreur lors du chargement des travailleurs';
        this.isLoading = false;

        this.cdr.markForCheck();   // ← Aussi en cas d'erreur
      }
    });
  }

  deleteTravailleur(id: string): void {
    if (confirm('Voulez-vous vraiment supprimer ce travailleur ?')) {
      this.travailleurService.delete(id).subscribe({
        next: () => {
          this.loadTravailleurs();
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Erreur lors de la suppression';
          this.cdr.markForCheck();
        }
      });
    }
  }

  getStatutClass(statut: string): string {
    return statut === 'ACTIF' ? 'badge-actif' : 'badge-suspendu';
  }
}
