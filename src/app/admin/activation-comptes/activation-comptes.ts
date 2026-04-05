// src/app/admin/activation-comptes/activation-comptes.ts
import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UtilisateurService, Utilisateur } from '../../services/utilisateur';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';

@Component({
  selector: 'app-activation-comptes',
  standalone: true,
  imports: [CommonModule, SideBarResponsable, FormsModule, ReactiveFormsModule],
  templateUrl: './activation-comptes.html',
  styleUrls: ['./activation-comptes.css']
})
export class ActivationComptes implements OnInit {
  activeTab: 'agriculteurs' | 'travailleurs' = 'agriculteurs';
  agriculteursEnAttente: Utilisateur[] = [];
  travailleursEnAttente: Utilisateur[] = [];
  isLoadingAgriculteurs = false;
  isLoadingTravailleurs = false;
  stats = { agriculteursEnAttente: 0, travailleursEnAttente: 0 };
  activationForm: FormGroup;
  selectedUser: any = null;
  selectedUserId: string | null = null;
  isMobile = false;
  selectedUserNom: string = '';
  selectedUserPrenom: string = '';
  selectedUserEmail: string = '';
  isActivating = false;
  successMessage = '';
  isSidebarCollapsed = false;
  errorMessage = '';
  generatedPassword: string = '';
  showEmailSent = false;
  emailSentTo = '';
  userRole: string = '';

  constructor(
    private utilisateurService: UtilisateurService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.activationForm = this.fb.group({
      nouveauMotDePasse: ['', [Validators.required, Validators.minLength(6)]],
      confirmerMotDePasse: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadStats();
    this.loadAgriculteursEnAttente();
    this.loadUserRole();
    this.checkMobile();
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

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('nouveauMotDePasse')?.value;
    const confirm = group.get('confirmerMotDePasse')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  loadStats(): void {
    this.utilisateurService.getStatsAttente().subscribe({
      next: (stats) => {
        this.stats = stats || { agriculteursEnAttente: 0, travailleursEnAttente: 0 };
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur stats:', err)
    });
  }

  loadAgriculteursEnAttente(): void {
    this.isLoadingAgriculteurs = true;
    this.utilisateurService.getAgriculteursEnAttente().subscribe({
      next: (data) => {
        this.agriculteursEnAttente = data || [];
        this.isLoadingAgriculteurs = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement agriculteurs:', err);
        this.isLoadingAgriculteurs = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadTravailleursEnAttente(): void {
    this.isLoadingTravailleurs = true;
    this.utilisateurService.getTravailleursEnAttente().subscribe({
      next: (data) => {
        this.travailleursEnAttente = data || [];
        this.isLoadingTravailleurs = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement travailleurs:', err);
        this.isLoadingTravailleurs = false;
        this.cdr.detectChanges();
      }
    });
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.isSidebarCollapsed = false;
    }
  }

  switchTab(tab: 'agriculteurs' | 'travailleurs'): void {
    this.activeTab = tab;
    this.closePanel();

    if (tab === 'agriculteurs' && this.agriculteursEnAttente.length === 0) {
      this.loadAgriculteursEnAttente();
    } else if (tab === 'travailleurs' && this.travailleursEnAttente.length === 0) {
      this.loadTravailleursEnAttente();
    }
  }

  openActivationPanel(user: Utilisateur): void {
    this.selectedUser = user;
    this.selectedUserId = user.id || null;
    this.selectedUserNom = user.nom || '';
    this.selectedUserPrenom = user.prenom || '';
    this.selectedUserEmail = user.email || '';
    this.activationForm.reset();
    this.successMessage = '';
    this.errorMessage = '';
    this.generatedPassword = '';
    this.showEmailSent = false;
    this.emailSentTo = '';
    this.cdr.detectChanges();
  }

  closePanel(): void {
    this.selectedUser = null;
    this.selectedUserId = null;
    this.selectedUserNom = '';
    this.selectedUserPrenom = '';
    this.selectedUserEmail = '';
    this.activationForm.reset();
    this.successMessage = '';
    this.errorMessage = '';
    this.generatedPassword = '';
    this.showEmailSent = false;
    this.emailSentTo = '';
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.closePanel();
  }

  generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  generateAndFillPassword(): void {
    this.generatedPassword = this.generateRandomPassword();
    this.activationForm.patchValue({
      nouveauMotDePasse: this.generatedPassword,
      confirmerMotDePasse: this.generatedPassword
    });
  }

  copyPassword(): void {
    navigator.clipboard.writeText(this.generatedPassword);
    alert('Mot de passe copié dans le presse-papier !');
  }

  activerCompte(): void {
    if (this.activationForm.invalid || !this.selectedUserId) return;

    this.isActivating = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.showEmailSent = false;

    const motDePasse = this.activationForm.get('nouveauMotDePasse')?.value;

    const activationObservable = this.activeTab === 'agriculteurs'
      ? this.utilisateurService.activerAgriculteur(this.selectedUserId, motDePasse)
      : this.utilisateurService.activerTravailleur(this.selectedUserId, motDePasse);

    activationObservable.subscribe({
      next: (response) => {
        this.successMessage = `Compte de ${this.selectedUserPrenom} ${this.selectedUserNom} activé avec succès !`;
        this.showEmailSent = true;
        this.emailSentTo = this.selectedUserEmail;
        this.isActivating = false;
        this.cdr.detectChanges();

        // Rafraîchir les listes
        if (this.activeTab === 'agriculteurs') {
          this.loadAgriculteursEnAttente();
        } else {
          this.loadTravailleursEnAttente();
        }
        this.loadStats();

        // Fermer le panel et réinitialiser
        this.closePanel();

        setTimeout(() => {
          this.successMessage = '';
          this.showEmailSent = false;
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        console.error('Erreur activation:', err);
        this.errorMessage = err.error?.message || 'Erreur lors de l\'activation du compte';
        this.isActivating = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}
