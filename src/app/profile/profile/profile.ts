// src/app/profile/profile/profile.ts
import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { UtilisateurService } from '../../services/utilisateur';

interface UserProfile {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  role: string;
  photoProfile?: string;
}

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBarResponsable],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfilComponent implements OnInit {
selectedFile: File | null = null;
  isSidebarCollapsed = false;
  isMobile = false;
  userRole = '';

  profile: UserProfile = {
    id: '', email: '', nom: '', prenom: '',
    telephone: '', adresse: '', role: '', photoProfile: ''
  };

  isLoading = true;
  successMessage = '';
  errorMessage = '';

  showPasswordForm = false;
  passwordData = { ancienMotDePasse: '', nouveauMotDePasse: '', confirmMotDePasse: '' };
  isChangingPassword = false;

  // Photo upload state
  isUploadingPhoto = false;
  photoPreview: string | null = null; // Temporary preview before save

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private utilisateurService: UtilisateurService
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
        // If a photo is already saved, show it (no pending preview)
        this.photoPreview = null;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Load profile error:', err);
        this.errorMessage = 'Erreur lors du chargement du profil';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ========== PHOTO HANDLING ==========

  /** Returns the URL/base64 to display in the avatar: pending preview or saved photo. */
  get displayPhoto(): string | null {
    return this.photoPreview || this.profile.photoProfile || null;
  }

  /** Called when user picks a file from the file input. Converts to base64 and shows preview. */
  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validate type
    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Veuillez sélectionner une image (JPG, PNG, etc.)';
      return;
    }

    // Validate size (max 2 MB)
    if (file.size > 2 * 1024 * 1024) {
      this.errorMessage = 'La photo ne doit pas dépasser 2 Mo';
      return;
    }

    this.photoPreview = URL.createObjectURL(file);
this.selectedFile = file;
this.errorMessage = '';
this.cdr.detectChanges();
  }

  /** Sends the pending photo preview to the backend and persists it. */
  savePhoto(): void {
  if (!this.selectedFile) return;

  this.isUploadingPhoto = true;
  this.errorMessage = '';

  this.utilisateurService.updateMyPhoto(this.selectedFile).subscribe({
    next: (res: any) => {
      // backend returns Cloudinary URL
      this.profile.photoProfile = res.photoProfile;

      this.photoPreview = null;
      this.selectedFile = null;

      this.isUploadingPhoto = false;
      this.successMessage = 'Photo de profil mise à jour ✅';
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      user.photoProfile = res.photoProfile;
      localStorage.setItem('currentUser', JSON.stringify(user));

      // Notify components in the same tab (storage event won't fire there)
      window.dispatchEvent(new Event('profile-updated'));

      setTimeout(() => this.successMessage = '', 3000);
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('❌ Photo upload error:', err);
      this.errorMessage = 'Erreur lors de l\'upload Cloudinary';
      this.isUploadingPhoto = false;
      this.cdr.detectChanges();
    }
  });
}

  /** Cancels pending photo preview without saving. */
  cancelPhotoPreview(): void {
    this.photoPreview = null;
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  // ========== PROFILE UPDATE ==========

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
          adresse: this.profile.adresse,
          photoProfile: this.profile.photoProfile
        });
        localStorage.setItem('currentUser', JSON.stringify(user));
        window.dispatchEvent(new Event('profile-updated'));
      } catch (e) {}
    }
  }

  // ========== PASSWORD ==========

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

  cancelPasswordChange(): void {
    this.showPasswordForm = false;
    this.passwordData = { ancienMotDePasse: '', nouveauMotDePasse: '', confirmMotDePasse: '' };
    this.errorMessage = '';
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}