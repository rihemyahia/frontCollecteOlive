// src/app/admin/creer-utilisateur/creer-utilisateur.ts
import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UtilisateurService, Utilisateur } from '../../services/utilisateur';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { VergerMapComponent } from '../../shared/verger-map/verger-map';  // ← ADD THIS

@Component({
  selector: 'app-creer-utilisateur',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBarResponsable, VergerMapComponent],  // ← ADD VergerMapComponent
  templateUrl: './creer-utilisateur.html',
  styleUrls: ['./creer-utilisateur.css']
})
export class CreerUtilisateur {
  isSidebarCollapsed = false;
  isMobile = false;
  userRole = 'ADMIN';
  submitted: boolean = false;

  utilisateur: Utilisateur = {
    nom: '',
    prenom: '',
    telephone: '',
    adresse: '',
    email: '',
    role: 'ADMIN',
    estActif: true
  };

  // Champs communs

  // Champs transporteur
  permis: string = '';
  tarifKm: number | null = null;
  anneesExperience: number | null = null;
  disponibleTransport: boolean = true;

  // Champs agriculteur

  // Champs travailleur
  cin: string = '';
  dateEmbauche: string = '';
  salaire: number | null = null;
  statutEmploye: string = 'SAISONNIER';
  selectedSpecialites: string[] = [];

  // Champs responsable pressoir
  pressoirNom: string = '';
  pressoirAdresse: string = '';
  pressoirTelephone: string = '';
  pressoirEmail: string = '';
  pressoirCapaciteJournaliere: string = '';
  pressoirHoraires: string = '';
  pressoirLatitude: number | null = null;
  pressoirLongitude: number | null = null;
  pressoirAdresseIndicative: string = '';
// Add these with the other pressoir properties (around line 60-70)
pressoirHoraireDebut: string = '';
pressoirHoraireFin: string = '';
  specialites: string[] = ['cueillette', 'tamisage', 'secouage', 'ramassage', 'tri'];
  statuts: string[] = ['SAISONNIER', 'PERMANENT'];

