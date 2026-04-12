import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UtilisateurService, Utilisateur } from '../../services/utilisateur';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';

@Component({
  selector: 'app-modifier-utilisateur',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBarResponsable],
  templateUrl: './modifier-utilisateur.html',
  styleUrls: ['./modifier-utilisateur.css']
})
export class ModifierUtilisateur implements OnInit {

  // Sidebar properties
  isSidebarCollapsed = false;
  isMobile = false;
  userRole = '';

  utilisateur: Utilisateur = {
    id: '',
    nom: '',
    prenom: '',
    telephone: '',
    adresse: '',
    email: '',
    role: 'AGRICULTEUR',
    estActif: true,
    compteActif: true
  };

  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  id: string = '';

  showPasswordForm = false;
  passwordData = {
    nouveauMotDePasse: '',
    confirmMotDePasse: ''
  };
  isChangingPassword = false;

  roles = ['ADMIN', 'RESPONSABLE', 'AGRICULTEUR', 'TRAVAILLEUR', 'TRANSPORTEUR'];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private utilisateurService: UtilisateurService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkMobile();
    this.loadUserRole();

    this.route.params.subscribe(params => {
      this.id = params['id'];
      console.log('ID from route:', this.id);

      if (this.id && this.id !== 'undefined') {
        this.loadUtilisateur();
      } else {
        this.errorMessage = 'ID utilisateur invalide';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile && this.isSidebarCollapsed) {
      this.isSidebarCollapsed = false;
    }
  }

  loadUserRole(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        this.userRole = userData.role?.toUpperCase() || 'ADMIN';
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }

  loadUtilisateur(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.utilisateurService.getById(this.id).subscribe({
      next: (data) => {
        console.log('✅ User loaded successfully:', data);
        this.utilisateur = { ...this.utilisateur, ...data };
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error loading user:', err);
        this.errorMessage = 'Erreur lors du chargement: ' + (err.error?.message || err.message || 'Erreur inconnue');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (!this.utilisateur.nom || !this.utilisateur.prenom || !this.utilisateur.email) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      this.cdr.detectChanges();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.utilisateurService.update(this.id, this.utilisateur).subscribe({
      next: () => {
        this.successMessage = 'Utilisateur modifié avec succès !';
        this.isSaving = false;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.router.navigate(['/utilisateurs']);
        }, 1500);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de la modification';
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  changePassword(): void {
    if (this.passwordData.nouveauMotDePasse !== this.passwordData.confirmMotDePasse) {
      this.errorMessage = 'Les mots de passe ne correspondent pas';
      this.cdr.detectChanges();
      return;
    }
    if (this.passwordData.nouveauMotDePasse.length < 6) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      this.cdr.detectChanges();
      return;
    }

    this.isChangingPassword = true;
    this.errorMessage = '';

    this.utilisateurService.changerMotDePasseAdmin(this.id, this.passwordData.nouveauMotDePasse)
      .subscribe({
        next: () => {
          this.successMessage = 'Mot de passe changé avec succès !';
          this.isChangingPassword = false;
          this.showPasswordForm = false;
          this.passwordData = { nouveauMotDePasse: '', confirmMotDePasse: '' };
          this.cdr.detectChanges();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erreur lors du changement de mot de passe';
          this.isChangingPassword = false;
          this.cdr.detectChanges();
        }
      });
  }

  cancelPasswordChange(): void {
    this.showPasswordForm = false;
    this.passwordData = { nouveauMotDePasse: '', confirmMotDePasse: '' };
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}
