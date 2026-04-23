import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { UtilisateurService, Utilisateur } from '../../services/utilisateur';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';

@Component({
  selector: 'app-liste-utilisateurs',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBarResponsable],
  templateUrl: './liste-utilisateurs.html',
  styleUrls: ['./liste-utilisateurs.css']
})
export class ListeUtilisateurs implements OnInit {

  filteredUtilisateurs: Utilisateur[] = [];
  utilisateursActifs: Utilisateur[] = [];
  utilisateursDesactives: Utilisateur[] = [];
  activeTab: string = 'actifs';
  selectedRole: string = 'tous';
  searchTerm: string = ''; // Nouvelle propriété pour la recherche
  utilisateurs: Utilisateur[] = [];
  isLoading = false;
  errorMessage = '';

  isSidebarCollapsed = false;
  isMobile = false;
  userRole = '';
successMessage="";
  showEditForm = false;
  editUtilisateur: Utilisateur | null = null;

  roles = ['ADMIN', 'RESPONSABLE', 'TRANSPORTEUR', 'AGRICULTEUR', 'TRAVAILLEUR'];

  filterRoles = [
    { value: 'tous', label: 'Tous les rôles', icon: 'bi-people-fill' },
    { value: 'ADMIN', label: 'Admin', icon: 'bi-shield-lock-fill' },
    { value: 'RESPONSABLE', label: 'Responsable', icon: 'bi-briefcase-fill' },
    { value: 'TRANSPORTEUR', label: 'Transporteur', icon: 'bi-truck' },
    { value: 'AGRICULTEUR', label: 'Agriculteur', icon: 'bi-tree-fill' },
    { value: 'TRAVAILLEUR', label: 'Travailleur', icon: 'bi-person-badge-fill' }
  ];

  constructor(
    private utilisateurService: UtilisateurService,
    public router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkMobile();
    this.loadUserRole();
    this.loadUtilisateurs();
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.isSidebarCollapsed = false;
    }
  }


// Méthode pour supprimer un utilisateur
supprimerUtilisateur(id: string | undefined): void {
  if (!id) {
    console.error('ID utilisateur non fourni');
    return;
  }

  // Confirmation avant suppression
  const confirmMessage = '⚠️ Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ?\n\nCette action est irréversible.';

  if (!confirm(confirmMessage)) {
    return;
  }

  this.isLoading = true;
  this.errorMessage = '';

  // Appel direct à la méthode delete du service
  this.utilisateurService.delete(id).subscribe({
    next: () => {
      // Suppression réussie
      console.log('Utilisateur supprimé avec succès');
      this.isLoading = false;

      // Recharger la liste des utilisateurs
      this.loadUtilisateurs();

      // Optionnel: Afficher un message de succès
      this.showSuccessMessage('Utilisateur supprimé avec succès');
      this.cdr.markForCheck();
    },
    error: (err) => {
      // Gestion des erreurs
      console.error('Erreur lors de la suppression:', err);

      // Extraire le message d'erreur
      let errorMsg = 'Erreur lors de la suppression de l\'utilisateur';
      if (err.error?.message) errorMsg = err.error.message;
      else if (err.error?.error) errorMsg = err.error.error;
      else if (typeof err.error === 'string') errorMsg = err.error;
      else if (err.message) errorMsg = err.message;

      this.errorMessage = errorMsg;
      this.isLoading = false;
      this.cdr.markForCheck();

      // Masquer l'erreur après 5 secondes
      setTimeout(() => {
        this.errorMessage = '';
        this.cdr.markForCheck();
      }, 5000);
    }
  });
}

