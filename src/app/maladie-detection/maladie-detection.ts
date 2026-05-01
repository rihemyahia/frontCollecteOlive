// src/app/maladie-detection/maladie-detection.ts
import { Component, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SideBarResponsable } from '../sidebar-responsable/sidebar-responsable';
import { PlantDiseaseService } from '../services/plant-disease';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-maladie-detection',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBarResponsable],
  templateUrl: './maladie-detection.html',
  styleUrls: ['./maladie-detection.css']
})
export class MaladieDetectionComponent {
  imagePreview: string | null = null;
  isLoading = false;
  isLoadingModel = true;
  resultat: any = null;
  errorMessage = '';
  
  // UI State
  isSidebarCollapsed = false;
  isMobile = false;
  userRole = '';
  user: any = {};
  currentSeason = 'Printemps 2026';

  constructor(
    private diseaseService: PlantDiseaseService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    this.loadUser();
    this.checkMobile();
    this.userRole = this.authService.getUserRole();
    
    console.log('🚀 Initialisation du composant');
    this.isLoadingModel = true;
    this.cdr.detectChanges();

    try {
      await this.diseaseService.chargerModele();
      this.isLoadingModel = false;
      this.cdr.detectChanges();
      console.log('✅ Modèle prêt, affichage de l\'upload');
    } catch (error) {
      console.error('❌ Erreur:', error);
      this.errorMessage = 'Erreur chargement modèle IA';
      this.isLoadingModel = false;
      this.cdr.detectChanges();
    }
  }

  loadUser(): void {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try { 
        this.user = JSON.parse(stored); 
        this.userRole = this.user.role?.toUpperCase() || 'ADMIN'; 
      } catch (_) { 
        this.userRole = 'ADMIN'; 
      }
    }
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile && this.isSidebarCollapsed) {
      this.isSidebarCollapsed = false;
    }
    this.cdr.detectChanges();
  }

  toggleSidebar(val?: boolean): void {
    this.isSidebarCollapsed = val !== undefined ? val : !this.isSidebarCollapsed;
    this.cdr.detectChanges();
  }

  navigate(path: string): void { 
    this.router.navigate([path]); 
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Veuillez sélectionner une image valide (JPG, PNG)';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage = 'L\'image ne doit pas dépasser 10 Mo';
      return;
    }

    // Aperçu
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);

    // Détection
    this.isLoading = true;
    this.resultat = null;
    this.errorMessage = '';
    this.cdr.detectChanges();

    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = async () => {
        try {
          const predictions = await this.diseaseService.detecterAnomalie(img);
          this.resultat = this.diseaseService.analyserResultat(predictions);
        } catch (err) {
          this.errorMessage = 'Erreur lors de l\'analyse de l\'image';
          console.error(err);
        } finally {
          this.isLoading = false;
          this.cdr.detectChanges();
          URL.revokeObjectURL(objectUrl);
        }
      };

      img.onerror = () => {
        this.errorMessage = 'Impossible de charger l\'image';
        this.isLoading = false;
        this.cdr.detectChanges();
        URL.revokeObjectURL(objectUrl);
      };

      img.src = objectUrl;
    } catch (error) {
      this.errorMessage = 'Erreur lors de l\'analyse';
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  resetDetection() {
    this.imagePreview = null;
    this.resultat = null;
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  formatConfidence(confidence: number): string {
    return confidence.toFixed(1);
  }
}