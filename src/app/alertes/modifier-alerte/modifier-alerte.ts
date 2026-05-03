// src/app/alertes/modifier-alerte/modifier-alerte.component.ts
import { Component, HostListener, OnDestroy, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
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
export class ModifierAlerteComponent implements OnInit, OnDestroy, AfterViewInit {
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
    { value: 'MATURITE', label: 'Maturité', icon: 'bi-droplet' },
    { value: 'MATURITE_ACCELEREE', label: 'Maturité accélérée', icon: 'bi-speedometer2' },
    { value: 'MALADIE', label: 'Maladie', icon: 'bi-bug' },
    { value: 'METEO', label: 'Dégât météorologique', icon: 'bi-cloud-rain' },
    { value: 'RECOLTE', label: 'Problème de récolte', icon: 'bi-basket' },
    { value: 'CHUTE_PREMATUREE', label: 'Chute prématurée', icon: 'bi-arrow-down' },
    { value: 'NUISIBLE', label: 'Ravageur / Nuisible', icon: 'bi-bug' },
    { value: 'IRRIGATION', label: "Problème d'irrigation", icon: 'bi-droplet' },
    { value: 'QUALITE_HUILE', label: "Qualité d'huile", icon: 'bi-cup-straw' },
    { value: 'RENDEMENT_ANORMAL', label: 'Rendement anormal', icon: 'bi-graph-down' },
    { value: 'LOGISTIQUE_MOULIN', label: 'Logistique moulin', icon: 'bi-building' },
    { value: 'SECURITE_RECOLTE', label: 'Sécurité récolte', icon: 'bi-shield-exclamation' },
    { value: 'AUTRE', label: 'Autre problème', icon: 'bi-info-circle' }
  ];

  readonly statutOptions = [
    { value: 'EN_ATTENTE', label: 'En attente', color: '#F59E0B', icon: 'bi-hourglass-split' },
    { value: 'EN_COURS', label: 'En cours', color: '#3B82F6', icon: 'bi-arrow-repeat' },
    { value: 'TRAITEE', label: 'Traitée', color: '#10B981', icon: 'bi-check-circle-fill' },
    { value: 'IGNOREE', label: 'Ignorée', color: '#6B7280', icon: 'bi-x-circle-fill' }
  ];

  readonly urgenceOptions = [
    { value: 'FAIBLE', label: 'Faible', color: '#10B981', icon: 'bi-info-circle-fill' },
    { value: 'MOYENNE', label: 'Moyenne', color: '#F59E0B', icon: 'bi-exclamation-circle-fill' },
    { value: 'ELEVEE', label: 'Élevée', color: '#EF4444', icon: 'bi-exclamation-triangle-fill' },
    { value: 'CRITIQUE', label: 'Critique', color: '#991B1B', icon: 'bi-exclamation-octagon-fill' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private alerteService: AlerteService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    this.isAdmin = this.userRole === 'ADMIN';
    this.handleResize();

    const alerteId = this.route.snapshot.paramMap.get('id');
    if (!alerteId) {
      this.errorMessage = 'Identifiant d\'alerte invalide.';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }
    this.loadAlerte(alerteId);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cdr.detectChanges();
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    this.cdr.detectChanges();
  }

  @HostListener('window:resize')
  handleResize(): void {
    this.isMobile = window.innerWidth < 768;
    this.cdr.detectChanges();
  }

  loadAlerte(id: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

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
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading alerte:', err);
        this.errorMessage = 'Impossible de charger cette alerte.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  backToList(): void {
    this.router.navigate(['/alertes/gestion']);
  }

  changeStatus(): void {
    if (!this.alerte || !this.newStatut || this.newStatut === this.alerte.statut) return;

    this.isUpdatingStatus = true;
    this.cdr.detectChanges();

    const endpoint$ = this.isAdmin
      ? this.alerteService.changeStatut(this.alerte.id, this.newStatut as StatutAlerte)
      : this.alerteService.changerStatutResponsable(this.alerte.id, this.newStatut as StatutAlerte);

    endpoint$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (updated) => {
        this.alerte = updated;
        this.newStatut = updated.statut;
        this.isUpdatingStatus = false;
        this.cdr.detectChanges();
        this.showTemporaryMessage('Statut mis à jour avec succès', 'success');
      },
      error: (err) => {
        console.error('Error changing status:', err);
        this.isUpdatingStatus = false;
        this.cdr.detectChanges();
        this.showTemporaryMessage('Erreur lors de la mise à jour du statut', 'error');
      }
    });
  }

  changeCriticality(): void {
    if (!this.alerte || !this.newUrgence || this.newUrgence === this.alerte.niveauUrgence) return;

    this.isUpdatingCriticality = true;
    this.cdr.detectChanges();

    const endpoint$ = this.isAdmin
      ? this.alerteService.changeUrgence(this.alerte.id, this.newUrgence as NiveauUrgence)
      : this.alerteService.changerUrgenceResponsable(this.alerte.id, this.newUrgence as NiveauUrgence);

    endpoint$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (updated) => {
        this.alerte = updated;
        this.newUrgence = updated.niveauUrgence;
        this.isUpdatingCriticality = false;
        this.cdr.detectChanges();
        this.showTemporaryMessage('Criticité mise à jour avec succès', 'success');
      },
      error: (err) => {
        console.error('Error changing urgency:', err);
        this.isUpdatingCriticality = false;
        this.cdr.detectChanges();
        this.showTemporaryMessage('Erreur lors de la mise à jour de la criticité', 'error');
      }
    });
  }

  markAsTreated(): void {
    if (!this.alerte || !this.treatmentComment.trim()) {
      this.showTemporaryMessage('Veuillez entrer un commentaire de traitement', 'error');
      return;
    }

    this.isMarkingTreated = true;
    this.cdr.detectChanges();

    const endpoint$ = this.isAdmin
      ? this.alerteService.markAsProcessed(this.alerte.id, this.treatmentComment)
      : this.alerteService.marquerTraiteeResponsable(this.alerte.id, this.treatmentComment);

    endpoint$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (updated) => {
        this.alerte = updated;
        this.newStatut = updated.statut;
        this.treatmentComment = updated.commentaireTraitement || '';
        this.isMarkingTreated = false;
        this.cdr.detectChanges();
        this.showTemporaryMessage('Alerte marquée comme traitée', 'success');
      },
      error: (err) => {
        console.error('Error marking as treated:', err);
        this.isMarkingTreated = false;
        this.cdr.detectChanges();
        this.showTemporaryMessage('Erreur lors du traitement de l\'alerte', 'error');
      }
    });
  }

  private showTemporaryMessage(message: string, type: 'success' | 'error'): void {
    alert(message);
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

  getTypeIcon(type: TypeAlerte): string {
    const item = this.typesAlerte.find(t => t.value === type);
    return item ? item.icon : 'bi-bell';
  }

  getStatutLabel(statut: StatutAlerte): string {
    const item = this.statutOptions.find(s => s.value === statut);
    return item ? item.label : statut;
  }

  getStatutColor(statut: StatutAlerte): string {
    const item = this.statutOptions.find(s => s.value === statut);
    return item ? item.color : '#6B7280';
  }

  getStatutIcon(statut: StatutAlerte): string {
    const item = this.statutOptions.find(s => s.value === statut);
    return item ? item.icon : 'bi-question-circle';
  }

  getUrgenceLabel(urgence: NiveauUrgence): string {
    const item = this.urgenceOptions.find(u => u.value === urgence);
    return item ? item.label : urgence;
  }

  getUrgenceColor(urgence: NiveauUrgence): string {
    const item = this.urgenceOptions.find(u => u.value === urgence);
    return item ? item.color : '#6B7280';
  }

  getUrgenceIcon(urgence: NiveauUrgence): string {
    const item = this.urgenceOptions.find(u => u.value === urgence);
    return item ? item.icon : 'bi-exclamation-circle';
  }

  formatCoordinate(value: number | undefined | null): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return 'N/A';
    }
    return value.toFixed(5);
  }
}