// src/app/tournees/tournee-list/tournee-list.component.ts
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TourneeService } from '../../services/tournee';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { StatutTourneePipe } from '../../pipes/statut-tournee-pipe';
import { AuthService } from '../../services/auth';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-tournee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, StatutTourneePipe, SideBarResponsable],
  templateUrl: './tournee-list.html',
  styleUrls: ['./tournee-list.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TourneeListComponent implements OnInit, OnDestroy {
  // UI State
  isSidebarCollapsed = false;
  userRole = '';
  isMobile = false;
  viewMode: 'table' | 'cards' | 'grouped' = 'table';

  // Data
  tournees: any[] = [];
  filteredTournees: any[] = [];
  groupedByAgriculteur: AgriculteurGroup[] = [];
  paginatedTournees: any[] = [];

  // Pagination
  itemsPerPage = 10;
  totalPages = 1;
  currentPage = 1;
  totalElements = 0;
  backendPage = 0;

  // Filters
  selectedStatut = '';
  searchTerm = '';

  // Loading & Messages
  isLoading = false;
  successMessage = '';
  errorMessage = '';

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

  // Delivery summary stats
  livraisonSummary = {
    aLivrer: 0,
    enLivraison: 0,
    livree: 0
  };

  // Cached stats
  private statCounts = {
    total: 0,
    planifiee: 0,
    enCours: 0,
    terminee: 0,
    enLivraison: 0,
    livree: 0,
    annulee: 0
  };

  // Search debouncer
  private searchSubject = new Subject<string>();
  private readonly SEARCH_DEBOUNCE_MS = 300;

  // Cache for enriched tournées
  private tourneeCache = new Map<string, any>();

  constructor(
    private tourneeService: TourneeService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {
    this.searchSubject.pipe(
      debounceTime(this.SEARCH_DEBOUNCE_MS),
      distinctUntilChanged()
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  get pageTitle(): string {
    return 'Liste des tournées';
  }

  get pageSubtitle(): string {
    return 'Planifiez, suivez et gérez les tournées de récolte';
  }

  ngOnInit() {
    this.checkMobile();
    this.userRole = this.authService.getUserRole();
    this.loadTournees();
  }

  ngOnDestroy() {
    this.searchSubject.complete();
    this.tourneeCache.clear();
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
    if (this.isLoading) return;
    
    this.isLoading = true;

    this.tourneeService.getAll().subscribe({
      next: (data: any) => {
        const tourneeArray = Array.isArray(data) ? data : (data?.tournees || data?.content || []);
        this.totalElements = tourneeArray.length;
        this.tournees = tourneeArray.map((t: any) => this.enrichTournee(t));
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

  private enrichTournee(t: any): any {
    const cacheKey = t.id || t._id;
    if (this.tourneeCache.has(cacheKey)) {
      return this.tourneeCache.get(cacheKey);
    }
    
    const enriched = {
      ...t,
      displayVergerTypeOlive: t.vergerTypeOlive || t.verger?.typeOlive || 'N/A',
      displayVergerAgriculteurNom: t.vergerAgriculteurNom || this.extractAgriculteurName(t.verger?.agriculteur),
      displayQuantiteCollectee: t.quantiteCollecteeKg && t.quantiteCollecteeKg > 0 ? t.quantiteCollecteeKg.toFixed(1) : '0',
      displayTotalCollecte: t.totalCollecteVergerKg ? t.totalCollecteVergerKg.toFixed(1) : '0',
      displayEfficaciteValue: t.efficacite ? t.efficacite.toFixed(1) : 'N/A',
      displayLivraisonStatus: this.computeLivraisonStatus(t),
      formattedDateDebut: this.formatDateTimeCached(t.dateDebut),
      formattedDateFin: this.formatDateTimeCached(t.dateFin),
      formattedDate: this.formatDateCached(t.dateDebut)
    };
    
    this.tourneeCache.set(cacheKey, enriched);
    return enriched;
  }

  private computeLivraisonStatus(tournee: any): string {
    if (tournee.statut === 'TERMINEE') return 'A_LIVRER';
    if (tournee.statut === 'EN_LIVRAISON') return 'EN_LIVRAISON';
    if (tournee.statut === 'LIVREE') return 'LIVREE';
    if (tournee.statut === 'EN_COURS') return 'COLLECTE_EN_COURS';
    return 'NON_DISPONIBLE';
  }

  // Cached date formatters
  private dateTimeCache = new Map<string, string>();
  private dateCache = new Map<string, string>();

  private formatDateTimeCached(date: any): string {
    if (!date) return 'N/A';
    const key = `dt_${date}`;
    if (this.dateTimeCache.has(key)) return this.dateTimeCache.get(key)!;
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
      const result = d.toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      this.dateTimeCache.set(key, result);
      return result;
    } catch (e) {
      return 'N/A';
    }
  }

  private formatDateCached(date: any): string {
    if (!date) return 'N/A';
    const key = `d_${date}`;
    if (this.dateCache.has(key)) return this.dateCache.get(key)!;
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
      const result = d.toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
      this.dateCache.set(key, result);
      return result;
    } catch (e) {
      return 'N/A';
    }
  }

  private extractAgriculteurName(agriculteur: any): string {
    if (!agriculteur) return 'N/A';
    if (typeof agriculteur === 'object') {
      const fullName = `${agriculteur.prenom || ''} ${agriculteur.nom || ''}`.trim();
      return fullName || 'N/A';
    }
    return 'N/A';
  }

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

  // ==================== GROUPING LOGIC ====================
  groupByAgriculteurAndVerger() {
    const agriculteurMap = new Map<string, AgriculteurGroup>();

    for (const tournee of this.filteredTournees) {
      let agriculteurId = 'non-assigne';
      let agriculteurNom = 'Non assigné';
      let vergerId = 'sans-verger';
      let vergerNom = 'Verger inconnu';

      if (tournee.verger) {
        if (typeof tournee.verger === 'object') {
          vergerId = tournee.verger._id || tournee.verger.id;
          vergerNom = tournee.verger.typeOlive || 'Verger inconnu';
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
          vergerId = tournee.verger;
          vergerNom = `Verger ${vergerId.substring(0, 8)}`;
        }
      }

      if (tournee.vergerTypeOlive) vergerNom = tournee.vergerTypeOlive;
      if (tournee.vergerAgriculteurNom) agriculteurNom = tournee.vergerAgriculteurNom;

      let agriculteur = agriculteurMap.get(agriculteurId);
      if (!agriculteur) {
        agriculteur = {
          id: agriculteurId,
          nom: agriculteurNom,
          initials: this.getInitials(agriculteurNom),
          vergers: [],
          expanded: true,
          totalTournees: 0,
          totalQuantite: 0,
          totalEfficacite: 0
        };
        agriculteurMap.set(agriculteurId, agriculteur);
      }

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

      verger.tournees.push(tournee);
      verger.totalQuantite += tournee.quantiteCollecteeKg || 0;
      verger.totalTournees++;
      if (tournee.efficacite) verger.totalEfficacite += tournee.efficacite;

      agriculteur.totalQuantite += tournee.quantiteCollecteeKg || 0;
      agriculteur.totalTournees++;
      if (tournee.efficacite) agriculteur.totalEfficacite += tournee.efficacite;
    }

    for (const agriculteur of agriculteurMap.values()) {
      agriculteur.moyenneEfficacite = agriculteur.totalTournees > 0
        ? agriculteur.totalEfficacite / agriculteur.totalTournees : 0;
      for (const verger of agriculteur.vergers) {
        verger.moyenneEfficacite = verger.totalTournees > 0
          ? verger.totalEfficacite / verger.totalTournees : 0;
      }
      agriculteur.vergers.sort((a, b) => a.nom.localeCompare(b.nom));
    }

    this.groupedByAgriculteur = Array.from(agriculteurMap.values())
      .sort((a, b) => a.nom.localeCompare(b.nom));
  }

  private updateStats(): void {
    let planifiee = 0, enCours = 0, terminee = 0, enLivraison = 0, livree = 0, annulee = 0;
    let aLivrer = 0;
    
    for (const t of this.filteredTournees) {
      switch (t.statut) {
        case 'PLANIFIEE': planifiee++; break;
        case 'EN_COURS': enCours++; break;
        case 'TERMINEE': terminee++; aLivrer++; break;
        case 'EN_LIVRAISON': enLivraison++; break;
        case 'LIVREE': livree++; break;
        case 'ANNULEE': annulee++; break;
      }
    }
    
    this.statCounts = {
      total: this.filteredTournees.length,
      planifiee,
      enCours,
      terminee,
      enLivraison,
      livree,
      annulee
    };
    
    this.livraisonSummary = {
      aLivrer,
      enLivraison,
      livree
    };
    
    this.totalQuantite = this.filteredTournees.reduce((sum, t) => sum + (t.quantiteCollecteeKg || 0), 0);
    
    const uniqueAgriculteurs = new Set(this.filteredTournees.map(t => t.displayVergerAgriculteurNom || 'N/A'));
    const uniqueVergers = new Set(this.filteredTournees.map(t => t.displayVergerTypeOlive || 'N/A'));
    this.totalAgriculteurs = uniqueAgriculteurs.size;
    this.totalVergers = uniqueVergers.size;
  }

  getInitials(name: string): string {
    if (!name || name === 'Non assigné') return 'NA';
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
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
    for (const a of this.groupedByAgriculteur) {
      a.expanded = true;
      for (const v of a.vergers) v.expanded = true;
    }
    this.cdr.markForCheck();
  }

  collapseAll() {
    for (const a of this.groupedByAgriculteur) {
      a.expanded = false;
      for (const v of a.vergers) v.expanded = false;
    }
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
        t.displayVergerTypeOlive?.toLowerCase().includes(term) ||
        t.displayVergerAgriculteurNom?.toLowerCase().includes(term)
      );
    }

    this.filteredTournees = filtered;
    this.currentPage = 1;
    this.updateStats();
    this.updatePagination();

    if (this.viewMode === 'grouped') {
      this.groupByAgriculteurAndVerger();
    }
    
    this.cdr.markForCheck();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredTournees.length / this.itemsPerPage) || 1;
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedTournees = this.filteredTournees.slice(start, start + this.itemsPerPage);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
      this.cdr.markForCheck();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
      this.cdr.markForCheck();
    }
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatut = '';
    this.applyFilters();
  }

  getStatutCount(statut: string): number {
    switch (statut) {
      case 'PLANIFIEE': return this.statCounts.planifiee;
      case 'EN_COURS': return this.statCounts.enCours;
      case 'TERMINEE': return this.statCounts.terminee;
      case 'EN_LIVRAISON': return this.statCounts.enLivraison;
      case 'LIVREE': return this.statCounts.livree;
      case 'ANNULEE': return this.statCounts.annulee;
      default: return 0;
    }
  }

  onFilterChange() {
    this.applyFilters();
  }

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  refreshList() {
    this.tourneeCache.clear();
    this.dateTimeCache.clear();
    this.dateCache.clear();
    this.loadTournees();
    this.successMessage = 'Liste actualisée';
    setTimeout(() => this.successMessage = '', 3000);
  }

  // ==================== STATUT UTILITIES ====================
  getStatutClass(statut: string): string {
    const classes: Record<string, string> = {
      'PLANIFIEE': 'statut-planifiee',
      'EN_COURS': 'statut-en-cours',
      'TERMINEE': 'statut-terminee',
      'EN_LIVRAISON': 'statut-en-livraison',
      'LIVREE': 'statut-livree',
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

  // ==================== DATE/TIME FORMATTING ====================
  formatDateTime(date: any): string {
    return this.formatDateTimeCached(date);
  }

  formatDate(date: any): string {
    return this.formatDateCached(date);
  }

  formatTime(seconds: number): string {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${seconds} secondes`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes < 60) return `${minutes}min ${secs}s`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  }

  // ==================== NAVIGATION ====================
  navigateToCreate() {
    this.router.navigate(['/tournees/create']);
  }

  navigateToEdit(id: string) {
    this.router.navigate(['/tournees/edit', id]);
  }

  viewDetails(id: string) {
    this.router.navigate(['/tournees', id]);
  }

  // ==================== TOURNEE ACTIONS (Admin only) ====================
  startTournee(id: string) {
    if (confirm('Démarrer cette tournée ?')) {
      this.tourneeService.demarrer(id).subscribe({
        next: () => {
          this.successMessage = 'Tournée démarrée avec succès';
          this.refreshList();
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
            this.refreshList();
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
    if (confirm('Annuler cette tournée ?')) {
      this.tourneeService.annuler(id).subscribe({
        next: () => {
          this.successMessage = 'Tournée annulée';
          this.refreshList();
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