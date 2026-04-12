import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';

interface UserProfile {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  role: string;
}

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBarResponsable],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfilComponent implements OnInit {

  isSidebarCollapsed = false;
  isMobile = false;
  userRole = '';

  profile: UserProfile = {
    id: '',
    email: '',
    nom: '',
    prenom: '',
    telephone: '',
    adresse: '',
    role: ''
  };

  isLoading = true;
  successMessage = '';
  errorMessage = '';

  showPasswordForm = false;
  passwordData = {
    ancienMotDePasse: '',
    nouveauMotDePasse: '',
    confirmMotDePasse: ''
  };
  isChangingPassword = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkMobile();
    this.loadUserRole();
    this.loadProfile();
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) this.isSidebarCollapsed = false;
  }

  loadUserRole(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        this.userRole = JSON.parse(userStr).role?.toUpperCase() || 'TRAVAILLEUR';
      } catch (e) {}
    }
  }

  loadProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<UserProfile>('http://localhost:8080/api/profile', {
      headers: this.getHeaders()
    }).subscribe({
      next: (data) => {
        this.profile = { ...this.profile, ...data };
        this.isLoading = false;
        this.cdr.detectChanges();
        console.log('✅ Profile loaded successfully:', this.profile);
      },
      error: (err) => {
        console.error('❌ Load profile error:', err);
        this.errorMessage = 'Erreur lors du chargement du profil';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
updateProfile(): void {
  this.isLoading = true;
  this.successMessage = '';
  this.errorMessage = '';

  const updates = {
    nom: this.profile.nom,
    prenom: this.profile.prenom,
    telephone: this.profile.telephone,
    adresse: this.profile.adresse
  };

  this.http.put('http://localhost:8080/api/profile', updates, {
    headers: this.getHeaders()
  }).subscribe({
    next: () => {
      this.successMessage = 'Profil mis à jour avec succès ✅';
      this.updateLocalStorage();
      this.isLoading = false;

      // 👇 ADD THIS LINE - Redirect to dashboard after 1.5 seconds
      setTimeout(() => this.router.navigate(['/dashboard']), 1500);

      setTimeout(() => this.successMessage = '', 3000);
      this.cdr.detectChanges();
    },
    error: (err) => {
      this.errorMessage = err.error?.message || 'Erreur lors de la mise à jour';
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  });
}

  private updateLocalStorage(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        Object.assign(user, {
          nom: this.profile.nom,
          prenom: this.profile.prenom,
          telephone: this.profile.telephone,
          adresse: this.profile.adresse
        });
        localStorage.setItem('currentUser', JSON.stringify(user));
      } catch (e) {}
    }
  }

  changePassword(): void {
    if (this.passwordData.nouveauMotDePasse !== this.passwordData.confirmMotDePasse) {
      this.errorMessage = 'Les mots de passe ne correspondent pas';
      return;
    }
    if (this.passwordData.nouveauMotDePasse.length < 6) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      return;
    }

    this.isChangingPassword = true;
    this.errorMessage = '';

    this.http.post('http://localhost:8080/api/profile/changer-mot-de-passe',
      {
        ancienMotDePasse: this.passwordData.ancienMotDePasse,
        nouveauMotDePasse: this.passwordData.nouveauMotDePasse
      },
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => {
        this.successMessage = 'Mot de passe changé avec succès ✅';
        this.showPasswordForm = false;
        this.passwordData = { ancienMotDePasse: '', nouveauMotDePasse: '', confirmMotDePasse: '' };
        this.isChangingPassword = false;
        setTimeout(() => this.successMessage = '', 3000);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors du changement de mot de passe';
        this.isChangingPassword = false;
        this.cdr.detectChanges();
      }
    });
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  cancelPasswordChange(): void {
    this.showPasswordForm = false;
    this.passwordData = { ancienMotDePasse: '', nouveauMotDePasse: '', confirmMotDePasse: '' };
    this.errorMessage = '';
  }
}
