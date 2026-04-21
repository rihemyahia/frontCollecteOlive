// src/app/tournees/tournee-list/tournee-list.component.ts
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TourneeService } from '../../services/tournee';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { StatutTourneePipe } from '../../pipes/statut-tournee-pipe';

@Component({
  selector: 'app-tournee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, StatutTourneePipe, SideBarResponsable],
  templateUrl: './tournee-list.html',
  styleUrls: ['./tournee-list.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TourneeListComponent implements OnInit {
  isSidebarCollapsed = false;
  userRole = 'ADMIN';
  isMobile = false;

  tournees: any[] = [];
  filteredTournees: any[] = [];
  selectedStatut = '';
  searchTerm = '';
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  showCompleteModal = false;
  selectedTournee: any = null;
  completeData = {
    quantiteCollecteeKg: 0,
    distanceTotale: null,
    observations: ''
  };

  constructor(
    private tourneeService: TourneeService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.checkMobile();
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

  loadTournees() {
    this.isLoading = true;
    this.tourneeService.getAll().subscribe({
      next: (data) => {
        console.log('Tournées reçues:', data);
        // Format dates properly
        this.tournees = data.map(t => ({
          ...t,
          formattedDateDebut: this.formatDateTime(t.dateDebut),
          formattedDateFin: this.formatDateTime(t.dateFin)
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

  // FIXED: Proper date formatting that handles UTC correctly
  formatDateTime(date: any): string {
    if (!date) return 'N/A';

    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'N/A';

      // Format to local time (Tunisia UTC+1)
      return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC'
      });
    } catch (e) {
      console.error('Date parsing error:', e);
      return 'N/A';
    }
  }

  // Add this method to format time from seconds
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
  // Simple date formatter for display without time
  formatDate(date: any): string {
    if (!date) return 'N/A';

    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'N/A';

      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Africa/Tunis'
      });
    } catch (e) {
      return 'N/A';
    }
  }

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
        t.vergerAgriculteurNom?.toLowerCase().includes(term)
      );
    }

    this.filteredTournees = filtered;
    this.cdr.markForCheck();
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

  getStatutClass(statut: string): string {
    const classes: Record<string, string> = {
      'PLANIFIEE': 'statut-planifiee',
      'EN_COURS': 'statut-en-cours',
      'TERMINEE': 'statut-terminee',
      'ANNULEE': 'statut-annulee'
    };
    return classes[statut] || '';
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

  trackByTourneeId(index: number, tournee: any): string {
    return tournee.id || tournee._id;
  }

  navigateToCreate() {
    this.router.navigate(['/tournees/create']);
  }

  navigateToEdit(id: string) {
    this.router.navigate(['/tournees/edit', id]);
  }

  viewDetails(id: string) {
    this.router.navigate(['/tournees', id]);
  }

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
}
