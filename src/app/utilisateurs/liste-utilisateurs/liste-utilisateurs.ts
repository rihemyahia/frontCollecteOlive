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

  utilisateurs: Utilisateur[] = [];
  isLoading = false;
  errorMessage = '';

  isSidebarCollapsed = false;
  isMobile = false;
  userRole = '';

  // Only for editing
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

  goToCreateUser(): void {
    this.router.navigate(['/creer-utilisateur']);   // ← Make sure this route exists in your routing
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
  // ou selon votre route: this.router.navigate(['/admin/creer-utilisateur']);
}
}
