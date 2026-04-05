// src/app/agriculteurs/creer-agriculteur/creer-agriculteur.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AgriculteurService, InscriptionAgriculteurDTO } from '../../services/agriculteur';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';

@Component({
  selector: 'app-creer-agriculteur',
  standalone: true,
  imports: [CommonModule, SideBarResponsable,FormsModule, ReactiveFormsModule],
  templateUrl: './creer-agriculteur.html',
  styleUrls: ['./creer-agriculteur.css']
})
export class CreerAgriculteur {
 isSidebarCollapsed = false;
  userRole = 'RESPONSABLE';
  isMobile = false;
  inscriptionForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private agriculteurService: AgriculteurService
  ) {
    this.inscriptionForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      telephone: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      adresse: ['', Validators.required],
      nomExploitation: ['', [Validators.required, Validators.minLength(3)]]
    });
  }
toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }onSubmit(): void {
    console.log('🚀 Formulaire soumis');
    console.log('📝 Valeurs du formulaire:', this.inscriptionForm.value);

    if (this.inscriptionForm.invalid) {
      console.error('❌ Formulaire invalide');
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires correctement';
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const data: InscriptionAgriculteurDTO = {
      email: this.inscriptionForm.value.email,
      prenom: this.inscriptionForm.value.prenom,
      nom: this.inscriptionForm.value.nom,
      telephone: this.inscriptionForm.value.telephone,
      adresse: this.inscriptionForm.value.adresse,
      nomExploitation: this.inscriptionForm.value.nomExploitation,
      role: 'AGRICULTEUR'
    };

    console.log('📤 Données à envoyer:', JSON.stringify(data, null, 2));

    this.agriculteurService.create(data).subscribe({
      next: (response) => {
        console.log('✅ Succès! Réponse:', response);
        this.successMessage = 'Agriculteur inscrit avec succès. En attente d\'activation par l\'administrateur.';
        this.inscriptionForm.reset();
        this.isLoading = false;

        // Optionnel : rediriger après 2 secondes
        setTimeout(() => {
          this.router.navigate(['/agriculteurs']);
        }, 2000);
      },
      error: (err) => {
        console.error('❌ Erreur détaillée:', err);
        console.error('❌ Statut HTTP:', err.status);
        console.error('❌ Message d\'erreur:', err.message);
        console.error('❌ Corps de l\'erreur:', err.error);

        // Analyser le message d'erreur pour extraire l'information
        const errorBody = err.error?.error || err.error?.message || '';
        const errorMessage = errorBody.toString();

        // Vérifier le type d'erreur
        if (errorMessage.includes('duplicate key') && errorMessage.includes('email')) {
          this.errorMessage = '❌ Cet email existe déjà. Veuillez utiliser une adresse email différente.';
        }
        else if (err.status === 403) {
          this.errorMessage = '❌ Vous n\'êtes pas autorisé. Veuillez vous reconnecter.';
        }
        else if (err.status === 401) {
          this.errorMessage = '❌ Session expirée. Veuillez vous reconnecter.';
        }
        else if (err.status === 400 && errorMessage.includes('validation')) {
          this.errorMessage = '❌ Veuillez vérifier que tous les champs sont correctement remplis.';
        }
        else {
          this.errorMessage = err.error?.message || '❌ Erreur lors de l\'inscription. Veuillez réessayer.';
        }

        this.isLoading = false;
      }
    });
  }

}
