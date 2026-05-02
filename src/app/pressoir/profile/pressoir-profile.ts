// src/app/profile/pressoir-profile/pressoir-profile.ts
import { Component, HostListener, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { PressoirProfile, PressoirService } from '../../services/pressoir';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { UtilisateurService } from '../../services/utilisateur';

@Component({
  selector: 'app-pressoir-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBarResponsable],
  templateUrl: './pressoir-profile.html',
  styleUrls: ['./pressoir-profile.css']
})
export class PressoirProfileComponent implements OnInit {
  isSidebarCollapsed = false;
  isMobile = false;
  userRole = 'RESPONSABLE_PRESSOIR';
  
  isLoading = false;
  isSaving = false;
  isUploadingPhoto = false;
  errorMessage = '';
  successMessage = '';
  
  profile: PressoirProfile | null = null;
  formData: any = {};
  
  // Photo upload state
  selectedFile: File | null = null;
  photoPreview: string | null = null;
  
  constructor(
    private pressoirService: PressoirService,
    private authService: AuthService,
    private utilisateurService: UtilisateurService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole() || 'RESPONSABLE_PRESSOIR';
    this.checkMobile();
    this.loadProfile();
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) this.isSidebarCollapsed = false;
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  /** Returns the URL/base64 to display in the avatar: pending preview or saved photo. */
  get displayPhoto(): string | null {
    return this.photoPreview || this.profile?.photoProfile || null;
  }

  /** Called when user picks a file from the file input. */
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

    this.selectedFile = file;
    this.photoPreview = URL.createObjectURL(file);
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  /** Saves the photo to the backend. */
  savePhoto(): void {
    if (!this.selectedFile) return;

    this.isUploadingPhoto = true;
    this.errorMessage = '';

    this.utilisateurService.updateMyPhoto(this.selectedFile).subscribe({
      next: (res: any) => {
        if (this.profile) {
          this.profile.photoProfile = res.photoProfile;
        }
        
        this.photoPreview = null;
        this.selectedFile = null;
        this.isUploadingPhoto = false;
        this.successMessage = 'Photo de profil mise à jour ✅';
        
        // Update localStorage
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        user.photoProfile = res.photoProfile;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Notify other components
        window.dispatchEvent(new Event('profile-updated'));
        
        setTimeout(() => this.successMessage = '', 3000);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Photo upload error:', err);
        this.errorMessage = 'Erreur lors de l\'upload de la photo';
        this.isUploadingPhoto = false;
        this.cdr.detectChanges();
      }
    });
  }

  /** Cancels pending photo preview without saving. */
  cancelPhotoPreview(): void {
    if (this.photoPreview) {
      URL.revokeObjectURL(this.photoPreview);
    }
    this.photoPreview = null;
    this.selectedFile = null;
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.pressoirService.getProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.formData = {
          prenom: profile.prenom || '',
          nom: profile.nom || '',
          telephone: profile.telephone || '',
          adresse: profile.adresse || '',
          disponible: !!profile.disponible,
          pressoirNom: profile.pressoir?.nom || '',
          pressoirAdresse: profile.pressoir?.adresse || '',
          pressoirTelephone: profile.pressoir?.telephone || '',
          pressoirEmail: profile.pressoir?.email || '',
          capaciteJournaliere: profile.pressoir?.capaciteJournaliere || '',
          horaires: profile.pressoir?.horaires || '',
          horaireDebut: profile.pressoir?.horaireDebut || '',
          horaireFin: profile.pressoir?.horaireFin || '',
          latitude: profile.pressoir?.geolocalisation?.latitude || null,
          longitude: profile.pressoir?.geolocalisation?.longitude || null
        };
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Load profile error:', err);
        this.errorMessage = err?.error?.error || err?.error?.message || 'Erreur lors du chargement du profil';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  save(): void {
    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    const payload = {
      prenom: this.formData.prenom,
      nom: this.formData.nom,
      telephone: this.formData.telephone,
      adresse: this.formData.adresse,
      disponible: this.formData.disponible,
      pressoirNom: this.formData.pressoirNom,
      pressoirAdresse: this.formData.pressoirAdresse,
      pressoirTelephone: this.formData.pressoirTelephone,
      pressoirEmail: this.formData.pressoirEmail,
      capaciteJournaliere: this.formData.capaciteJournaliere,
      horaires: this.formData.horaires,
      horaireDebut: this.formData.horaireDebut,
      horaireFin: this.formData.horaireFin,
      geolocalisation: {
        latitude: Number(this.formData.latitude),
        longitude: Number(this.formData.longitude)
      }
    };

    this.pressoirService.updateProfile(payload).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.successMessage = 'Profil pressoir mis à jour avec succès ✅';
        this.updateLocalStorage();
        this.isSaving = false;
        setTimeout(() => this.successMessage = '', 3000);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Update error:', err);
        this.errorMessage = err?.error?.error || err?.error?.message || 'Erreur lors de la mise à jour du profil';
        this.isSaving = false;
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
          nom: this.formData.nom,
          prenom: this.formData.prenom,
          telephone: this.formData.telephone,
          adresse: this.formData.adresse
        });
        localStorage.setItem('currentUser', JSON.stringify(user));
        window.dispatchEvent(new Event('profile-updated'));
      } catch (e) {}
    }
  }

  reloadProfile(): void {
    this.loadProfile();
  }
}