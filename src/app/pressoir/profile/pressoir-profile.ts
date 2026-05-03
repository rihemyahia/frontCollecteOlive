// src/app/profile/pressoir-profile/pressoir-profile.ts
import { AfterViewInit, Component, HostListener, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
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
export class PressoirProfileComponent implements OnInit, AfterViewInit {
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
  
  // Phone validation errors
  phoneError = '';
  pressoirPhoneError = '';
  
  // Photo upload state
  selectedFile: File | null = null;
  photoPreview: string | null = null;
  private wasMobile = false;
  
  constructor(
    private pressoirService: PressoirService,
    private authService: AuthService,
    private utilisateurService: UtilisateurService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole() || 'RESPONSABLE_PRESSOIR';
    this.checkMobile();
    this.loadProfile();
  }

  ngAfterViewInit(): void {
    this.refreshLayout();
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;

    if (this.isMobile) {
      this.isSidebarCollapsed = true;
    } else if (this.wasMobile) {
      this.isSidebarCollapsed = false;
    }

    this.wasMobile = this.isMobile;
  }

  toggleSidebar(collapsed?: boolean): void {
    this.isSidebarCollapsed = typeof collapsed === 'boolean' ? collapsed : !this.isSidebarCollapsed;
    this.refreshLayout();
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

  // ==================== TUNISIAN PHONE NUMBER VALIDATION ====================
  
  /**
   * Validates Tunisian phone numbers
   * Formats accepted:
   * - 12345678 (8 digits)
   * - 12 345 678 (with spaces)
   * - 12-345-678 (with hyphens)
   * - +216 12345678 (with international prefix)
   * - 00216 12345678 (with international prefix)
   * - 98 123 456 / 98-123-456 / 98123456 (any 8-digit number)
   */
  validateTunisianPhoneNumber(phone: string): boolean {
    if (!phone) return true; // Empty is allowed (optional field)
    
    // Remove all spaces, hyphens, and dots for validation
    const cleaned = phone.replace(/[\s\-\.]/g, '');
    
    // Pattern 1: Local 8-digit number (starts with 2,5,9,4,7)
    // Tunisian mobile prefixes: 2x, 5x, 9x, 4x, 7x
    const localPattern = /^[24579][0-9]{7}$/;
    
    // Pattern 2: International format +216XXXXXXXX
    const internationalPattern = /^\+216[24579][0-9]{7}$/;
    
    // Pattern 3: Double zero international format 00216XXXXXXXX
    const doubleZeroPattern = /^00216[24579][0-9]{7}$/;
    
    if (localPattern.test(cleaned)) {
      return true;
    }
    if (internationalPattern.test(cleaned)) {
      return true;
    }
    if (doubleZeroPattern.test(cleaned)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Formats a Tunisian phone number to a readable format
   * Example: 12345678 -> 12 345 678
   */
  formatTunisianPhoneNumber(phone: string): string {
    if (!phone) return phone;
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // If it's an 8-digit number, format as XX XXX XXX
    if (digits.length === 8) {
      return `${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5, 8)}`;
    }
    
    // If it's a +216 number
    if (digits.length === 11 && digits.startsWith('216')) {
      const localDigits = digits.substring(3);
      if (localDigits.length === 8) {
        return `+216 ${localDigits.substring(0, 2)} ${localDigits.substring(2, 5)} ${localDigits.substring(5, 8)}`;
      }
    }
    
    // If it's a 00216 number
    if (digits.length === 12 && digits.startsWith('00216')) {
      const localDigits = digits.substring(5);
      if (localDigits.length === 8) {
        return `+216 ${localDigits.substring(0, 2)} ${localDigits.substring(2, 5)} ${localDigits.substring(5, 8)}`;
      }
    }
    
    return phone;
  }
  
  /**
   * Get error message for invalid phone number
   */
  getPhoneErrorMessage(): string {
    return 'Numéro de téléphone tunisien invalide. Formats acceptés: 12345678, 12 345 678, +216 12345678';
  }

  // ==================== VALIDATION METHODS ====================
  
  validatePhone(): void {
    const phone = this.formData.telephone;
    if (phone && !this.validateTunisianPhoneNumber(phone)) {
      this.phoneError = this.getPhoneErrorMessage();
    } else {
      this.phoneError = '';
      // Auto-format the phone number if valid
      if (phone && this.validateTunisianPhoneNumber(phone)) {
        this.formData.telephone = this.formatTunisianPhoneNumber(phone);
      }
    }
  }
  
  validatePressoirPhone(): void {
    const phone = this.formData.pressoirTelephone;
    if (phone && !this.validateTunisianPhoneNumber(phone)) {
      this.pressoirPhoneError = this.getPhoneErrorMessage();
    } else {
      this.pressoirPhoneError = '';
      if (phone && this.validateTunisianPhoneNumber(phone)) {
        this.formData.pressoirTelephone = this.formatTunisianPhoneNumber(phone);
      }
    }
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
        this.refreshLayout();
      },
      error: (err) => {
        console.error('❌ Load profile error:', err);
        this.errorMessage = err?.error?.error || err?.error?.message || 'Erreur lors du chargement du profil';
        this.isLoading = false;
        this.cdr.detectChanges();
        this.refreshLayout();
      }
    });
  }

  save(): void {
    // Validate phone numbers before saving
    this.validatePhone();
    this.validatePressoirPhone();
    
    if (this.phoneError || this.pressoirPhoneError) {
      this.errorMessage = 'Veuillez corriger les erreurs de numéro de téléphone avant d\'enregistrer.';
      return;
    }
    
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
        this.refreshLayout();
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

  private refreshLayout(): void {
    if (typeof window === 'undefined' || typeof requestAnimationFrame === 'undefined') return;

    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    });
  }
}