// src/app/admin/creer-utilisateur/creer-utilisateur.ts
import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UtilisateurService, Utilisateur } from '../../services/utilisateur';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';

@Component({
  selector: 'app-creer-utilisateur',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBarResponsable],
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

  fonction: string = '';
  permis: string = '';
  tarifKm: number | null = null;
  anneesExperience: number | null = null;
  disponibleTransport: boolean = true;

  generatedPassword: string = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  roles = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'RESPONSABLE', label: 'Responsable' },
    { value: 'TRANSPORTEUR', label: 'Transporteur' }
  ];

  constructor(
    private utilisateurService: UtilisateurService,
    public router: Router
  ) {
    this.loadUserRole();
    this.checkMobile();
    this.generatePassword();
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

  copyPassword(): void {
    navigator.clipboard.writeText(this.generatedPassword);
    alert('Mot de passe copié !');
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
        this.utilisateur.fonction = this.fonction;
        this.utilisateur.datePrisePoste = new Date();
        break;
      case 'TRANSPORTEUR':
        this.utilisateur.permis = this.permis;
        this.utilisateur.tarifKm = this.tarifKm || undefined;
        this.utilisateur.anneesExperience = this.anneesExperience || undefined;
        this.utilisateur.disponibleTransport = this.disponibleTransport;
        break;
      default:
        break;
    }
  }
navigateToUtilisateurs(): void {
    this.router.navigate(['/utilisateurs']);
  }
  onSubmit(): void {
    if (!this.utilisateur.nom || !this.utilisateur.prenom || !this.utilisateur.email) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }
  this.submitted = true;

    if (!this.generatedPassword) {
      this.errorMessage = 'Veuillez générer un mot de passe';
      return;
    }

    if (this.utilisateur.role === 'RESPONSABLE' && !this.fonction) {
      this.errorMessage = 'La fonction est requise pour un responsable';
      return;
    }

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
        this.errorMessage = err.error?.message || err.error?.error || 'Erreur lors de la création';
      }
    });
  }

}
