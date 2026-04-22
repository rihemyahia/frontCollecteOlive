import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlerteService, AlerteResponse, TypeAlerte, StatutAlerte, NiveauUrgence, PhaseCulturale } from '../../services/alerte';
import { AuthService } from '../../services/auth';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';

@Component({
  selector: 'app-alertes-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SideBarResponsable],
  templateUrl: './alertes-list.html',
  styleUrl: './alertes-list.css'
})
export class AlertesListComponent implements OnInit {
  alertes: AlerteResponse[] = [];
  filteredAlertes: AlerteResponse[] = [];

  // Filters
  searchQuery = '';
  selectedStatus: StatutAlerte | '' = '';
  selectedUrgence: NiveauUrgence | '' = '';
  selectedPhase: PhaseCulturale | '' = '';
  selectedType: TypeAlerte | '' = '';

  // UI State
  isLoading = false;
  errorMessage = '';
  userRole = '';
  isSidebarCollapsed = false;
  isMobile = false;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;

  // Type options for dropdown
  types: TypeAlerte[] = [
    'MATURITE', 'MALADIE', 'METEO', 'RECOLTE', 'AUTRE', 'NUISIBLE',
    'IRRIGATION', 'QUALITE_HUILE', 'SECURITE_RECOLTE', 'MATURITE_ACCELEREE',
    'CHUTE_PREMATUREE', 'LOGISTIQUE_MOULIN', 'RENDEMENT_ANORMAL'
  ];

  statuses: StatutAlerte[] = ['EN_ATTENTE', 'TRAITEE', 'IGNOREE'];
  urgences: NiveauUrgence[] = ['FAIBLE', 'MOYENNE', 'ELEVEE', 'CRITIQUE'];
  phases: PhaseCulturale[] = ['FLORAISON', 'NOUAISON', 'VERDAISON', 'PRE_RECOLTE', 'RECOLTE', 'INCONNUE'];

  constructor(
    private alerteService: AlerteService,
    private authService: AuthService,
    public router: Router,
    private cdr: ChangeDetectorRef
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
    this.loadAlertes();
  }

  loadAlertes(): void {
    this.isLoading = true;
    this.errorMessage = '';
    const isAdmin = this.userRole === 'ADMIN';

    const obs = isAdmin
      ? this.alerteService.getAll()
      : this.alerteService.getByResponsable();

    obs.subscribe({
      next: (data) => {
        this.alertes = data;
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des alertes.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    this.filteredAlertes = this.alertes.filter(a => {
      const matchSearch = !this.searchQuery || 
        a.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        a.agriculteurNom.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        a.vergerTypeOlive.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchStatus = !this.selectedStatus || a.statut === this.selectedStatus;
      const matchUrgence = !this.selectedUrgence || a.niveauUrgence === this.selectedUrgence;
      const matchPhase = !this.selectedPhase || a.phase === this.selectedPhase;
      const matchType = !this.selectedType || a.type === this.selectedType;

      return matchSearch && matchStatus && matchUrgence && matchPhase && matchType;
    });

    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  private searchTimeout: any;
  applyFilterDebounced(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.applyFilters(), 300);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.selectedUrgence = '';
    this.selectedPhase = '';
    this.selectedType = '';
    this.applyFilters();
  }

  // Pagination
  get totalPages(): number {
    return Math.ceil(this.filteredAlertes.length / this.itemsPerPage) || 1;
  }

  get paginatedAlertes(): AlerteResponse[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredAlertes.slice(start, end);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      window.scrollTo(0, 0);
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      window.scrollTo(0, 0);
    }
  }

  // Navigation
  viewAlert(id: string): void {
    this.router.navigate(['/alertes/detail', id]);
  }

  trackByAlertId(index: number, item: AlerteResponse): string {
    return item.id;
  }

  // Helper methods
  getUrgenceColor(urgence: NiveauUrgence): string {
    const colors: { [key in NiveauUrgence]: string } = {
      'CRITIQUE': '#D32F2F',
      'ELEVEE': '#F57C00',
      'MOYENNE': '#FBC02D',
      'FAIBLE': '#388E3C'
    };
    return colors[urgence] || '#999';
  }

  getStatutLabel(statut: StatutAlerte): string {
    const labels: { [key in StatutAlerte]: string } = {
      'EN_ATTENTE': 'En attente',
      'TRAITEE': 'Traitée',
      'IGNOREE': 'Ignorée'
    };
    return labels[statut];
  }

  getStatusBadgeClass(statut: StatutAlerte): string {
    const classes: { [key in StatutAlerte]: string } = {
      'EN_ATTENTE': 'badge-warning',
      'TRAITEE': 'badge-success',
      'IGNOREE': 'badge-secondary'
    };
    return classes[statut];
  }

  getAlertTypeLabel(type: TypeAlerte): string {
    const labels: { [key in TypeAlerte]: string } = {
      'MATURITE': '🫒 Maturité',
      'MALADIE': '🐛 Maladie',
      'METEO': '⛈️ Météo',
      'RECOLTE': '🧺 Récolte',
      'AUTRE': '📌 Autre',
      'NUISIBLE': '🦗 Nuisible',
      'IRRIGATION': '💧 Irrigation',
      'QUALITE_HUILE': '🫒 Qualité huile',
      'SECURITE_RECOLTE': '⚠️ Sécurité',
      'MATURITE_ACCELEREE': '⏱️ Maturité accélérée',
      'CHUTE_PREMATUREE': '📉 Chute prématurée',
      'LOGISTIQUE_MOULIN': '🏭 Logistique',
      'RENDEMENT_ANORMAL': '📊 Rendement anormal'
    };
    return labels[type];
  }

  isAdmin(): boolean {
    return this.userRole === 'ADMIN';
  }

  // Stat calculation methods
  getEnAttenteCount(): number {
    return this.filteredAlertes.filter(a => a.statut === 'EN_ATTENTE').length;
  }

  getTraiteesCount(): number {
    return this.filteredAlertes.filter(a => a.statut === 'TRAITEE').length;
  }

  getCritiquesCount(): number {
    return this.filteredAlertes.filter(a => a.niveauUrgence === 'CRITIQUE').length;
  }
}
