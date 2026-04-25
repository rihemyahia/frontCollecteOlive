import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UtilisateurService, Utilisateur } from '../../services/utilisateur';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { VergerService } from '../../services/verger';
import { VergerResponse } from '../../models/verger';

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

  // Verger assignment (admin only)
  vergers: VergerResponse[] = [];
  selectedOwnedVergerIds: string[] = [];
  replaceVergers = true;
  vergerSearch = '';
  vergerPage = 1;
  vergerPageSize = 50;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private utilisateurService: UtilisateurService,
    private vergerService: VergerService,
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
        this.loadVergersForAssignments();
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
  getPaginationPages(): number[] {
    const total = this.totalVergerPages;
    const current = this.vergerPage;
   
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
   
    const pages: number[] = [];
    const addPage = (p: number) => {
      if (!pages.includes(p)) pages.push(p);
    };
    const addEllipsis = () => {
      const last = pages[pages.length - 1];
      if (last !== -1) pages.push(-1);
    };
   
    // Always show first 2
    addPage(1);
    addPage(2);
   
    // Left ellipsis
    if (current > 4) addEllipsis();
   
    // Pages around current
    for (let p = Math.max(3, current - 1); p <= Math.min(total - 2, current + 1); p++) {
      addPage(p);
    }
   
    // Right ellipsis
    if (current < total - 3) addEllipsis();
   
    // Always show last 2
    addPage(total - 1);
    addPage(total);
   
    return pages;
  }
  
  private loadVergersForAssignments(): void {
    this.vergerService.getAll().subscribe({
      next: (list) => {
        this.vergers = list || [];

        const role = (this.utilisateur.role || '').toUpperCase();
        if (role === 'AGRICULTEUR') {
          this.selectedOwnedVergerIds = this.vergers
            .filter(v => v.agriculteurId === this.utilisateur.id)
            .map(v => v.id);
        }

        this.vergerPage = 1;
        this.cdr.detectChanges();
      },
      error: () => {
        // Non-blocking: keep user edit form usable even if vergers fail to load
      }
    });
  }

  private norm(s: unknown): string {
    return String(s ?? '').toLowerCase().trim();
  }

  hasText(s: unknown): boolean {
    const v = String(s ?? '').toLowerCase().trim();
    return v.length > 0 && v !== 'null' && v !== 'null null' && v !== 'undefined';
  }
  

  get filteredVergers(): VergerResponse[] {
    const q = this.norm(this.vergerSearch);
    if (!q) return this.vergers;
    return this.vergers.filter(v => {
      const hay = [
        v.id,
        v.typeOlive,
        v.superficie,
        v.agriculteurNom,
        v.agriculteurEmail,
        v.responsableNom,
        v.responsableEmail
      ].map(x => this.norm(x)).join(' ');
      return hay.includes(q);
    });
  }

  get totalVergerPages(): number {
    return Math.max(1, Math.ceil(this.filteredVergers.length / this.vergerPageSize));
  }

  get pagedVergers(): VergerResponse[] {
    const start = (this.vergerPage - 1) * this.vergerPageSize;
    return this.filteredVergers.slice(start, start + this.vergerPageSize);
  }

  setVergerPage(p: number): void {
    const next = Math.min(this.totalVergerPages, Math.max(1, p));
    this.vergerPage = next;
  }

  getSelectedOwnedVergers(): VergerResponse[] {
    const set = new Set(this.selectedOwnedVergerIds);
    return this.vergers.filter(v => set.has(v.id));
  }

  toggleOwnedVerger(vergerId: string, checked: boolean): void {
    if (checked) {
      if (!this.selectedOwnedVergerIds.includes(vergerId)) this.selectedOwnedVergerIds.push(vergerId);
    } else {
      this.selectedOwnedVergerIds = this.selectedOwnedVergerIds.filter(id => id !== vergerId);
    }
  }

  onVergerSearchChange(): void {
    this.vergerPage = 1;
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

  // 1. D'abord, mettre à jour les informations de l'utilisateur
  this.utilisateurService.update(this.id, this.utilisateur).subscribe({
    next: () => {
      const role = (this.utilisateur.role || '').toUpperCase();

      const assign$ =
        role === 'AGRICULTEUR'
          ? this.utilisateurService.adminUpdateAgriculteur(this.id, {
              ownedVergerIds: this.selectedOwnedVergerIds,
              replaceOwnedVergers: this.replaceVergers
            })
          : null;

      // 2. Si un nouveau mot de passe a été saisi, le changer aussi
      if (this.passwordData.nouveauMotDePasse && this.passwordData.nouveauMotDePasse.trim() !== '') {
        // Vérifier que les mots de passe correspondent
        if (this.passwordData.nouveauMotDePasse !== this.passwordData.confirmMotDePasse) {
          this.errorMessage = 'Les mots de passe ne correspondent pas';
          this.isSaving = false;
          this.cdr.detectChanges();
          return;
        }
        if (this.passwordData.nouveauMotDePasse.length < 6) {
          this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
          this.isSaving = false;
          this.cdr.detectChanges();
          return;
        }

        // Changer le mot de passe
        this.utilisateurService.changerMotDePasseAdmin(this.id, this.passwordData.nouveauMotDePasse)
          .subscribe({
            next: () => {
              const afterAssignments = () => {
                this.successMessage = 'Utilisateur et mot de passe modifiés avec succès !';
                this.isSaving = false;
                this.showPasswordForm = false;
                this.passwordData = { nouveauMotDePasse: '', confirmMotDePasse: '' };
                this.cdr.detectChanges();
                setTimeout(() => {
                  this.router.navigate(['/utilisateurs']);
                }, 1500);
              };

              if (assign$) {
                assign$.subscribe({
                  next: () => afterAssignments(),
                  error: () => afterAssignments()
                });
              } else {
                afterAssignments();
              }
            },
            error: (err) => {
              this.errorMessage = 'Erreur lors du changement de mot de passe: ' + (err.error?.message || 'Erreur inconnue');
              this.isSaving = false;
              this.cdr.detectChanges();
            }
          });
      } else {
        const afterAssignments = () => {
          this.successMessage = 'Utilisateur modifié avec succès !';
          this.isSaving = false;
          this.cdr.detectChanges();
          setTimeout(() => {
            this.router.navigate(['/utilisateurs']);
          }, 1500);
        };

        if (assign$) {
          assign$.subscribe({
            next: () => afterAssignments(),
            error: () => afterAssignments()
          });
        } else {
          afterAssignments();
        }
      }
    },
    error: (err) => {
      this.errorMessage = err.error?.message || 'Erreur lors de la modification';
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  });
}
changePassword(): void {
  console.log('🔑=== DÉBUT changePassword() ===');
  console.log('📝 ID utilisateur:', this.id);
  console.log('📝 Nouveau mot de passe:', this.passwordData.nouveauMotDePasse);
  console.log('📝 Confirmation:', this.passwordData.confirmMotDePasse);

  if (this.passwordData.nouveauMotDePasse !== this.passwordData.confirmMotDePasse) {
    console.log('❌ Erreur: mots de passe non correspondants');
    this.errorMessage = 'Les mots de passe ne correspondent pas';
    this.cdr.detectChanges();
    return;
  }
  if (this.passwordData.nouveauMotDePasse.length < 6) {
    console.log('❌ Erreur: mot de passe trop court');
    this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
    this.cdr.detectChanges();
    return;
  }

  this.isChangingPassword = true;
  this.errorMessage = '';

  console.log('📤 Appel du service changerMotDePasseAdmin...');
  console.log('🔗 URL appelée:', `${this.utilisateurService['apiUrl']}/admin/changer-mot-de-passe/${this.id}`);

  this.utilisateurService.changerMotDePasseAdmin(this.id, this.passwordData.nouveauMotDePasse)
    .subscribe({
      next: (response) => {
        console.log('✅ Succès! Réponse:', response);
        this.successMessage = 'Mot de passe changé avec succès !';
        this.isChangingPassword = false;
        this.showPasswordForm = false;
        this.passwordData = { nouveauMotDePasse: '', confirmMotDePasse: '' };
        this.cdr.detectChanges();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('❌ Erreur complète:', err);
        console.error('❌ Statut:', err.status);
        console.error('❌ Message:', err.message);
        console.error('❌ Corps erreur:', err.error);
        this.errorMessage = err.error?.message || err.error?.error || 'Erreur lors du changement de mot de passe';
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
