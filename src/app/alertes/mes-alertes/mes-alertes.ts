// mes-alertes.component.ts
import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule, LowerCasePipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlerteService, AlerteResponse, TypeAlerte, StatutAlerte, NiveauUrgence, PhaseCulturale } from '../../services/alerte';
import { VergerService } from '../../services/verger';
import { VergerResponse } from '../../models/verger';
import { AuthService } from '../../services/auth';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { RelativeDatePipe } from '../../shared/pipes/relative-date.pipe';
import { CreeAlerte } from '../cree-alerte/cree-alerte';

@Component({
  selector: 'app-mes-alertes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LowerCasePipe, SideBarResponsable, RelativeDatePipe, CreeAlerte],
  templateUrl: './mes-alertes.html',
  styleUrl: './mes-alertes.css'
})
export class MesAlertesComponent implements OnInit {

  alertes: AlerteResponse[] = [];
  mesVergers: VergerResponse[] = [];

  showForm = false;
  isLoading = true;

  isSidebarCollapsed = false;
  isMobile = false;
  userRole = '';
  agriculteurId = '';

  // Filter & Search
  searchQuery = '';
  hideResolved = false;
  selectedType: TypeAlerte | '' = '';
  selectedStatus: StatutAlerte | '' = '';
  selectedUrgence: NiveauUrgence | '' = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 5;

  // Urgence Info Popup
  showUrgenceInfo = false;

