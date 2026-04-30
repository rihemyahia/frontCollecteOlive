// src/app/tournees/tournee-list/tournee-list.component.ts
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TourneeService } from '../../services/tournee';
import { UtilisateurService } from '../../services/utilisateur';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { StatutTourneePipe } from '../../pipes/statut-tournee-pipe';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-tournee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, StatutTourneePipe, SideBarResponsable],
  templateUrl: './tournee-list.html',
  styleUrls: ['./tournee-list.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TourneeListComponent implements OnInit {
  // UI State
  isSidebarCollapsed = false;
  userRole = '';
  isMobile = false;
  // Default to table: avoids expensive grouped computation during initial render.
  viewMode: 'table' | 'cards' | 'grouped' = 'table';

  // Data
  tournees: any[] = [];
  filteredTournees: any[] = [];
  groupedByAgriculteur: AgriculteurGroup[] = [];
  pagedTournees: any[] = [];

  // Filters
  selectedStatut = '';
  searchTerm = '';

  // Loading & Messages
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  // Pagination
  currentPage = 1;
  readonly pageSize = 20;

  // Modal
  showCompleteModal = false;
  selectedTournee: any = null;
  completeData = {
    quantiteCollecteeKg: 0,
    distanceTotale: null,
    observations: ''
  };

  // Statistics
  totalQuantite = 0;
  totalTournees = 0;
  totalAgriculteurs = 0;
  totalVergers = 0;
  livraisonSummary = {
    aLivrer: 0,
    enLivraison: 0,
    livree: 0,
    sansVehicule: 0
  };

  constructor(
    private tourneeService: TourneeService,
    private utilisateurService: UtilisateurService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  get isTransporteur(): boolean {
    return this.userRole === 'TRANSPORTEUR';
  }

  get pageTitle(): string {
    return this.isTransporteur ? 'Mes tournées' : 'Liste des tournées';
  }

  get pageSubtitle(): string {
    return this.isTransporteur
      ? 'Suivez vos missions du jour, démarrez et terminez rapidement chaque tournée'
      : 'Planifiez, suivez et gérez les tournées de récolte';
  }

  ngOnInit() {
    this.checkMobile();
    this.userRole = this.authService.getUserRole();
    this.loadTournees();
  }

  @HostListener('window:resize')
  checkMobile() {
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile && this.isSidebarCollapsed) {
      this.isSidebarCollapsed = false;
    }
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  // ==================== DATA LOADING ====================
  loadTournees(): void {
    this.isLoading = true;
    
    // For TRANSPORTEUR: load only current user's tournees
    // For ADMIN/RESPONSABLE: load all tournees
    const loadObservable = this.userRole === 'TRANSPORTEUR'
      ? this.utilisateurService.getMesTourneesTransporteur()
      : this.tourneeService.getAll();

    loadObservable.subscribe({
      next: (data: any) => {
        console.log('Tournées reçues:', data);
        // Handle both direct array and API response object
        const tourneeArray = Array.isArray(data) ? data : (data?.tournees || data?.content || []);
        this.tournees = tourneeArray.map((t: any) => ({
          ...t,
          displayVergerTypeOlive: t.vergerTypeOlive || t.verger?.typeOlive || 'N/A',
          displayVergerAgriculteurNom: t.vergerAgriculteurNom || this.extractAgriculteurName(t.verger?.agriculteur),
          displayQuantiteCollectee: t.quantiteCollecteeKg && t.quantiteCollecteeKg > 0 ? t.quantiteCollecteeKg.toFixed(1) : '0',
          displayTotalCollecte: t.totalCollecteVergerKg ? t.totalCollecteVergerKg.toFixed(1) : '0',
          displayEfficaciteValue: t.efficacite ? t.efficacite.toFixed(1) : 'N/A',
          displayLivraisonStatus: this.computeLivraisonStatus(t),
          displayLivraisonWindow: this.computeLivraisonWindow(t),
          hasDedicatedDeliveryVehicle: this.hasDedicatedDeliveryVehicle(t),
          formattedDateDebut: this.formatDateTime(t.dateDebut),
          formattedDateFin: this.formatDateTime(t.dateFin),
          formattedDate: this.formatDate(t.dateDebut)
        }));
        this.applyFilters();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.errorMessage = 'Erreur lors du chargement des tournées';
        this.isLoading = false;
        this.cdr.markForCheck();
        console.error(err);
      }
    });
  }

  private extractAgriculteurName(agriculteur: any): string {
    if (!agriculteur) return 'N/A';
    if (typeof agriculteur === 'object') {
      const fullName = `${agriculteur.prenom || ''} ${agriculteur.nom || ''}`.trim();
      return fullName || 'N/A';
    }
    return 'N/A';
  }

  private computeLivraisonStatus(tournee: any): string {
    if (tournee.statut === 'TERMINEE') return 'A_LIVRER';
    if (tournee.statut === 'EN_LIVRAISON') return 'EN_LIVRAISON';
    if (tournee.statut === 'LIVREE') return 'LIVREE';
    if (tournee.statut === 'EN_COURS') return 'COLLECTE_EN_COURS';
    return 'NON_DISPONIBLE';
  }

  private computeLivraisonWindow(tournee: any): string {
    const debut = tournee?.livraisonDebut || tournee?.expectedDeliveryDate || (tournee?.statut === 'TERMINEE' ? tournee?.dateFin : null);
    if (!debut) return 'A définir';
    return this.formatDateTime(debut);
  }

  private hasDedicatedDeliveryVehicle(tournee: any): boolean {
    // Current model: delivery uses the planned tracteur (temporary rule).
    // Treat tracteur as the delivery vehicle so UI doesn't show "A planifier".
    if (tournee?.tracteurId || tournee?.tracteurNom || tournee?.tracteur?.id || tournee?.tracteur?.nom) return true;
    // Future-proof keys for dedicated transport vehicle without breaking current model.
    return !!(tournee?.vehiculeLivraison || tournee?.ressourceLivraison || tournee?.camionLivraison);
  }

  // Helper methods for template
  getVergerTypeOlive(t: any): string {
    return t.displayVergerTypeOlive || 'N/A';
  }

  getVergerAgriculteurNom(t: any): string {
    return t.displayVergerAgriculteurNom || 'N/A';
  }

  getQuantiteCollectee(t: any): string {
    return t.displayQuantiteCollectee || '0';
  }

  getTotalCollecte(t: any): string {
    return t.displayTotalCollecte || '0';
  }

  getEfficaciteValue(t: any): string {
    return t.displayEfficaciteValue || 'N/A';
  }

  // ==================== GROUPING LOGIC ====================
  /**
   * Groupe les tournées par Agriculteur → Verger
   * Structure hiérarchique claire
   */
 // Replace your groupByAgriculteurAndVerger() method with this:

groupByAgriculteurAndVerger() {
  const agriculteurMap = new Map<string, AgriculteurGroup>();

  this.filteredTournees.forEach(tournee => {
    // IMPORTANT: Get agriculteur from the verger object
    // Your tournee might have verger object populated or just verger ID
    let agriculteurId = 'non-assigne';
    let agriculteurNom = 'Non assigné';
    let vergerId = 'sans-verger';
    let vergerNom = 'Verger inconnu';

    // Check if verger is populated (object) or just an ID
    if (tournee.verger) {
      if (typeof tournee.verger === 'object') {
        // Verger is populated
        vergerId = tournee.verger._id || tournee.verger.id;
        vergerNom = tournee.verger.typeOlive || 'Verger inconnu';

        // Get agriculteur from verger
        if (tournee.verger.agriculteur) {
          if (typeof tournee.verger.agriculteur === 'object') {
            agriculteurId = tournee.verger.agriculteur._id || tournee.verger.agriculteur.id;
            agriculteurNom = tournee.verger.agriculteur.nom || 'Nom inconnu';
          } else {
            agriculteurId = tournee.verger.agriculteur;
            agriculteurNom = `Agriculteur ${agriculteurId.substring(0, 8)}`;
          }
        }
      } else {
        // Verger is just an ID, need to look it up
        vergerId = tournee.verger;
        vergerNom = `Verger ${vergerId.substring(0, 8)}`;
      }
    }

    // Also check direct fields as fallback
    if (tournee.vergerTypeOlive) {
      vergerNom = tournee.vergerTypeOlive;
    }
    if (tournee.vergerAgriculteurNom) {
      agriculteurNom = tournee.vergerAgriculteurNom;
    }
    if (tournee.vergerAgriculteurId) {
      agriculteurId = tournee.vergerAgriculteurId;
    }

    // Create or get agriculteur
    if (!agriculteurMap.has(agriculteurId)) {
      agriculteurMap.set(agriculteurId, {
        id: agriculteurId,
        nom: agriculteurNom,
        initials: this.getInitials(agriculteurNom),
        vergers: [],
        expanded: true,
        totalTournees: 0,
        totalQuantite: 0,
        totalEfficacite: 0
      });
    }

    const agriculteur = agriculteurMap.get(agriculteurId)!;

    // Find or create verger
    let verger = agriculteur.vergers.find(v => v.id === vergerId);
    if (!verger) {
      verger = {
        id: vergerId,
        nom: vergerNom,
        tournees: [],
        expanded: true,
        totalQuantite: 0,
        totalTournees: 0,
        totalEfficacite: 0
      };
      agriculteur.vergers.push(verger);
    }

    // Add tournee
    verger.tournees.push(tournee);
    verger.totalQuantite += tournee.quantiteCollecteeKg || 0;
    verger.totalTournees++;
    if (tournee.efficacite) {
      verger.totalEfficacite += tournee.efficacite;
    }

    agriculteur.totalQuantite += tournee.quantiteCollecteeKg || 0;
    agriculteur.totalTournees++;
    if (tournee.efficacite) {
      agriculteur.totalEfficacite += tournee.efficacite;
    }
  });

  // Calculate averages and sort
  agriculteurMap.forEach(agriculteur => {
    agriculteur.moyenneEfficacite = agriculteur.totalTournees > 0
      ? agriculteur.totalEfficacite / agriculteur.totalTournees
      : 0;

    agriculteur.vergers.forEach(verger => {
      verger.moyenneEfficacite = verger.totalTournees > 0
        ? verger.totalEfficacite / verger.totalTournees
        : 0;
    });

    agriculteur.vergers.sort((a, b) => a.nom.localeCompare(b.nom));
  });

  this.groupedByAgriculteur = Array.from(agriculteurMap.values())
    .sort((a, b) => a.nom.localeCompare(b.nom));

  this.updateGlobalStats();
}

  updateGlobalStats() {
    this.totalTournees = this.filteredTournees.length;
    this.totalQuantite = this.filteredTournees.reduce((sum, t) => sum + (t.quantiteCollecteeKg || 0), 0);
    const uniqueAgriculteurs = new Set(this.filteredTournees.map(t => t.displayVergerAgriculteurNom || 'N/A'));
    const uniqueVergers = new Set(this.filteredTournees.map(t => t.displayVergerTypeOlive || 'N/A'));
    this.totalAgriculteurs = uniqueAgriculteurs.size;
    this.totalVergers = uniqueVergers.size;
    this.updateLivraisonSummary();
  }

  private updateLivraisonSummary(): void {
    const getCount = (status: string) => this.filteredTournees.filter(t => t.displayLivraisonStatus === status).length;
    this.livraisonSummary = {
      aLivrer: getCount('A_LIVRER'),
      enLivraison: getCount('EN_LIVRAISON'),
      livree: getCount('LIVREE'),
      sansVehicule: this.filteredTournees.filter(t => t.displayLivraisonStatus === 'A_LIVRER' && !t.hasDedicatedDeliveryVehicle).length
    };
  }

  getInitials(name: string): string {
    if (!name || name === 'Non assigné') return 'NA';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  }

  // ==================== EXPAND/COLLAPSE ====================
  toggleAgriculteur(agriculteur: AgriculteurGroup) {
    agriculteur.expanded = !agriculteur.expanded;
    this.cdr.markForCheck();
  }

  toggleVerger(verger: VergerGroup) {
    verger.expanded = !verger.expanded;
    this.cdr.markForCheck();
  }

  expandAll() {
    this.groupedByAgriculteur.forEach(a => {
      a.expanded = true;
      a.vergers.forEach(v => v.expanded = true);
    });
    this.cdr.markForCheck();
  }

  collapseAll() {
    this.groupedByAgriculteur.forEach(a => {
      a.expanded = false;
      a.vergers.forEach(v => v.expanded = false);
    });
    this.cdr.markForCheck();
  }

  // ==================== FILTERS ====================
  applyFilters() {
    let filtered = [...this.tournees];

    if (this.selectedStatut) {
      filtered = filtered.filter(t => t.statut === this.selectedStatut);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.code?.toLowerCase().includes(term) ||
        t.vergerTypeOlive?.toLowerCase().includes(term) ||
        t.vergerAgriculteurNom?.toLowerCase().includes(term) ||
        t.vergerNom?.toLowerCase().includes(term)
      );
    }

    this.filteredTournees = filtered;
    this.currentPage = 1;
    this.updatePagedTournees();
    if (this.viewMode === 'grouped') {
      this.groupByAgriculteurAndVerger();
    } else {
      this.updateGlobalStats();
    }
    this.cdr.markForCheck();
  }

  updatePagedTournees(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedTournees = this.filteredTournees.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTournees.length / this.pageSize));
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagedTournees();
      this.cdr.markForCheck();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagedTournees();
      this.cdr.markForCheck();
    }
  }

  onFilterChange() {
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  refreshList() {
    this.loadTournees();
    this.successMessage = 'Liste actualisée';
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.markForCheck();
    }, 3000);
  }

  // ==================== STATUT UTILITIES ====================
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
      'PLANIFIEE': '📋',
      'EN_COURS': '🔄',
      'TERMINEE': '✅',
      'EN_LIVRAISON': '🚚',
      'LIVREE': '✅',
      'ANNULEE': '❌'
    };
    return icons[statut] || '📌';
  }

  getStatutText(statut: string): string {
    const texts: Record<string, string> = {
      'PLANIFIEE': 'Planifiée',
      'EN_COURS': 'En cours',
      'TERMINEE': 'Terminée',
      'EN_LIVRAISON': 'En livraison',
      'LIVREE': 'Livrée',
      'ANNULEE': 'Annulée'
    };
    return texts[statut] || statut;
  }

  getEfficaciteClass(efficacite: number): string {
    if (!efficacite) return '';
    if (efficacite < 40) return 'efficiency-low';
    if (efficacite < 70) return 'efficiency-medium';
    return 'efficiency-high';
  }

  getEfficaciteColor(efficacite: number): string {
    if (!efficacite) return '#6c757d';
    if (efficacite < 40) return '#dc3545';
    if (efficacite < 70) return '#ffc107';
    return '#28a745';
  }

  getLivraisonBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'COLLECTE_EN_COURS': 'livraison-pending',
      'A_LIVRER': 'livraison-ready',
      'EN_LIVRAISON': 'livraison-in-progress',
      'LIVREE': 'livraison-done',
      'NON_DISPONIBLE': 'livraison-na'
    };
    return classes[status] || 'livraison-na';
  }

  getLivraisonLabel(status: string): string {
    const labels: Record<string, string> = {
      'COLLECTE_EN_COURS': 'Collecte en cours',
      'A_LIVRER': 'A livrer',
      'EN_LIVRAISON': 'En livraison',
      'LIVREE': 'Livrée',
      'NON_DISPONIBLE': 'N/A'
    };
    return labels[status] || status;
  }

  // ==================== DATE/TIME FORMATTING ====================
  formatDateTime(date: any): string {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'N/A';
    }
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  }

  formatTime(seconds: number): string {
    if (!seconds) return 'N/A';
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

  // ==================== NAVIGATION ====================
  navigateToCreate() {
    if (this.isTransporteur) return;
    this.router.navigate(['/tournees/create']);
  }

  navigateToEdit(id: string) {
    if (this.isTransporteur) return;
    this.router.navigate(['/tournees/edit', id]);
  }

  viewDetails(id: string) {
    this.router.navigate(['/tournees', id]);
  }

  // ==================== TOURNEE ACTIONS ====================
  startTournee(id: string) {
    if (confirm('Démarrer cette tournée ?')) {
      this.tourneeService.demarrer(id).subscribe({
        next: () => {
          this.successMessage = 'Tournée démarrée avec succès';
          this.loadTournees();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erreur lors du démarrage';
          setTimeout(() => this.errorMessage = '', 3000);
          this.cdr.markForCheck();
        }
      });
    }
  }

  openCompleteModal(tournee: any) {
    this.selectedTournee = tournee;
    this.completeData = {
      quantiteCollecteeKg: 0,
      distanceTotale: null,
      observations: ''
    };
    this.showCompleteModal = true;
    this.cdr.markForCheck();
  }

  closeCompleteModal() {
    this.showCompleteModal = false;
    this.selectedTournee = null;
    this.cdr.markForCheck();
  }

  confirmComplete() {
    if (this.selectedTournee && this.completeData.quantiteCollecteeKg > 0) {
      this.tourneeService.terminer(this.selectedTournee.id || this.selectedTournee._id, this.completeData)
        .subscribe({
          next: () => {
            this.successMessage = 'Tournée terminée avec succès';
            this.loadTournees();
            this.closeCompleteModal();
            setTimeout(() => this.successMessage = '', 3000);
          },
          error: (err) => {
            this.errorMessage = err.error?.message || 'Erreur lors de la finalisation';
            setTimeout(() => this.errorMessage = '', 3000);
            this.cdr.markForCheck();
          }
        });
    }
  }

  cancelTournee(id: string) {
    if (this.isTransporteur) return;
    if (confirm('Annuler cette tournée ?')) {
      this.tourneeService.annuler(id).subscribe({
        next: () => {
          this.successMessage = 'Tournée annulée';
          this.loadTournees();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erreur lors de l\'annulation';
          setTimeout(() => this.errorMessage = '', 3000);
          this.cdr.markForCheck();
        }
      });
    }
  }

  // ==================== TRACKING ====================
  trackByTourneeId(index: number, tournee: any): string {
    return tournee.id || tournee._id;
  }

  trackByAgriculteurId(index: number, agriculteur: AgriculteurGroup): string {
    return agriculteur.id;
  }

  trackByVergerId(index: number, verger: VergerGroup): string {
    return verger.id;
  }
}

// ==================== INTERFACES ====================
interface VergerGroup {
  id: string;
  nom: string;
  tournees: any[];
  expanded: boolean;
  totalQuantite: number;
  totalTournees: number;
  totalEfficacite: number;
  moyenneEfficacite?: number;
}

interface AgriculteurGroup {
  id: string;
  nom: string;
  initials: string;
  vergers: VergerGroup[];
  expanded: boolean;
  totalTournees: number;
  totalQuantite: number;
  totalEfficacite: number;
  moyenneEfficacite?: number;
}