// Méthode utilitaire pour afficher un message de succès temporaire
private showSuccessMessage(message: string): void {
  this.successMessage = message;
  this.cdr.markForCheck();

  setTimeout(() => {
    this.successMessage = '';
    this.cdr.markForCheck();
  }, 3000);
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

  loadUtilisateurs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.utilisateurService.getAll().subscribe({
      next: (data) => {
        this.utilisateurs = data || [];
        this.filterUtilisateurs();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erreur lors du chargement:', err);
        this.errorMessage = 'Erreur lors du chargement des utilisateurs';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  filterUtilisateurs(): void {
    // Filtrer par statut (actif/désactivé)
    let filteredByStatus: Utilisateur[] = [];

    switch(this.activeTab) {
      case 'actifs':
        filteredByStatus = this.utilisateurs.filter(u => u.compteActif === true);
        break;
      case 'desactives':
        filteredByStatus = this.utilisateurs.filter(u => u.compteActif === false);
        break;
      case 'tous':
      default:
        filteredByStatus = this.utilisateurs;
        break;
    }

    // Filtrer par rôle
    if (this.selectedRole !== 'tous') {
      filteredByStatus = filteredByStatus.filter(u => u.role === this.selectedRole);
    }

    // Filtrer par recherche (nom, prénom, email, téléphone)
    if (this.searchTerm.trim() !== '') {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filteredByStatus = filteredByStatus.filter(u =>
        u.nom?.toLowerCase().includes(searchLower) ||
        u.prenom?.toLowerCase().includes(searchLower) ||
        u.email?.toLowerCase().includes(searchLower) ||
        u.telephone?.toLowerCase().includes(searchLower) ||
        (u.nom + ' ' + u.prenom).toLowerCase().includes(searchLower) ||
        (u.prenom + ' ' + u.nom).toLowerCase().includes(searchLower)
      );
    }

    this.filteredUtilisateurs = filteredByStatus;

    // Mettre à jour les compteurs pour les onglets
    this.utilisateursActifs = this.utilisateurs.filter(u => u.compteActif === true);
    this.utilisateursDesactives = this.utilisateurs.filter(u => u.compteActif === false);
  }

  changeTab(tab: string): void {
    this.activeTab = tab;
    this.filterUtilisateurs();
  }

  changeRoleFilter(role: string): void {
    this.selectedRole = role;
    this.filterUtilisateurs();
  }

  onSearchChange(): void {
    this.filterUtilisateurs();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filterUtilisateurs();
  }

  desactiverCompte(id: string): void {
    if (!confirm('⚠️ Voulez-vous vraiment désactiver ce compte ? L\'utilisateur ne pourra plus se connecter.')) {
      return;
    }

    this.isLoading = true;
    this.utilisateurService.desactiverCompte(id).subscribe({
      next: () => {
        this.loadUtilisateurs();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors de la désactivation:', err);
        this.errorMessage = 'Erreur lors de la désactivation du compte';
        this.isLoading = false;
      }
    });
  }


  reactiverCompte(id: string): void {
    if (!confirm('⚠️ Voulez-vous vraiment réactiver ce compte ? L\'utilisateur pourra à nouveau se connecter.')) {
      return;
    }

    this.isLoading = true;
    this.utilisateurService.reactiverCompte(id).subscribe({
      next: () => {
        this.loadUtilisateurs();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors de la réactivation:', err);
        this.errorMessage = 'Erreur lors de la réactivation du compte';
        this.isLoading = false;
      }
    });
  }
  goToCreateUser(): void {
    this.router.navigate(['/creer-utilisateur']);
  }

  goToModifierUtilisateur(id: string): void {
    this.router.navigate([`/utilisateurs/modifier/${id}`]);
  }

  prepareEditUtilisateur(u: Utilisateur): void {
    this.editUtilisateur = { ...u };
    this.showEditForm = true;
  }

  updateUtilisateur(): void {
    if (!this.editUtilisateur?.id) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.utilisateurService.update(this.editUtilisateur.id, this.editUtilisateur).subscribe({
      next: () => {
        this.showEditForm = false;
        this.loadUtilisateurs();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erreur lors de la modification';
        this.isLoading = false;
      }
    });
  }

  deleteUtilisateur(id: string | undefined): void {
    if (!id) return;
    if (!confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return;

    this.utilisateurService.delete(id).subscribe({
      next: () => this.loadUtilisateurs(),
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erreur lors de la suppression';
      }
    });
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  navigateToCreateUser(): void {
    this.router.navigate(['/utilisateurs/creer']);
  }

  // ========== MÉTHODES UTILITAIRES POUR L'AFFICHAGE ==========

  getRoleIcon(role: string): string {
    const icons: { [key: string]: string } = {
      'ADMIN': 'bi-shield-lock-fill',
      'RESPONSABLE': 'bi-briefcase-fill',
      'TRANSPORTEUR': 'bi-truck',
      'AGRICULTEUR': 'bi-tree-fill',
      'TRAVAILLEUR': 'bi-person-badge-fill'
    };
    return icons[role] || 'bi-person-fill';
  }

  getAvatarColor(role: string): string {
    const colors: { [key: string]: string } = {
      'ADMIN': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'RESPONSABLE': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'TRANSPORTEUR': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'AGRICULTEUR': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'TRAVAILLEUR': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    };
    return colors[role] || 'linear-gradient(135deg, #A8B84B 0%, #C8D880 100%)';
  }

  getRoleLabel(roleValue: string): string {
    const role = this.filterRoles.find(r => r.value === roleValue);
    return role ? role.label : roleValue;
  }

  getRoleCount(role: string): number {
    if (role === 'tous') {
      return this.filteredUtilisateurs.length;
    }
    return this.filteredUtilisateurs.filter(u => u.role === role).length;
  }
}""
