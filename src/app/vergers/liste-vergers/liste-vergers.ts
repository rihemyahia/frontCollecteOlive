import { AuthService } from './../../services/auth';
import { Component, OnInit, HostListener, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VergerService } from '../../services/verger';
import { AIPredictionService } from '../../services/ai-prediction';
import { VergerResponse } from '../../models/verger';
import { StatutVerger } from '../../models/enums/statut-verger';
import { StatutVergerLabelPipe } from '../../shared/pipes/statut-verger-label-pipe';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';

@Component({
  selector: 'app-liste-vergers',
  standalone: true,
  imports: [CommonModule, FormsModule, StatutVergerLabelPipe, SideBarResponsable],
  templateUrl: './liste-vergers.html',
  styleUrl: './liste-vergers.css'
})
export class ListeVergersComponent implements OnInit {

  vergers: VergerResponse[] = [];
  filteredVergers: VergerResponse[] = [];
  searchTerm = '';
  isLoading = false;
  errorMessage = '';
  StatutVerger = StatutVerger;

  // Stocker les prédictions IA
  predictions: Map<string, any> = new Map();
  isLoadingPredictions = false;

  // 🔥 NOUVEAU : Variables pour le modal de prédiction détaillée
  selectedPrediction: any = null;
  selectedVergerId: string = '';
  selectedVergerNom: string = '';
  showPredictionModal: boolean = false;
  isLoadingPrediction: boolean = false;

  isSidebarCollapsed = false;
  isMobile = false;
  userRole: string = '';

  constructor(
    private vergerService: VergerService,
    private aiPredictionService: AIPredictionService,
    public router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) this.isSidebarCollapsed = false;
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    this.checkMobile();
    this.loadVergers();
  }

  trackById(index: number, item: VergerResponse): string {
    return item.id;
  }

  loadVergers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    const role = this.authService.getUserRole();

    const obs = (role === 'AGRICULTEUR')
      ? this.vergerService.getByAgriculteur(this.authService.getUserId())
      : this.vergerService.getAll();

    obs.subscribe({
      next: data => {
        this.vergers = [...data];
        this.filteredVergers = [...data];
        this.isLoading = false;
        this.cdr.detectChanges();
        this.loadPredictions();
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Charger les prédictions pour tous les vergers
  loadPredictions(): void {
    this.isLoadingPredictions = true;
    this.aiPredictionService.getToutesPredictions().subscribe({
      next: (data) => {
        data.forEach(pred => {
          this.predictions.set(pred.vergerId, pred);
        });
        this.isLoadingPredictions = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement prédictions:', err);
        this.isLoadingPredictions = false;
      }
    });
  }

  // Récupérer la prédiction d'un verger
  getPrediction(vergerId: string): any {
    return this.predictions.get(vergerId);
  }

  // Style pour le niveau d'urgence
  getUrgenceClass(urgence: string): string {
    switch(urgence) {
      case 'ELEVEE': return 'badge-danger';
      case 'MOYENNE': return 'badge-warning';
      default: return 'badge-info';
    }
  }

  // 🔥 NOUVEAU : Ouvre le modal avec la prédiction détaillée
  voirPrediction(vergerId: string, vergerNom: string): void {
    this.selectedVergerId = vergerId;
    this.selectedVergerNom = vergerNom;
    this.showPredictionModal = true;
    this.isLoadingPrediction = true;

    this.aiPredictionService.getPredictionByVerger(vergerId).subscribe({
      next: (data) => {
        this.selectedPrediction = data;
        this.isLoadingPrediction = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement prédiction:', err);
        this.isLoadingPrediction = false;
      }
    });
  }

  // 🔥 NOUVEAU : Ferme le modal
  closeModal(): void {
    this.showPredictionModal = false;
    this.selectedPrediction = null;
    this.selectedVergerId = '';
    this.selectedVergerNom = '';
  }

  // 🔥 NOUVEAU : Rafraîchit la prédiction
  refreshPrediction(vergerId: string): void {
    this.isLoadingPrediction = true;
    this.aiPredictionService.getPredictionByVerger(vergerId).subscribe({
      next: (data) => {
        this.selectedPrediction = data;
        this.isLoadingPrediction = false;
        // Mettre à jour aussi dans la Map
        this.predictions.set(vergerId, data);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur actualisation:', err);
        this.isLoadingPrediction = false;
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredVergers = this.vergers.filter(v =>
      v.agriculteurNom.toLowerCase().includes(term) ||
      v.typeOlive.toLowerCase().includes(term) ||
      (v.statut || '').toString().toLowerCase().includes(term)
    );
    this.cdr.detectChanges();
  }

  private searchTimeout: any;
  applyFilterDebounced(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.applyFilter(), 300);
  }

  getStatutCount(statut: StatutVerger): number {
    return this.filteredVergers.filter(v => v.statut === statut).length;
  }

  supprimer(id: string): void {
    if (!confirm('Supprimer ce verger ?')) return;
    this.vergerService.desactiver(id).subscribe({
      next: () => this.loadVergers(),
      error: () => {
        this.errorMessage = 'Erreur lors de la suppression.';
        this.cdr.detectChanges();
      }
    });
  }

  changerStatut(id: string, statut: StatutVerger): void {
    this.vergerService.changerStatut(id, statut).subscribe({
      next: () => this.loadVergers(),
      error: () => {
        this.errorMessage = 'Erreur lors du changement de statut.';
        this.cdr.detectChanges();
      }
    });
  }

  getStatutClass(statut: StatutVerger): string {
    return ({
      [StatutVerger.NON_RECOLTE]: 'badge-warning',
      [StatutVerger.EN_COURS]:    'badge-info',
      [StatutVerger.RECOLTE]:     'badge-success'
    } as Record<string, string>)[statut] ?? '';
  }

  isResponsableOrAdmin(): boolean {
    return this.userRole === 'RESPONSABLE' || this.userRole === 'ADMIN';
  }
}