  // Computed filtered alerts
  get filteredAlertes(): AlerteResponse[] {
    let result = [...this.alertes];

    // Hide resolved alerts
    if (this.hideResolved) {
      result = result.filter(a => a.statut === 'EN_ATTENTE');
    }

    // Filter by type
    if (this.selectedType) {
      result = result.filter(a => a.type === this.selectedType);
    }

    // Filter by status
    if (this.selectedStatus) {
      result = result.filter(a => a.statut === this.selectedStatus);
    }

    // Filter by urgence
    if (this.selectedUrgence) {
      result = result.filter(a => a.niveauUrgence === this.selectedUrgence);
    }

    // Search by description and verger
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(a =>
        a.description.toLowerCase().includes(q) ||
        a.vergerTypeOlive?.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q)
      );
    }

    // Sort by urgence DESC (CRITIQUE first), then by date DESC
    return result.sort((a, b) => {
      const urgenceOrder: Record<NiveauUrgence, number> = {
        'CRITIQUE': 0,
        'ELEVEE': 1,
        'MOYENNE': 2,
        'FAIBLE': 3
      };
      const urgenceDiff = urgenceOrder[a.niveauUrgence] - urgenceOrder[b.niveauUrgence];
      if (urgenceDiff !== 0) return urgenceDiff;
      return new Date(b.dateSignalement).getTime() - new Date(a.dateSignalement).getTime();
    });
  }

  // Pagination
  get totalPages(): number {
    return Math.ceil(this.filteredAlertes.length / this.itemsPerPage) || 1;
  }

  get paginatedAlertes(): AlerteResponse[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredAlertes.slice(start, end);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.hideResolved = false;
    this.selectedType = '';
    this.selectedStatus = '';
    this.selectedUrgence = '';
    this.currentPage = 1;
  }

  // Geolocation
  currentLatitude: number = 0;
  currentLongitude: number = 0;
  locationError: string = '';
  readonly typesAlerte = [
    { value: 'MATURITE', label: '🫒 Problème de maturité' },
    { value: 'MATURITE_ACCELEREE', label: '⏱️ Maturité accélérée' },
    { value: 'MALADIE', label: '🐛 Maladie' },
    { value: 'METEO', label: '⛈️ Dégât météorologique' },
    { value: 'RECOLTE', label: '🧺 Problème de récolte' },
    { value: 'CHUTE_PREMATUREE', label: '📉 Chute prématurée' },
    { value: 'NUISIBLE', label: '🦗 Ravageur / Nuisible' },
    { value: 'IRRIGATION', label: '💧 Problème d\'irrigation' },
    { value: 'QUALITE_HUILE', label: '🫒 Qualité d\'huile' },
    { value: 'RENDEMENT_ANORMAL', label: '📊 Rendement anormal' },
    { value: 'LOGISTIQUE_MOULIN', label: '🏭 Logistique moulin' },
    { value: 'SECURITE_RECOLTE', label: '⚠️ Sécurité récolte' },
    { value: 'AUTRE', label: '📌 Autre problème' }
  ];

  constructor(
    private cdr: ChangeDetectorRef,
    private alerteService: AlerteService,
    private vergerService: VergerService,
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

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    this.agriculteurId = this.authService.getUserId();
    this.checkMobile();
    console.log("👤 agriculteurId:", this.agriculteurId);
    this.loadData();
  }

  loadData(): void {
    if (!this.agriculteurId) {
      console.error('No agriculteurId, cannot load data');
      this.isLoading = false;
      return;
    }
    // Load own vergers for dropdown
    this.vergerService.getByAgriculteur(this.agriculteurId).subscribe({
      next: (data: VergerResponse[]) => {
        this.mesVergers = data.filter((v: VergerResponse) => !v.estSupprimer);
        this.cdr.markForCheck();
        console.log('✅ Vergers loaded:', this.mesVergers.length);
      },
      error: (err: any) => {
        console.error('❌ Error loading vergers:', err);
      }
    });
    
    // Load own alerts
    this.alerteService.getByAgriculteur(this.agriculteurId).subscribe({
      next: (data: AlerteResponse[]) => {
        this.alertes = data.sort((a, b) =>
          new Date(b.dateSignalement).getTime() - new Date(a.dateSignalement).getTime()
        );
        this.isLoading = false;
        this.cdr.markForCheck();
        console.log('✅ Alertes loaded:', this.alertes.length);
      },
      error: (err: any) => {
        console.error('❌ Error loading alerts:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  isInvalid(field: string): boolean {
    // Helper method for display only (kept for compatibility)
    return false;
  }

  // Event handlers from signaler-cree-alerte component
  onAlerteCreated(alerte: AlerteResponse): void {
    this.alertes.unshift(alerte);
    this.cdr.markForCheck();
  }

  onFormClosed(): void {
    this.showForm = false;
    this.cdr.markForCheck();
  }

  // Helper methods for display
  getTypeLabel(type: TypeAlerte): string {
    const found = this.typesAlerte.find(t => t.value === type);
    return found?.label || type;
  }

  getTypeIcon(type: TypeAlerte): string {
    const icons: Record<TypeAlerte, string> = {
      'MATURITE': '🫒',
      'MATURITE_ACCELEREE': '⏱️',
      'MALADIE': '🐛',
      'METEO': '⛈️',
      'RECOLTE': '🧺',
      'CHUTE_PREMATUREE': '📉',
      'NUISIBLE': '🦗',
      'IRRIGATION': '💧',
      'QUALITE_HUILE': '🫒',
      'RENDEMENT_ANORMAL': '📊',
      'LOGISTIQUE_MOULIN': '🏭',
      'SECURITE_RECOLTE': '⚠️',
      'AUTRE': '📌'
    };
    return icons[type] || '📌';
  }

  getStatutLabel(statut: StatutAlerte): string {
    const labels: Record<StatutAlerte, string> = {
      'EN_ATTENTE': 'En attente',
      'TRAITEE': 'Traitée',
      'IGNOREE': 'Ignorée'
    };
    return labels[statut] || statut;
  }

  getStatutClass(statut: StatutAlerte): string {
    const classes: Record<StatutAlerte, string> = {
      'EN_ATTENTE': 'statut-badge--pending',
      'TRAITEE': 'statut-badge--done',
      'IGNOREE': 'statut-badge--ignored'
    };
    return classes[statut] || '';
  }

  getStatutDotClass(statut: StatutAlerte): string {
    const classes: Record<StatutAlerte, string> = {
      'EN_ATTENTE': 'dot--warning',
      'TRAITEE': 'dot--success',
      'IGNOREE': 'dot--secondary'
    };
    return classes[statut] || '';
  }

  getNiveauUrgenceLabel(niveau: NiveauUrgence): string {
    const labels: Record<NiveauUrgence, string> = {
      'FAIBLE': 'Faible',
      'MOYENNE': 'Moyenne',
      'ELEVEE': 'Élevée',
      'CRITIQUE': 'Critique'
    };
    return labels[niveau] || niveau;
  }

  getUrgenceExplanation(alerte: AlerteResponse): string {
    const typeExplanations: Record<TypeAlerte, string> = {
      'SECURITE_RECOLTE': 'Sécurité de récolte - niveau critique par défaut',
      'MALADIE': 'Maladie - nécessite intervention rapide',
      'METEO': 'Dégât météorologique - impact immédiat',
      'MATURITE_ACCELEREE': 'Maturité accélérée - fenêtre de récolte étroite',
      'CHUTE_PREMATUREE': 'Chute prématurée - pertes potentielles importantes',
      'RENDEMENT_ANORMAL': 'Rendement anormal - problème de production',
      'MATURITE': 'Problème de maturité',
      'RECOLTE': 'Problème de récolte',
      'NUISIBLE': 'Ravageur/Nuisible - peut s\'étendre rapidement',
      'IRRIGATION': 'Problème d\'irrigation',
      'QUALITE_HUILE': 'Qualité d\'huile',
      'LOGISTIQUE_MOULIN': 'Logistique moulin',
      'AUTRE': 'Autre problème'
    };

    const phaseImpact = {
      'RECOLTE': ' Phase critique de récolte.',
      'PRE_RECOLTE': ' Pré-récolte - urgence augmentée.',
      'VERDAISON': ' Phase de maturité - attention accrue.',
      'FLORAISON': ' Phase de floraison - peut affecter la future récolte.',
      'NOUAISON': ' Phase de nouaison.',
      'INCONNUE': ''
    };

    const baseExplanation = typeExplanations[alerte.type] || 'Alerte signalée';
    const phaseInfo = phaseImpact[alerte.phase] || '';
    
    return `${baseExplanation}${phaseInfo}`;
  }

  getNiveauClass(niveau: NiveauUrgence): string {
    const classes: Record<NiveauUrgence, string> = {
      'FAIBLE': 'niveau--faible',
      'MOYENNE': 'niveau--moyen',
      'ELEVEE': 'niveau--eleve',
      'CRITIQUE': 'niveau--critique'
    };
    return classes[niveau] || '';
  }

  getPhaseLabel(phase: PhaseCulturale): string {
    const labels: Record<PhaseCulturale, string> = {
      'FLORAISON': 'Floraison',
      'NOUAISON': 'Nouaison',
      'VERDAISON': 'Verdaison',
      'PRE_RECOLTE': 'Pré-récolte',
      'RECOLTE': 'Récolte',
      'INCONNUE': 'Inconnue'
    };
    return labels[phase] || phase;
  }

  // Stats helpers
  getAlertesByStatut(statut: StatutAlerte): AlerteResponse[] {
    return this.alertes.filter(a => a.statut === statut);
  }

  getAlertesByNiveau(niveau: NiveauUrgence): AlerteResponse[] {
    return this.alertes.filter(a => a.niveauUrgence === niveau);
  }
}