  generatedPassword: string = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  roles = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'RESPONSABLE', label: 'Responsable' },
    { value: 'TRANSPORTEUR', label: 'Transporteur' },
    { value: 'AGRICULTEUR', label: 'Agriculteur' },
    { value: 'TRAVAILLEUR', label: 'Travailleur' },
    { value: 'RESPONSABLE_PRESSOIR', label: 'Responsable de pressoir' }
  ];

  constructor(
    private utilisateurService: UtilisateurService,
    public router: Router
  ) {
    this.loadUserRole();
    this.checkMobile();
    this.generatePassword();

    // Date d'embauche par défaut = aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    this.dateEmbauche = today;
  }

  // ====================== GESTION DE LA CARTE POUR PRESSOIR ======================
  onPressoirLocationSelected(event: { lat: number; lng: number; address?: string }) {
    this.pressoirLatitude = event.lat;
    this.pressoirLongitude = event.lng;
    this.pressoirAdresseIndicative = event.address || '';

    // Auto-fill the pressoir address if not already filled
    if (!this.pressoirAdresse && event.address) {
      this.pressoirAdresse = event.address;
    }
  }

  loadUserRole(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userRole = user.role?.toUpperCase() || 'ADMIN';
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

  generatePassword(): void {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%^&*';
    const allChars = uppercase + lowercase + digits + special;

    let password = '';
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += digits.charAt(Math.floor(Math.random() * digits.length));
    password += special.charAt(Math.floor(Math.random() * special.length));

    for (let i = 4; i < 12; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    this.generatedPassword = password.split('').sort(() => 0.5 - Math.random()).join('');
  }

  onSpecialiteChange(event: any, specialite: string): void {
    if (event.target.checked) {
      this.selectedSpecialites.push(specialite);
    } else {
      const index = this.selectedSpecialites.indexOf(specialite);
      if (index > -1) {
        this.selectedSpecialites.splice(index, 1);
      }
    }
  }

  prepareUtilisateur(): void {
    this.utilisateur.nom = this.utilisateur.nom;
    this.utilisateur.prenom = this.utilisateur.prenom;
    this.utilisateur.email = this.utilisateur.email;
    this.utilisateur.telephone = this.utilisateur.telephone;
    this.utilisateur.adresse = this.utilisateur.adresse;
    this.utilisateur.estActif = true;
    this.utilisateur.compteActif = true;
    this.utilisateur.motDePasse = this.generatedPassword;
    // FORCER LE RÔLE EN MAJUSCULE
    this.utilisateur.role = this.utilisateur.role.toUpperCase();

    switch (this.utilisateur.role) {
      case 'RESPONSABLE':
        this.utilisateur.datePrisePoste = new Date();
        break;
      case 'RESPONSABLE_PRESSOIR':
  this.utilisateur.pressoir = {
    nom: this.pressoirNom,
    adresse: this.pressoirAdresse,
    telephone: this.pressoirTelephone || undefined,
    email: this.pressoirEmail || undefined,
    capaciteJournaliere: this.pressoirCapaciteJournaliere || undefined,
    // Option 1: Use separate debut/fin if backend has them
    horaireDebut: this.pressoirHoraireDebut || undefined,
    horaireFin: this.pressoirHoraireFin || undefined,
    // Option 2: Or combine them into horaires string
    horaires: (this.pressoirHoraireDebut && this.pressoirHoraireFin)
      ? `${this.pressoirHoraireDebut} - ${this.pressoirHoraireFin}`
      : undefined,
    actif: true,
    geolocalisation: (this.pressoirLatitude && this.pressoirLongitude) ? {
      latitude: this.pressoirLatitude,
      longitude: this.pressoirLongitude,
      adresseIndicative: this.pressoirAdresseIndicative || undefined
    } : undefined
  };
  this.utilisateur.disponible = true;
  this.utilisateur.dateAffectation = new Date();
  break;
      case 'TRANSPORTEUR':
        this.utilisateur.permis = this.permis;
        this.utilisateur.tarifKm = this.tarifKm || undefined;
        this.utilisateur.anneesExperience = this.anneesExperience || undefined;
        this.utilisateur.disponibleTransport = this.disponibleTransport;
        break;
      case 'TRAVAILLEUR':
        this.utilisateur.cin = this.cin;
        this.utilisateur.specialites = this.selectedSpecialites;
        this.utilisateur.dateEmbauche = this.dateEmbauche ? new Date(this.dateEmbauche) : new Date();
        this.utilisateur.salaire = this.salaire || undefined;
        this.utilisateur.statutEmploye = this.statutEmploye;
        this.utilisateur.collectesAssignees = [];
        break;

    case 'RESPONSABLE_PRESSOIR':
  this.utilisateur.pressoir = {
    nom: this.pressoirNom,
    adresse: this.pressoirAdresse,
    telephone: this.pressoirTelephone || undefined,
    email: this.pressoirEmail || undefined,
    capaciteJournaliere: this.pressoirCapaciteJournaliere || undefined,
    horaireDebut: this.pressoirHoraireDebut || undefined,
    horaireFin: this.pressoirHoraireFin || undefined,
    actif: true,
    geolocalisation: (this.pressoirLatitude && this.pressoirLongitude) ? {
      latitude: this.pressoirLatitude,
      longitude: this.pressoirLongitude,
      adresseIndicative: this.pressoirAdresseIndicative || undefined
    } : undefined
  };
  break;
      default:
        break;
    }
  }

  navigateToUtilisateurs(): void {
    this.router.navigate(['/utilisateurs']);
  }

  onSubmit(): void {
    // Validation commune
    if (!this.utilisateur.nom || !this.utilisateur.prenom || !this.utilisateur.email) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }
    this.submitted = true;

    if (!this.generatedPassword) {
      this.errorMessage = 'Veuillez générer un mot de passe';
      return;
    }

    // Validation TRANSPORTEUR
    if (this.utilisateur.role === 'TRANSPORTEUR') {
      if (!this.permis) {
        this.errorMessage = 'Le permis est requis pour un transporteur';
        return;
      }
      if (!this.tarifKm) {
        this.errorMessage = 'Le tarif au km est requis pour un transporteur';
        return;
      }
    }

    // Validation RESPONSABLE_PRESSOIR
    if (this.utilisateur.role === 'RESPONSABLE_PRESSOIR') {
      if (!this.pressoirNom) {
        this.errorMessage = 'Le nom du pressoir est requis';
        return;
      }
      if (!this.pressoirAdresse) {
        this.errorMessage = 'L\'adresse du pressoir est requise';
        return;
      }
    }

    // Validation TRAVAILLEUR
    if (this.utilisateur.role === 'TRAVAILLEUR') {
      if (!this.cin) {
        this.errorMessage = 'Le CIN est requis pour un travailleur';
        return;
      }
      if (this.cin.length !== 8) {
        this.errorMessage = 'Le CIN doit contenir exactement 8 chiffres';
        return;
      }
      if (!this.salaire) {
        this.errorMessage = 'Le salaire est requis pour un travailleur';
        return;
      }
      if (this.salaire < 30 || this.salaire > 100) {
        this.errorMessage = 'Le salaire doit être entre 30 et 100 DT';
        return;
      }
      if (!this.dateEmbauche) {
        this.errorMessage = 'La date d\'embauche est requise';
        return;
      }
      if (this.selectedSpecialites.length === 0) {
        this.errorMessage = 'Veuillez sélectionner au moins une spécialité';
        return;
      }
    }

    this.prepareUtilisateur();

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    console.log('📤 Envoi utilisateur:', JSON.stringify(this.utilisateur, null, 2));

    this.utilisateurService.creerUtilisateurParAdmin(this.utilisateur).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = '✅ Utilisateur créé avec succès ! Un email avec le mot de passe a été envoyé.';
        setTimeout(() => {
          this.router.navigate(['/utilisateurs']);
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('❌ Erreur:', err);

        const errorBody = err.error?.message || err.error?.error || '';
        if (errorBody.includes('duplicate key') && errorBody.includes('email')) {
          this.errorMessage = '❌ Cet email existe déjà. Veuillez utiliser une adresse email différente.';
        }
        else if (errorBody.includes('duplicate key') && errorBody.includes('cin')) {
          this.errorMessage = '❌ Ce CIN existe déjà. Un travailleur avec ce numéro de CIN est déjà enregistré.';
        }
        else {
          this.errorMessage = err.error?.message || err.error?.error || 'Erreur lors de la création';
        }
      }
    });
  }
}
