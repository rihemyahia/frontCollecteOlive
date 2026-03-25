import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TravailleurService, Travailleur } from '../../services/travailleur';

@Component({
  selector: 'app-creer-travailleur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './creer-travailleur.html',
  styleUrls: ['./creer-travailleur.css']
})
export class CreerTravailleur {
  travailleur: Travailleur = {
    nom: '',
    prenom: '',
    telephone: '',
    adresse: '',
    email: '',
    specialite: 'recolte',
    statut: 'ACTIF',
    salaireJournalier: 40
  };

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  specialites = ['recolte', 'transport', 'taille', 'traitement'];

  constructor(
    private travailleurService: TravailleurService,
    public router: Router
  ) {}

  onSubmit(): void {
    if (!this.travailleur.nom || !this.travailleur.prenom || !this.travailleur.email) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
this.travailleurService.create(this.travailleur).subscribe({
  next: () => {
    this.isLoading = false;
    this.successMessage = 'Travailleur créé avec succès !';
    setTimeout(() => {
      this.router.navigate(['/travailleurs']);
    }, 1500);
  },
  error: (err) => {
    this.isLoading = false;
    this.errorMessage = err.error?.message || 'Erreur lors de la création';
  }
});
  }
}
