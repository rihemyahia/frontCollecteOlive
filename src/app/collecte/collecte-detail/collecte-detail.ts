// src/app/collecte/collecte-detail/collecte-detail.component.ts
import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CollecteService, CollecteDetail, TourneeCollecte } from '../../services/collecte';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';

@Component({
  selector: 'app-collecte-detail',
  standalone: true,
  imports: [CommonModule, SideBarResponsable],
  templateUrl: './collecte-detail.html',
  styleUrls: ['./collecte-detail.css']
})
export class CollecteDetailComponent implements OnInit {
  isSidebarCollapsed = false;
  userRole = 'ADMIN';
  collecteDetail: CollecteDetail | null = null;
  isLoading = true;
  errorMessage = '';
  totalQuantiteTournees = 0;
  isMobile: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private collecteService: CollecteService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.checkMobile();
    const id = this.route.snapshot.paramMap.get('id');
    console.log('🆔 Collecte ID:', id);
    if (id) {
      this.loadCollecte(id);
    } else {
      this.errorMessage = 'ID de collecte non trouvé';
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile && this.isSidebarCollapsed) {
      this.isSidebarCollapsed = false;
    }
  }

  loadCollecte(id: string) {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.collecteService.getById(id).subscribe({
      next: (data) => {
        console.log('📦 Collecte detail received:', data);
        this.collecteDetail = data;
        this.calculateTotals();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.errorMessage = this.extractErrorMessage(err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get collecte() {
    return this.collecteDetail?.collecte;
  }

  get tournees() {
    return this.collecteDetail?.tournees || [];
  }

  get vergerName(): string {
    if (this.collecteDetail?.verger) {
      const v = this.collecteDetail.verger;
      if (v.agriculteur) {
        return `${v.typeOlive} - ${v.agriculteur.prenom} ${v.agriculteur.nom}`;
      }
      return v.typeOlive || 'Verger';
    }
    return this.collecte?.vergerNom || 'N/A';
  }
 get vergerNbArbres(): number {
  // Only from collecteDetail which has the full verger object
  return this.collecteDetail?.verger?.nbArbre || 0;
}
  extractErrorMessage(err: any): string {
    if (err.error?.message) return err.error.message;
    if (err.error?.error) return err.error.error;
    if (typeof err.error === 'string') return err.error;
    if (err.message) return err.message;
    return 'Erreur lors du chargement de la collecte';
  }

  calculateTotals() {
    if (this.tournees.length > 0) {
      this.totalQuantiteTournees = this.tournees
        .filter(t => t?.quantiteCollecteeKg)
        .reduce((sum, t) => sum + (t?.quantiteCollecteeKg || 0), 0);
      console.log('📊 Total quantity from tournées:', this.totalQuantiteTournees);
    }
  }

  // ✅ FIXED: Handle undefined/null values
  formatTime(seconds: number | null | undefined): string {
    if (!seconds || seconds === 0) return 'N/A';
    if (seconds < 60) {
      return `${seconds} secondes`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes < 60) {
      return `${minutes}min ${secs}s`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  }

  formatDate(date: Date | string | null | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDuration(minutes: number | null | undefined): string {
    if (!minutes && minutes !== 0) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  }

  getStatutClass(statut: string | null | undefined): string {
    const classes: Record<string, string> = {
      'PLANIFIEE': 'statut-planifiee',
      'EN_COURS': 'statut-en-cours',
      'TERMINEE': 'statut-terminee',
      'ANNULEE': 'statut-annulee'
    };
    return classes[statut || ''] || '';
  }

  getStatutIcon(statut: string | null | undefined): string {
    const icons: Record<string, string> = {
      'PLANIFIEE': 'bi-calendar-check',
      'EN_COURS': 'bi-play-circle',
      'TERMINEE': 'bi-check-circle',
      'ANNULEE': 'bi-x-circle'
    };
    return icons[statut || ''] || 'bi-question-circle';
  }

  getStatutText(statut: string | null | undefined): string {
    const texts: Record<string, string> = {
      'PLANIFIEE': 'Planifiée',
      'EN_COURS': 'En cours',
      'TERMINEE': 'Terminée',
      'ANNULEE': 'Annulée'
    };
    return texts[statut || ''] || statut || 'N/A';
  }

  getProgressPercentage(): number {
    if (!this.collecte) return 0;
    const total = this.collecte.nbreTournees || 0;
    if (total === 0) return 0;
    const terminees = this.tournees.filter(t => t.statut === 'TERMINEE').length || 0;
    return (terminees / total) * 100;
  }

  viewTournee(id: string | null | undefined) {
    if (id) {
      this.router.navigate(['/tournees', id]);
    }
  }

  goBack() {
    this.router.navigate(['/collectes']);
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}
