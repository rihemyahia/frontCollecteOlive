// src/app/travailleurs/creer-travailleur/creer-travailleur.ts
import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TravailleurService, InscriptionTravailleurDTO } from '../../services/travailleur';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';

@Component({
  selector: 'app-creer-travailleur',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SideBarResponsable],
  templateUrl: './creer-travailleur.html',
  styleUrls: ['./creer-travailleur.css']
})
export class CreerTravailleur {
  inscriptionForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  // Propriétés pour la sidebar
  isSidebarCollapsed = false;
  isMobile = false;
  userRole: string = '';

  specialites = ['cueillette', 'tamisage', 'secouage', 'ramassage', 'tri'];
  statuts = ['SAISONNIER', 'PERMANENT'];
  selectedSpecialites: string[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private travailleurService: TravailleurService
  ) {
    this.inscriptionForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      telephone: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      adresse: ['', Validators.required],
      cin: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      dateEmbauche: ['', Validators.required],
      salaire: ['', [Validators.required, Validators.min(30), Validators.max(100)]],
      statutEmploye: ['', Validators.required]
    });

    this.loadUserRole();
    this.checkMobile();
    console.log('🎯 Composant CreerTravailleur initialisé');
  }

  loadUserRole(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userRole = user.role?.toUpperCase() || '';
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.isSidebarCollapsed = false;
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  onSpecialiteChange(event: any, specialite: string): void {
    console.log('🔄 Spécialité changée:', specialite, 'Checked:', event.target.checked);
    if (event.target.checked) {
      this.selectedSpecialites.push(specialite);
    } else {
      const index = this.selectedSpecialites.indexOf(specialite);
      if (index > -1) {
        this.selectedSpecialites.splice(index, 1);
      }
    }
    console.log('📋 Spécialités sélectionnées:', this.selectedSpecialites);
  }

  testClick(): void {
    console.log('🖱️ Bouton cliqué!');
    console.log('Formulaire valide:', this.inscriptionForm.valid);
    console.log('Spécialités:', this.selectedSpecialites.length);
    console.log('Erreurs formulaire:', this.inscriptionForm.errors);
    Object.keys(this.inscriptionForm.controls).forEach(key => {
      const control = this.inscriptionForm.get(key);
      if (control?.invalid) {
        console.log(`❌ Champ ${key} invalide:`, control.errors);
      }
    });
  }
onSubmit(): void {
  console.log('🚀 Formulaire soumis');
  console.log('📝 Valeurs du formulaire:', this.inscriptionForm.value);
  console.log('📋 Spécialités:', this.selectedSpecialites);

  if (this.inscriptionForm.invalid) {
    console.error('❌ Formulaire invalide');
    console.log('📊 Erreurs:', this.inscriptionForm.errors);
    this.errorMessage = 'Veuillez remplir tous les champs obligatoires correctement';
    return;
  }

  if (this.selectedSpecialites.length === 0) {
    console.error('❌ Aucune spécialité sélectionnée');
    this.errorMessage = 'Veuillez sélectionner au moins une spécialité';
    return;
  }

  this.isLoading = true;
  this.successMessage = '';
  this.errorMessage = '';

  const data: InscriptionTravailleurDTO = {
    email: this.inscriptionForm.value.email,
    prenom: this.inscriptionForm.value.prenom,
    nom: this.inscriptionForm.value.nom,
    telephone: this.inscriptionForm.value.telephone,
    adresse: this.inscriptionForm.value.adresse,
    cin: this.inscriptionForm.value.cin,
    specialites: this.selectedSpecialites,
    dateEmbauche: new Date(this.inscriptionForm.value.dateEmbauche),
    salaire: this.inscriptionForm.value.salaire,
    statutEmploye: this.inscriptionForm.value.statutEmploye,
    role: 'EQUIPE_RECOLTE'
  };

  console.log('📤 Données à envoyer:', JSON.stringify(data, null, 2));

  this.travailleurService.create(data).subscribe({
    next: (response) => {
      console.log('✅ Succès! Réponse:', response);
      this.successMessage = 'Travailleur inscrit avec succès. En attente d\'activation par l\'administrateur.';
      this.inscriptionForm.reset();
      this.selectedSpecialites = [];
      this.isLoading = false;

      // Optionnel : rediriger après 2 secondes
      setTimeout(() => {
        this.router.navigate(['/travailleurs']);
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
      else if (errorMessage.includes('duplicate key') && errorMessage.includes('cin')) {
        this.errorMessage = '❌ Ce CIN existe déjà. Un travailleur avec ce numéro de CIN est déjà enregistré.';
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
        this.errorMessage = '❌ Erreur lors de l\'inscription: ' + (err.error?.message || 'Veuillez réessayer plus tard.');
      }

      this.isLoading = false;
    }
  });
}
}
