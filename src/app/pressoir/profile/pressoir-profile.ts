import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { PressoirProfile, PressoirService } from '../../services/pressoir';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';

@Component({
  selector: 'app-pressoir-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBarResponsable],
  templateUrl: './pressoir-profile.html',
  styleUrls: ['../pressoir.css']
})
export class PressoirProfileComponent implements OnInit {
  isSidebarCollapsed = false;
  userRole = 'RESPONSABLE_PRESSOIR';
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  profile: PressoirProfile | null = null;
  formData: any = {};

  constructor(private pressoirService: PressoirService, private authService: AuthService) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole() || 'RESPONSABLE_PRESSOIR';
    this.loadProfile();
    this.checkMobile();
  }

  @HostListener('window:resize')
  checkMobile(): void {
    if (window.innerWidth < 768) this.isSidebarCollapsed = true;
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  loadProfile(): void {
    this.isLoading = true;
    this.pressoirService.getProfile().subscribe({
      next: profile => {
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
      },
      error: err => {
        this.errorMessage = err?.error?.error || err?.error?.message || 'Erreur lors du chargement du profil';
        this.isLoading = false;
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
      next: profile => {
        this.profile = profile;
        this.successMessage = 'Profil pressoir mis a jour avec succes';
        this.isSaving = false;
      },
      error: err => {
        this.errorMessage = err?.error?.error || err?.error?.message || 'Erreur lors de la mise a jour du profil';
        this.isSaving = false;
      }
    });
  }
}
