import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UtilisateurService, Utilisateur } from '../../services/utilisateur';

@Component({
  selector: 'app-modifier-utilisateur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modifier-utilisateur.html',
  styleUrls: ['./modifier-utilisateur.css']
})
export class ModifierUtilisateur implements OnInit {
  utilisateur: Utilisateur = {
    nom: '',
    prenom: '',
    telephone: '',
    adresse: '',
    email: '',
    role: 'agriculteur',
    estActif: true
  };

  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  id: string = '';

  roles = ['admin', 'responsable', 'agriculteur', 'equipe_recolte', 'transporteur'];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private utilisateurService: UtilisateurService
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];
    this.loadUtilisateur();
  }

  loadUtilisateur(): void {
    this.isLoading = true;
    this.utilisateurService.getById(this.id).subscribe({
      next: (data) => {
        this.utilisateur = data;
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
    if (!this.utilisateur.nom || !this.utilisateur.prenom || !this.utilisateur.email) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.utilisateurService.update(this.id, this.utilisateur).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Utilisateur modifié avec succès !';
        setTimeout(() => {
          this.router.navigate(['/utilisateurs']);
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