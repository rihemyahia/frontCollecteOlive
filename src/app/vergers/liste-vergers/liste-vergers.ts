// src/app/ressources/vergers/liste-vergers/liste-vergers.ts
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
import { HttpClient } from '@angular/common/http';
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
  paginatedVergers: VergerResponse[] = [];
  searchTerm = '';
  selectedStatus = '';
  isLoading = false;
  errorMessage = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  // Stocker les prédictions IA
  predictions: Map<string, any> = new Map();
  isLoadingPredictions = false;

  // Variables pour le modal de prédiction détaillée
  selectedPrediction: any = null;
  selectedVergerId: string = '';
  selectedVergerNom: string = '';
  showPredictionModal: boolean = false;
  isLoadingPrediction: boolean = false;

  // 🔥 NOUVEAU : Historique des collectes
  historiqueCollectes: Map<string, any[]> = new Map();
  isLoadingHistorique: boolean = false;

  isSidebarCollapsed = false;
  isMobile = false;
  userRole: string = '';

  constructor(
    private vergerService: VergerService,
    private aiPredictionService: AIPredictionService,
    public router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
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
          console.log('Vergers avec responsables:', this.vergers.map(v => ({
      id: v.id,
      nom: v.agriculteurNom,
      responsableNom: v.responsableNom,
      responsableEmail: v.responsableEmail,
      responsableFonction: v.responsableFonction
    })));
        this.applyFilter();
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

  loadPredictions(): void {
    this.isLoadingPredictions = true;
    this.aiPredictionService.getToutesPredictions().subscribe({
      next: (data) => {
        this.predictions.clear();
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

  getPrediction(vergerId: string): any {
    return this.predictions.get(vergerId);
  }

  // 🔥 Modifie cette méthode
loadHistoriqueCollectes(vergerId: string): void {
  this.isLoadingHistorique = true;

  // Utilise l'API collecte au lieu de verger/collectes
  // Assure-toi que l'URL correspond à ton backend
  const url = `http://localhost:8080/api/collectes/verger/${vergerId}`;

  this.http.get<any[]>(url, {
    headers: this.authService.getAuthHeaders()
  }).subscribe({
    next: (data) => {
      this.historiqueCollectes.set(vergerId, data);
      this.isLoadingHistorique = false;
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Erreur chargement historique:', err);
      this.isLoadingHistorique = false;
    }
  });
}

  // 🔥 Ouvrir le modal de prédiction détaillée avec historique
  voirPrediction(vergerId: string, vergerNom: string): void {
    this.selectedVergerId = vergerId;
    this.selectedVergerNom = vergerNom;
    this.showPredictionModal = true;
    this.isLoadingPrediction = true;

    // Charger la prédiction IA
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

    // 🔥 Charger l'historique des collectes
    this.loadHistoriqueCollectes(vergerId);
  }

  // 🔥 Fermer le modal
  closeModal(): void {
    this.showPredictionModal = false;
    this.selectedPrediction = null;
  }

  // 🔥 Rafraîchir la prédiction
  refreshPrediction(): void {
    this.isLoadingPrediction = true;
    this.aiPredictionService.getPredictionByVerger(this.selectedVergerId).subscribe({
      next: (data) => {
        this.selectedPrediction = data;
        this.predictions.set(this.selectedVergerId, data);
        this.isLoadingPrediction = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur actualisation:', err);
        this.isLoadingPrediction = false;
      }
    });
  }

  // 🔥 Calculer la moyenne historique
  getMoyenneHistorique(vergerId: string): number {
    const collectes = this.historiqueCollectes.get(vergerId) || [];
    if (collectes.length === 0) return 0;
    const total = collectes.reduce((sum, c) => sum + (c.quantiteTotaleKg || 0), 0);
    return total / collectes.length;
  }

  // 🔥 Trouver la meilleure année
  getMeilleureAnnee(vergerId: string): number {
    const collectes = this.historiqueCollectes.get(vergerId) || [];
    if (collectes.length === 0) return 0;
    return Math.max(...collectes.map(c => c.quantiteTotaleKg || 0));
  }

  // 🔥 Calculer la tendance
  getTendance(vergerId: string): string {
    const collectes = this.historiqueCollectes.get(vergerId) || [];
    if (collectes.length < 2) return 'stable';

    const sorted = [...collectes].sort((a, b) => {
      const anneeA = parseInt(a.annee);
      const anneeB = parseInt(b.annee);
      return anneeA - anneeB;
    });

    const dernier = sorted[sorted.length - 1]?.quantiteTotaleKg || 0;
    const avantDernier = sorted[sorted.length - 2]?.quantiteTotaleKg || 0;

    if (dernier > avantDernier * 1.1) return 'up';
    if (dernier < avantDernier * 0.9) return 'down';
    return 'stable';
  }

  getTendanceTexte(vergerId: string): string {
    const tendance = this.getTendance(vergerId);
    switch(tendance) {
      case 'up': return '📈 En hausse';
      case 'down': return '📉 En baisse';
      default: return '➡️ Stable';
    }
  }

  getTendanceClass(vergerId: string): string {
    const tendance = this.getTendance(vergerId);
    switch(tendance) {
      case 'up': return 'tendance-up';
      case 'down': return 'tendance-down';
      default: return 'tendance-stable';
    }
  }

  applyFilter(): void {
    let filtered = [...this.vergers];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(v =>
        v.agriculteurNom?.toLowerCase().includes(term) ||
        v.typeOlive?.toLowerCase().includes(term) ||
        (v.statut || '').toLowerCase().includes(term)
      );
    }

    if (this.selectedStatus) {
      filtered = filtered.filter(v => v.statut === this.selectedStatus);
    }

    this.filteredVergers = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredVergers.length / this.itemsPerPage) || 1;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedVergers = this.filteredVergers.slice(startIndex, endIndex);
    this.cdr.detectChanges();
  }

  applyFilterDebounced(): void {
    this.applyFilter();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.applyFilter();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  getStatutCount(statut: string): number {
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

  getStatutClass(statut: string): string {
    switch(statut) {
      case 'NON_RECOLTE': return 'badge-warning';
      case 'EN_COURS': return 'badge-info';
      case 'RECOLTE': return 'badge-success';
      default: return '';
    }
  }

  getStatutLabel(statut: string): string {
    switch(statut) {
      case 'NON_RECOLTE': return 'Non récolté';
      case 'EN_COURS': return 'En cours';
      case 'RECOLTE': return 'Récolté';
      default: return statut;
    }
  }

  getMaturiteColor(value: number): string {
    if (value < 40) return '#E8A838';
    if (value < 75) return '#A8B84B';
    return '#4A7A2A';
  }

  isResponsableOrAdmin(): boolean {
    return this.userRole === 'RESPONSABLE' || this.userRole === 'ADMIN';
  }
}
