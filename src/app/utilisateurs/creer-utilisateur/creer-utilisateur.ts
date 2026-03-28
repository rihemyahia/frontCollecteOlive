import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UtilisateurService, Utilisateur } from '../../services/utilisateur';

@Component({
  selector: 'app-creer-utilisateur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './creer-utilisateur.html',
  styleUrls: ['./creer-utilisateur.css'] // Utilisez le même CSS que pour les travailleurs
})
export class CreerUtilisateur {
  utilisateur: Utilisateur = {
    nom: '',
    prenom: '',
    telephone: '',
    adresse: '',
    email: '',
    role: 'agriculteur',
    estActif: true,
    motDePasse: ''
  };

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  roles = ['admin', 'responsable', 'agriculteur', 'equipe_recolte', 'transporteur'];

  constructor(
    private utilisateurService: UtilisateurService,
    public router: Router
  ) {}

  onSubmit(): void {
    if (!this.utilisateur.nom || !this.utilisateur.prenom || !this.utilisateur.email || !this.utilisateur.motDePasse) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.utilisateurService.create(this.utilisateur).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Utilisateur créé avec succès !';
        setTimeout(() => {
          this.router.navigate(['/utilisateurs']);
        }, 1500);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Erreur lors de la création';
      }
    });
  }
}