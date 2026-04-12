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
  utilisateurs: Utilisateur[] = [];
  isLoading = false;
  errorMessage = '';

  isSidebarCollapsed = false;
  isMobile = false;
  userRole = '';

  showEditForm = false;
  editUtilisateur: Utilisateur | null = null;

  roles = ['ADMIN', 'RESPONSABLE', 'TRANSPORTEUR', 'AGRICULTEUR', 'TRAVAILLEUR'];

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
    this.utilisateursActifs = this.utilisateurs.filter(u => u.compteActif === true);
    this.utilisateursDesactives = this.utilisateurs.filter(u => u.compteActif === false);

    switch(this.activeTab) {
      case 'actifs':
        this.filteredUtilisateurs = this.utilisateursActifs;
        break;
      case 'desactives':
        this.filteredUtilisateurs = this.utilisateursDesactives;
        break;
      case 'tous':
      default:
        this.filteredUtilisateurs = this.utilisateurs;
        break;
    }
  }

  changeTab(tab: string): void {
    this.activeTab = tab;
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
}
