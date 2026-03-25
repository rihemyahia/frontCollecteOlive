import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TravailleurService, Travailleur } from '../../services/travailleur';

@Component({
  selector: 'app-modifier-travailleur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modifier-travailleur.html',
  styleUrls: ['./modifier-travailleur.css']
})
export class ModifierTravailleur implements OnInit {
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

  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  id: string = '';

  specialites = ['recolte', 'transport', 'taille', 'traitement'];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private travailleurService: TravailleurService
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];
    this.loadTravailleur();
  }

  loadTravailleur(): void {
    this.isLoading = true;
    this.travailleurService.getById(this.id).subscribe({
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
    if (!this.travailleur.nom || !this.travailleur.prenom || !this.travailleur.email) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.travailleurService.update(this.id, this.travailleur).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Travailleur modifié avec succès !';
        setTimeout(() => {
          this.router.navigate(['/travailleurs']);
        }, 1500);
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = err.error?.message || 'Erreur lors de la modification';
        console.error(err);
      }
    });
  }
}
