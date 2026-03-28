import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UtilisateurService, Utilisateur } from '../../services/utilisateur';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';

@Component({
  selector: 'app-liste-utilisateurs',
  standalone: true,
  imports: [CommonModule, RouterModule, SideBarResponsable, FormsModule],
  templateUrl: './liste-utilisateurs.html',
  styleUrls: ['./liste-utilisateurs.css']
})
export class ListeUtilisateurs implements OnInit {
  utilisateurs: Utilisateur[] = [];
  isLoading = true;
  errorMessage = '';
  isSidebarCollapsed = false;
  isMobile = false;
  userRole = '';
  showAddForm = false;
  newUtilisateur: Utilisateur = {
    nom: '',
    prenom: '',
    telephone: '',
    adresse: '',
    email: '',
    role: 'agriculteur',
    estActif: true,
    motDePasse: ''
  };
  editUtilisateur: Utilisateur | null = null;
  showEditForm = false;

  roles = ['admin', 'responsable', 'agriculteur', 'equipe_recolte', 'transporteur'];

  constructor(
    private utilisateurService: UtilisateurService,
    private cdr: ChangeDetectorRef,
    private router: Router
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
    const user = localStorage.getItem('currentUser');
    if (user) {
      try {
        const userData = JSON.parse(user);
        this.userRole = userData.role?.toUpperCase() || '';
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
        console.log('Utilisateurs reçus:', data);
        this.utilisateurs = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des utilisateurs:', err);
        this.errorMessage = 'Erreur lors du chargement des utilisateurs';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.newUtilisateur = {
        nom: '',
        prenom: '',
        telephone: '',
        adresse: '',
        email: '',
        role: 'agriculteur',
        estActif: true,
        motDePasse: ''
      };
    }
  }

  addUtilisateur(): void {
    if (!this.newUtilisateur.nom || !this.newUtilisateur.prenom || !this.newUtilisateur.email || !this.newUtilisateur.motDePasse) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.utilisateurService.create(this.newUtilisateur).subscribe({
      next: () => {
        this.loadUtilisateurs();
        this.showAddForm = false;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors de la création de l\'utilisateur:', err);
        this.errorMessage = 'Erreur lors de la création de l\'utilisateur';
        this.isLoading = false;
      }
    });
  }

  prepareEditUtilisateur(utilisateur: Utilisateur): void {
    this.editUtilisateur = { ...utilisateur };
    this.showEditForm = true;
  }

  updateUtilisateur(): void {
    if (!this.editUtilisateur) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.utilisateurService.update(this.editUtilisateur.id!, this.editUtilisateur).subscribe({
      next: () => {
        this.loadUtilisateurs();
        this.showEditForm = false;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors de la modification:', err);
        this.errorMessage = 'Erreur lors de la modification de l\'utilisateur';
        this.isLoading = false;
      }
    });
  }

  deleteUtilisateur(id: string | undefined): void {
    if (!id) return;

    if (confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) {
      this.utilisateurService.delete(id).subscribe({
        next: () => {
          this.loadUtilisateurs();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression:', err);
        }
      });
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}