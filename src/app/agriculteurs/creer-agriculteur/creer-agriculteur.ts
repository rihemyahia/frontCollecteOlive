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
  }
  onSubmit(): void {
    if (this.inscriptionForm.invalid) {
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
      nomExploitation: this.inscriptionForm.value.nomExploitation
         , role: 'AGRICULTEUR'  // AJOUTEZ CETTE LIGNE - en MAJUSCULES

    };

    this.agriculteurService.create(data).subscribe({
      next: () => {
        
        this.successMessage = 'Agriculteur inscrit avec succès. En attente d\'activation par l\'administrateur.';
        this.inscriptionForm.reset();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.errorMessage = err.error?.message || 'Erreur lors de l\'inscription';
        this.isLoading = false;
      }
    });
  }
}
