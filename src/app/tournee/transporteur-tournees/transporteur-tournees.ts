// src/app/tournees/transporteur-tournees/transporteur-tournees.component.ts
import {
  Component, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { UtilisateurService } from '../../services/utilisateur';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { StatutTourneePipe } from '../../pipes/statut-tournee-pipe';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-transporteur-tournees',
  standalone: true,
  imports: [CommonModule, FormsModule, StatutTourneePipe, SideBarResponsable],
  templateUrl: './transporteur-tournees.html',
  styleUrls: ['./transporteur-tournees.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransporteurTourneesComponent implements OnInit, OnDestroy {

  // UI
  isSidebarCollapsed = false;
  isMobile = false;
  userRole = '';
  searchTerm = '';
  selectedStatut = '';

  // Data
  tournees: any[] = [];
  filteredTournees: any[] = [];

  // State
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  // Livraison modal
  showLivraisonModal = false;
  selectedLivraisonTournee: any = null;
  livraisonProofFile: File | null = null;
  livraisonProofPreview: string | null = null;
  livraisonProofError = '';
  isCompletingLivraison = false;

  // Auto-refresh every 60s
  private refreshSub?: Subscription;

  constructor(
    private utilisateurService: UtilisateurService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkMobile();
    this.userRole = this.authService.getUserRole();
    this.loadTournees();
    this.refreshSub = interval(60_000).subscribe(() => this.loadTournees(true));
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile && this.isSidebarCollapsed) this.isSidebarCollapsed = false;
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  // ── Stats getters ──────────────────────────────────────────
  get countEnAttente(): number {
    return this.tournees.filter(t => t.statut === 'RECOLTEE' || t.statut === 'TERMINEE').length;
  }
  get countEnLivraison(): number {
    return this.tournees.filter(t => t.statut === 'EN_LIVRAISON').length;
  }
  get countLivrees(): number {
    return this.tournees.filter(t => t.statut === 'LIVREE').length;
  }

  // ── Load ──────────────────────────────────────────────────
  loadTournees(silent = false): void {
    if (!silent) this.isLoading = true;

    this.utilisateurService.getMesTourneesTransporteur().subscribe({
      next: (data: any) => {
        const arr = Array.isArray(data) ? data : (data?.tournees || data?.content || []);
        this.tournees = arr.map((t: any) => this.enrichTournee(t));
        this.applyFilters();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des missions';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private enrichTournee(t: any): any {
    return {
      ...t,
      formattedDateDebut: this.formatDateTime(t.dateDebut),
      formattedDateFin:   this.formatDateTime(t.dateFin),
      livraisonWindowStr: this.formatDateTime(t.livraisonDebut || t.dateFin),
      destination: t.livraisonDestinationNom || t.vergerTypeOlive
                   ? `Point de livraison — ${t.vergerTypeOlive || ''}` : 'À confirmer',
      adresse: t.livraisonDestinationAdresse || t.verger?.geolocalisation?.adresseIndicative || 'Adresse à confirmer',
      mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        t.livraisonDestinationAdresse || t.verger?.geolocalisation?.adresseIndicative || ''
      )}`
    };
  }

  // ── Filters ───────────────────────────────────────────────
  applyFilters(): void {
    let list = [...this.tournees];

    if (this.selectedStatut) {
      list = list.filter(t => t.statut === this.selectedStatut);
    }

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(t =>
        t.code?.toLowerCase().includes(q) ||
        t.vergerTypeOlive?.toLowerCase().includes(q) ||
        t.vergerAgriculteurNom?.toLowerCase().includes(q)
      );
    }

    this.filteredTournees = list;
    this.cdr.markForCheck();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatut = '';
    this.applyFilters();
  }

  // ── Actions ───────────────────────────────────────────────
  startLivraison(tournee: any): void {
    const id = tournee?.id || tournee?._id;
    if (!id) return;

    this.utilisateurService.startLivraison(id).subscribe({
      next: () => {
        this.showSuccess('Livraison démarrée — bonne route !');
        this.loadTournees(true);
      },
      error: (err) => {
        this.showError(err?.error?.message || 'Erreur lors du démarrage');
      }
    });
  }

  openLivraisonModal(tournee: any): void {
    this.selectedLivraisonTournee = tournee;
    this.livraisonProofFile = null;
    this.livraisonProofPreview = null;
    this.livraisonProofError = '';
    this.isCompletingLivraison = false;
    this.showLivraisonModal = true;
    this.cdr.markForCheck();
  }

  closeLivraisonModal(): void {
    this.showLivraisonModal = false;
    this.selectedLivraisonTournee = null;
    this.livraisonProofFile = null;
    this.livraisonProofPreview = null;
    this.livraisonProofError = '';
    this.isCompletingLivraison = false;
    this.cdr.markForCheck();
  }

  onProofFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain'];

    if (!allowed.includes(file.type)) {
      this.livraisonProofError = 'Format non supporté. Utilisez JPG, PNG, WEBP, PDF ou TXT.';
      this.livraisonProofFile = null;
      this.livraisonProofPreview = null;
      this.cdr.markForCheck();
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.livraisonProofError = 'Fichier trop volumineux (max 10 Mo).';
      this.livraisonProofFile = null;
      this.cdr.markForCheck();
      return;
    }

    this.livraisonProofFile = file;
    this.livraisonProofError = '';

    // Preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.livraisonProofPreview = e.target?.result as string;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    } else {
      this.livraisonProofPreview = null;
    }

    this.cdr.markForCheck();
  }

  confirmCompleteLivraison(): void {
    const id = this.selectedLivraisonTournee?.id || this.selectedLivraisonTournee?._id;
    if (!id || !this.livraisonProofFile) return;

    this.isCompletingLivraison = true;
    this.utilisateurService.completeLivraison(id, this.livraisonProofFile).subscribe({
      next: () => {
        this.showSuccess('Livraison confirmée avec succès !');
        this.closeLivraisonModal();
        this.loadTournees(true);
      },
      error: (err) => {
        this.isCompletingLivraison = false;
        this.livraisonProofError = err?.error?.message || 'Erreur lors de la confirmation.';
        this.cdr.markForCheck();
      }
    });
  }

  viewDetails(id: string): void {
    this.router.navigate(['/tournees', id]);
  }

  // ── Helpers ───────────────────────────────────────────────
  getStatutClass(statut: string): string {
    const map: Record<string, string> = {
      PLANIFIEE: 'badge-planned',
      EN_COURS: 'badge-in-progress',
      RECOLTEE: 'badge-harvested',
      TERMINEE: 'badge-harvested',
      EN_LIVRAISON: 'badge-delivering',
      LIVREE: 'badge-done',
      ANNULEE: 'badge-cancelled'
    };
    return map[statut] || '';
  }

  getStatutLabel(statut: string): string {
    const map: Record<string, string> = {
      PLANIFIEE: 'Planifiée',
      EN_COURS: 'En cours',
      RECOLTEE: 'À livrer',
      TERMINEE: 'À livrer',
      EN_LIVRAISON: 'En livraison',
      LIVREE: 'Livrée',
      ANNULEE: 'Annulée'
    };
    return map[statut] || statut;
  }

  canStartLivraison(t: any): boolean {
    return t.statut === 'RECOLTEE' || t.statut === 'TERMINEE';
  }

  canCompleteLivraison(t: any): boolean {
    return t.statut === 'EN_LIVRAISON';
  }

  formatDateTime(date: any): string {
    if (!date) return '—';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return '—'; }
  }

  trackById(_: number, item: any): string {
    return item.id || item._id;
  }

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    this.cdr.markForCheck();
    setTimeout(() => { this.successMessage = ''; this.cdr.markForCheck(); }, 3500);
  }

  private showError(msg: string): void {
    this.errorMessage = msg;
    this.cdr.markForCheck();
    setTimeout(() => { this.errorMessage = ''; this.cdr.markForCheck(); }, 4000);
  }
}