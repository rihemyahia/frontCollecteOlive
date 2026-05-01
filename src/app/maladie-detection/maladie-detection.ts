import { Component, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlantDiseaseService } from '../services/plant-disease';
import { SideBarResponsable } from '../sidebar-responsable/sidebar-responsable';
import { AuthService } from '../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-maladie-detection',
  standalone: true,
  imports: [CommonModule, SideBarResponsable],
  templateUrl: './maladie-detection.html',
  styleUrls: ['./maladie-detection.css']
})
export class MaladieDetectionComponent {
  imagePreview: string | null = null;
  isLoading = false;
  isLoadingModel = true;
  resultat: any = null;
  errorMessage = '';

  isSidebarCollapsed = false;
  isMobile = false;
  userRole: string = '';

  constructor(
      private router: Router  ,// ← AJOUTE CETTE LIGNE

    private diseaseService: PlantDiseaseService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) this.isSidebarCollapsed = false;
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }


  async ngOnInit() {
    this.userRole = this.authService.getUserRole();
    this.checkMobile();

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
      this.errorMessage = 'Erreur chargement modèle';
      this.isLoadingModel = false;
      this.cdr.detectChanges();
    }
  }
  // Ajoute cette méthode
signalerAlerte(): void {
  this.router.navigate(['/alertes/creer']);
}

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Veuillez sélectionner une image';
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
          this.errorMessage = 'Erreur lors de l\'analyse';
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

}
