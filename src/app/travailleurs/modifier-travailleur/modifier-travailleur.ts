// modifier-travailleur.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TravailleurService, Travailleur } from '../../services/travailleur';

@Component({
  selector: 'app-modifier-travailleur',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './modifier-travailleur.html',
  styleUrls: ['./modifier-travailleur.css']
})
export class ModifierTravailleur implements OnInit {
  travailleur: Travailleur = {
    nom: '',
    prenom: '',
    telephone: '',
    specialite: 'RECOLTEUR',
    statut: 'DISPONIBLE',
    salaireJournalier: 40,
    typeTravailleur: 'SAISONNIER'
  };

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  specialites = ['RECOLTEUR', 'CONDUCTEUR', 'CHEF_EQUIPE'];
  typeTravailleurs = ['PERMANENT', 'SAISONNIER', 'CDD'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private travailleurService: TravailleurService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTravailleur(id);
    }
  }

  loadTravailleur(id: string): void {
    this.isLoading = true;
    this.travailleurService.getById(id).subscribe({
      next: (data) => {
        this.travailleur = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  onSubmit(): void {
    if (!this.travailleur.nom || !this.travailleur.prenom || !this.travailleur.telephone) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.travailleurService.update(this.travailleur.id!, this.travailleur).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Travailleur modifié avec succès !';
        setTimeout(() => {
          this.router.navigate(['/travailleurs']);
        }, 1500);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Erreur lors de la modification';
      }
    });
  }
}