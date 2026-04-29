// src/app/tournees/tournee-list/tournee-list.component.ts
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TourneeService } from '../../services/tournee';
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
  viewMode: 'table' | 'cards' | 'grouped' = 'grouped';

  // Data
  tournees: any[] = [];
  filteredTournees: any[] = [];
  groupedByAgriculteur: AgriculteurGroup[] = [];

  // Pagination
  paginatedTournees: any[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

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

  constructor(
    private tourneeService: TourneeService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.checkMobile();
    this.loadTournees();
    this.userRole = this.authService.getUserRole();

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
  loadTournees() {
    this.isLoading = true;
    this.tourneeService.getAll().subscribe({
      next: (data) => {
        console.log('Tournées reçues:', data);
        this.tournees = data.map(t => ({
          ...t,
          formattedDateDebut: this.formatDateTime(t.dateDebut),
          formattedDateFin: this.formatDateTime(t.dateFin),
          formattedDate: this.formatDate(t.dateDebut)
        }));
        this.applyFilters();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des tournées';
        this.isLoading = false;
        this.cdr.markForCheck();
        console.error(err);
      }
    });
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
    this.totalAgriculteurs = this.groupedByAgriculteur.length;
    this.totalVergers = this.groupedByAgriculteur.reduce((sum, a) => sum + a.vergers.length, 0);
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
    this.updatePagination();
    this.groupByAgriculteurAndVerger();
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
    return this.filteredTournees.filter(t => t.statut === statut).length;
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
      'ANNULEE': 'statut-annulee'
    };
    return classes[statut] || '';
  }

  getStatutIcon(statut: string): string {
    const icons: Record<string, string> = {
      'PLANIFIEE': '📋',
      'EN_COURS': '🔄',
      'TERMINEE': '✅',
      'ANNULEE': '❌'
    };
    return icons[statut] || '📌';
  }

  getStatutText(statut: string): string {
    const texts: Record<string, string> = {
      'PLANIFIEE': 'Planifiée',
      'EN_COURS': 'En cours',
      'TERMINEE': 'Terminée',
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
    this.router.navigate(['/tournees/create']);
  }

  navigateToEdit(id: string) {
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