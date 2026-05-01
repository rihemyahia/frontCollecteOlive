import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { TourneeService } from '../../services/tournee';
import { UtilisateurService } from '../../services/utilisateur';
import { AuthService } from '../../services/auth';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { StatutTourneePipe } from '../../pipes/statut-tournee-pipe';

@Component({
  selector: 'app-tournee-detail',
  standalone: true,
  imports: [CommonModule, StatutTourneePipe, SideBarResponsable],
  templateUrl: './tournee-detail.html',
  styleUrls: ['./tournee-detail.css']
})
export class TourneeDetailComponent implements OnInit {
  isSidebarCollapsed = false;
  userRole = 'ADMIN';
  tournee: any = null;
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  showLivraisonModal = false;
  livraisonProofFile: File | null = null;
  livraisonProofError = '';
  isCompletingLivraison = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tourneeService: TourneeService,
    private utilisateurService: UtilisateurService,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.userRole = this.authService.getUserRole() || 'ADMIN';
    const id = this.route.snapshot.paramMap.get('id');
    console.log('🆔 Tournee ID:', id);
    if (id) {
      this.loadTournee(id);
    } else {
      this.errorMessage = 'ID de tournée non trouvé';
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  loadTournee(id: string) {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    console.log('📡 Loading tournee:', id);

    this.tourneeService.getById(id).subscribe({
      next: (data) => {
        console.log('✅ Tournee loaded:', data);
        this.tournee = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        if (this.isTransporteur) {
          this.utilisateurService.getMesTourneesTransporteur().subscribe({
            next: (payload: any) => {
              const list = payload?.tournees || payload?.content || payload?.data?.tournees || payload || [];
              const found = Array.isArray(list)
                ? list.find((t: any) => (t?.id || t?._id) === id)
                : null;
              if (found) {
                this.tournee = found;
                this.errorMessage = '';
              } else {
                this.errorMessage = this.extractErrorMessage(err);
              }
              this.isLoading = false;
              this.cdr.markForCheck();
            },
            error: () => {
              console.error('❌ Erreur lors du chargement:', err);
              this.errorMessage = this.extractErrorMessage(err);
              this.isLoading = false;
              this.cdr.markForCheck();
            }
          });
          return;
        }
        console.error('❌ Erreur lors du chargement:', err);
        this.errorMessage = this.extractErrorMessage(err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  extractErrorMessage(err: any): string {
    if (err.error?.message) return err.error.message;
    if (err.error?.error) return err.error.error;
    if (typeof err.error === 'string') return err.error;
    if (err.message) return err.message;
    return 'Erreur lors du chargement de la tournée';
  }

// Keep everything else the same, just update these two methods:
formatDate(date: Date): string {
  if (!date) return 'N/A';
  const d = new Date(date);

  // Afficher en heure locale (sans spécifier UTC)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  // Pas de timeZone: 'UTC' - donc utilise le fuseau local
}

formatDuration(seconds: number): string {
  if (!seconds && seconds !== 0) return 'N/A';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}min`;
}

  getBenneDisplay(): string {
    return this.tournee?.benneNom
      || this.tournee?.benne?.nom
      || 'N/A';
  }

  getTracteurDisplay(): string {
    return this.tournee?.tracteurNom
      || this.tournee?.tracteur?.nom
      || 'N/A';
  }

  getTravailleursDisplay(): string {
    if (Array.isArray(this.tournee?.travailleurNoms) && this.tournee.travailleurNoms.length > 0) {
      return this.tournee.travailleurNoms.join(', ');
    }
    if (Array.isArray(this.tournee?.travailleurs) && this.tournee.travailleurs.length > 0) {
      const names = this.tournee.travailleurs
        .map((t: any) => `${t?.prenom || ''} ${t?.nom || ''}`.trim())
        .filter((n: string) => n.length > 0);
      return names.length ? names.join(', ') : 'N/A';
    }
    return 'N/A';
  }

  getDeliveryStatusLabel(): string {
    if (this.tournee?.statut === 'LIVREE') return 'Livrée';
    if (this.tournee?.statut === 'EN_LIVRAISON') return 'En livraison';
    if (this.tournee?.statut === 'TERMINEE') return 'Prête pour livraison';
    return 'Non démarrée';
  }

  getDeliveryDestinationName(): string {
    return this.tournee?.livraisonDestinationNom
      || this.tournee?.deliveryDestinationName
      || (this.tournee?.vergerTypeOlive ? `Point de livraison - ${this.tournee.vergerTypeOlive}` : '')
      || 'Point de livraison principal';
  }

  getDeliveryDestinationAddress(): string {
    return this.tournee?.livraisonDestinationAdresse
      || this.tournee?.deliveryDestinationAddress
      || this.tournee?.destinationAdresse
      || this.tournee?.verger?.responsable?.adresse
      || this.tournee?.verger?.geolocalisation?.adresseIndicative
      || 'Adresse a confirmer par le responsable';
  }

  /** Créneau fixé par l'admin à l'assignation (plusieurs livraisons / jour). */
  getEstimatedDeliverySlotLabel(): string {
    const d0 = this.tournee?.livraisonEstimeDebut;
    const d1 = this.tournee?.livraisonEstimeFin;
    if (!d0 || !d1) return '';
    return `${this.formatDate(d0)} → ${this.formatDate(d1)}`;
  }

  getLivraisonNotes(): string {
    const n = this.tournee?.livraisonNotes;
    return (n && String(n).trim()) ? String(n).trim() : '';
  }

  getNavigationUrl(): string {
    const destination = this.getDeliveryDestinationAddress();
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  }

  getEmbeddedMapUrl(): SafeResourceUrl {
    const destination = this.getDeliveryDestinationAddress();
    const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(destination)}&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(mapUrl);
  }

  getLivraisonEvidenceUrl(): string {
    return this.tournee?.livraisonEvidenceUrl
      || this.tournee?.deliveryEvidenceUrl
      || '';
  }

  hasLivraisonEvidence(): boolean {
    return !!this.getLivraisonEvidenceUrl();
  }

  isImageEvidence(): boolean {
    const url = this.getLivraisonEvidenceUrl().toLowerCase();
    return /\.(jpg|jpeg|png|webp|gif)(\?|$)/.test(url);
  }

  isPdfEvidence(): boolean {
    const url = this.getLivraisonEvidenceUrl().toLowerCase();
    return /\.pdf(\?|$)/.test(url);
  }

  getEvidencePreviewUrl(): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.getLivraisonEvidenceUrl());
  }

  getStatutClass(statut: string): string {
    const classes: Record<string, string> = {
      'PLANIFIEE': 'statut-planifiee',
      'EN_COURS': 'statut-en-cours',
      'TERMINEE': 'statut-terminee',
      'EN_LIVRAISON': 'statut-en-cours',
      'LIVREE': 'statut-terminee',
      'ANNULEE': 'statut-annulee'
    };
    return classes[statut] || '';
  }

  getStatutIcon(statut: string): string {
    const icons: Record<string, string> = {
      'PLANIFIEE': 'bi-calendar-check',
      'EN_COURS': 'bi-play-circle',
      'TERMINEE': 'bi-check-circle',
      'EN_LIVRAISON': 'bi-truck',
      'LIVREE': 'bi-check2-circle',
      'ANNULEE': 'bi-x-circle'
    };
    return icons[statut] || 'bi-question-circle';
  }

  get isTransporteur(): boolean {
    return this.userRole === 'TRANSPORTEUR';
  }

  get canStartLivraison(): boolean {
    return this.isTransporteur && this.tournee?.statut === 'TERMINEE';
  }

  get canCompleteLivraison(): boolean {
    return this.isTransporteur && this.tournee?.statut === 'EN_LIVRAISON';
  }

  get canUseAdminActions(): boolean {
    return !this.isTransporteur;
  }

  /** True if at least one primary action button is shown (for layout spacing). */
  hasVisibleActions(): boolean {
    const t = this.tournee;
    if (!t) return false;
    if (this.canStartLivraison || this.canCompleteLivraison) return true;
    if (!this.canUseAdminActions) return false;
    if (t.statut === 'PLANIFIEE' || t.statut === 'EN_COURS') return true;
    if (t.statut !== 'LIVREE' && t.statut !== 'EN_LIVRAISON') return true;
    return false;
  }

  /** Short window label for KPI row (jour seulement). */
  formatDateDay(date: Date | string | null | undefined): string {
    if (!date) return '—';
    const d = new Date(date as Date);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  startLivraison(): void {
    if (!this.canStartLivraison) return;
    if (!confirm('Démarrer la livraison pour cette tournée ?')) return;
    this.utilisateurService.startLivraison(this.tournee.id).subscribe({
      next: () => {
        this.successMessage = 'Livraison démarrée avec succès';
        this.loadTournee(this.tournee.id);
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = this.extractErrorMessage(err);
        this.cdr.markForCheck();
      }
    });
  }

  openLivraisonModal(): void {
    if (!this.canCompleteLivraison) return;
    this.showLivraisonModal = true;
    this.livraisonProofFile = null;
    this.livraisonProofError = '';
    this.cdr.markForCheck();
  }

  closeLivraisonModal(): void {
    this.showLivraisonModal = false;
    this.livraisonProofFile = null;
    this.livraisonProofError = '';
    this.isCompletingLivraison = false;
    this.cdr.markForCheck();
  }

  onLivraisonProofSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.livraisonProofFile = null;
      return;
    }
    const file = input.files[0];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      this.livraisonProofError = 'Types autorisés: JPG, PNG, WEBP, PDF, TXT';
      this.livraisonProofFile = null;
      this.cdr.markForCheck();
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.livraisonProofError = 'Le fichier ne doit pas dépasser 10 Mo';
      this.livraisonProofFile = null;
      this.cdr.markForCheck();
      return;
    }
    this.livraisonProofFile = file;
    this.livraisonProofError = '';
    this.cdr.markForCheck();
  }

  completeLivraison(): void {
    if (!this.canCompleteLivraison || !this.livraisonProofFile) {
      this.livraisonProofError = 'Veuillez sélectionner un fichier de preuve';
      this.cdr.markForCheck();
      return;
    }
    this.isCompletingLivraison = true;
    this.utilisateurService.completeLivraison(this.tournee.id, this.livraisonProofFile).subscribe({
      next: () => {
        this.successMessage = 'Livraison terminée avec succès';
        this.closeLivraisonModal();
        this.loadTournee(this.tournee.id);
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.isCompletingLivraison = false;
        this.errorMessage = this.extractErrorMessage(err);
        this.cdr.markForCheck();
      }
    });
  }

  startTournee() {
    if (confirm('Démarrer cette tournée ?')) {
      this.isLoading = true;
      this.cdr.markForCheck();

      this.tourneeService.demarrer(this.tournee.id).subscribe({
        next: () => {
          this.loadTournee(this.tournee.id);
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.errorMessage = this.extractErrorMessage(err);
          this.isLoading = false;
          this.cdr.markForCheck();
          alert(this.errorMessage);
        }
      });
    }
  }

  completeTournee() {
    const quantity = prompt('Quantité collectée (kg):');
    if (quantity && +quantity > 0) {
      this.isLoading = true;
      this.cdr.markForCheck();

      this.tourneeService.terminer(this.tournee.id, { quantiteCollecteeKg: +quantity }).subscribe({
        next: () => {
          this.loadTournee(this.tournee.id);
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.errorMessage = this.extractErrorMessage(err);
          this.isLoading = false;
          this.cdr.markForCheck();
          alert(this.errorMessage);
        }
      });
    }
  }

  cancelTournee() {
    if (confirm('Annuler cette tournée ?')) {
      this.isLoading = true;
      this.cdr.markForCheck();

      this.tourneeService.annuler(this.tournee.id).subscribe({
        next: () => {
          this.loadTournee(this.tournee.id);
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.errorMessage = this.extractErrorMessage(err);
          this.isLoading = false;
          this.cdr.markForCheck();
          alert(this.errorMessage);
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/tournees']);
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}
