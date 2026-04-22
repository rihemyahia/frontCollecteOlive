import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import {
  AlerteService,
  AlerteResponse,
  NiveauUrgence,
  StatutAlerte,
  TypeAlerte
} from '../../services/alerte';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-modifier-alerte',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBarResponsable],
  templateUrl: './modifier-alerte.html',
  styleUrl: './modifier-alerte.css'
})
export class ModifierAlerteComponent implements OnInit, OnDestroy {
  alerte: AlerteResponse | null = null;
  isLoading = true;
  isUpdatingStatus = false;
  isUpdatingCriticality = false;
  isMarkingTreated = false;
  isDeleting = false;
  errorMessage = '';

  isSidebarCollapsed = false;
  isMobile = false;
  userRole = '';
  isAdmin = false;

  newStatut: StatutAlerte | '' = '';
  newUrgence: NiveauUrgence | '' = '';
  treatmentComment = '';

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

  readonly statutOptions = [
    { value: 'EN_ATTENTE', label: '⏳ En attente', color: '#F59E0B' },
    { value: 'EN_COURS', label: '🔄 En cours', color: '#3B82F6' },
    { value: 'TRAITEE', label: '✅ Traitée', color: '#10B981' }
  ];

  readonly urgenceOptions = [
    { value: 'FAIBLE', label: '🟢 Faible', color: '#10B981' },
    { value: 'MOYENNE', label: '🟡 Moyenne', color: '#F59E0B' },
    { value: 'ELEVEE', label: '🔴 Élevée', color: '#EF4444' },
    { value: 'CRITIQUE', label: '🚨 Critique', color: '#991B1B' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private alerteService: AlerteService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    this.isAdmin = this.userRole === 'ADMIN';
    this.handleResize();

    const alerteId = this.route.snapshot.paramMap.get('id');
    if (!alerteId) {
      this.errorMessage = 'Identifiant d\'alerte invalide.';
      this.isLoading = false;
      return;
    }
    this.loadAlerte(alerteId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  @HostListener('window:resize')
  handleResize(): void {
    this.isMobile = window.innerWidth < 768;
  }

  loadAlerte(id: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    const endpoint$ = this.isAdmin
      ? this.alerteService.getById(id)
      : this.alerteService.getAlertDetailResponsable(id);

    endpoint$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.alerte = data;
        this.newStatut = data.statut;
        this.newUrgence = data.niveauUrgence;
        this.treatmentComment = data.commentaireTraitement || '';
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading alerte:', err);
        this.errorMessage = 'Impossible de charger cette alerte.';
        this.isLoading = false;
      }
    });
  }

  backToList(): void {
    this.router.navigate(['/alertes/gestion']);
  }

  changeStatus(): void {
    if (!this.alerte || !this.newStatut || this.newStatut === this.alerte.statut) return;

    this.isUpdatingStatus = true;
    const endpoint$ = this.isAdmin
      ? this.alerteService.changeStatut(this.alerte.id, this.newStatut as StatutAlerte)
      : this.alerteService.changerStatutResponsable(this.alerte.id, this.newStatut as StatutAlerte);

    endpoint$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (updated) => {
        this.alerte = updated;
        this.newStatut = updated.statut;
        this.isUpdatingStatus = false;
        alert('Statut mis à jour avec succès');
      },
      error: (err) => {
        console.error('Error changing status:', err);
        this.isUpdatingStatus = false;
        alert('Erreur lors de la mise à jour du statut');
      }
    });
  }

  changeCriticality(): void {
    if (!this.alerte || !this.newUrgence || this.newUrgence === this.alerte.niveauUrgence) return;

    this.isUpdatingCriticality = true;
    const endpoint$ = this.isAdmin
      ? this.alerteService.changeUrgence(this.alerte.id, this.newUrgence as NiveauUrgence)
      : this.alerteService.changerUrgenceResponsable(this.alerte.id, this.newUrgence as NiveauUrgence);

    endpoint$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (updated) => {
        this.alerte = updated;
        this.newUrgence = updated.niveauUrgence;
        this.isUpdatingCriticality = false;
        alert('Criticité mise à jour avec succès');
      },
      error: (err) => {
        console.error('Error changing urgency:', err);
        this.isUpdatingCriticality = false;
        alert('Erreur lors de la mise à jour de la criticité');
      }
    });
  }

  markAsTreated(): void {
    if (!this.alerte || !this.treatmentComment.trim()) {
      alert('Veuillez entrer un commentaire de traitement');
      return;
    }

    this.isMarkingTreated = true;
    const endpoint$ = this.isAdmin
      ? this.alerteService.markAsProcessed(this.alerte.id, this.treatmentComment)
      : this.alerteService.marquerTraiteeResponsable(this.alerte.id, this.treatmentComment);

    endpoint$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (updated) => {
        this.alerte = updated;
        this.newStatut = updated.statut;
        this.treatmentComment = updated.commentaireTraitement || '';
        this.isMarkingTreated = false;
        alert('Alerte marquée comme traitée');
      },
      error: (err) => {
        console.error('Error marking as treated:', err);
        this.isMarkingTreated = false;
        alert('Erreur lors du traitement de l\'alerte');
      }
    });
  }

  deleteAlerte(): void {
    if (!this.alerte) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette alerte ?')) return;

    this.isDeleting = true;
    this.alerteService.delete(this.alerte.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isDeleting = false;
        alert('Alerte supprimée avec succès');
        this.backToList();
      },
      error: (err) => {
        console.error('Error deleting alert:', err);
        this.isDeleting = false;
        alert('Erreur lors de la suppression de l\'alerte');
      }
    });
  }

  getTypeLabel(type: TypeAlerte): string {
    const item = this.typesAlerte.find(t => t.value === type);
    return item ? item.label : type;
  }

  getStatutLabel(statut: StatutAlerte): string {
    const item = this.statutOptions.find(s => s.value === statut);
    return item ? item.label : statut;
  }

  getStatutColor(statut: StatutAlerte): string {
    const item = this.statutOptions.find(s => s.value === statut);
    return item ? item.color : '#6B7280';
  }

  getUrgenceLabel(urgence: NiveauUrgence): string {
    const item = this.urgenceOptions.find(u => u.value === urgence);
    return item ? item.label : urgence;
  }

  getUrgenceColor(urgence: NiveauUrgence): string {
    const item = this.urgenceOptions.find(u => u.value === urgence);
    return item ? item.color : '#6B7280';
  }

  formatCoordinate(value: number | undefined | null): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return 'N/A';
    }
    return value.toFixed(5);
  }
}
