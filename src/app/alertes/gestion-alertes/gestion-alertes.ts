// src/app/alertes/gestion-alertes/gestion-alertes.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlerteService, AlerteResponse, TypeAlerte, StatutAlerte, NiveauUrgence } from '../../services/alerte';
import { AuthService } from '../../services/auth';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-gestion-alertes',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBarResponsable],
  templateUrl: './gestion-alertes.html',
  styleUrl: './gestion-alertes.css'
})
export class GestionAlertesComponent implements OnInit, OnDestroy, AfterViewInit {
  alertes: AlerteResponse[] = [];
  filteredAlertes: AlerteResponse[] = [];
  isLoading = true;

  isSidebarCollapsed = false;
  isMobile = false;
  userRole = '';
  isAdmin = false;

  // Filter Properties
  searchQuery = '';
  selectedStatus: StatutAlerte | '' = '';
  selectedUrgence: NiveauUrgence | '' = '';
  selectedType: TypeAlerte | '' = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;

  // Alert type mapping with icons
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
    { value: 'TRAITEE', label: 'Traitée', color: '#10B981', icon: 'bi-check-circle-fill' }
  ];

  readonly urgenceOptions = [
    { value: 'FAIBLE', label: 'Faible', color: '#10B981', icon: 'bi-info-circle-fill' },
    { value: 'MOYENNE', label: 'Moyenne', color: '#F59E0B', icon: 'bi-exclamation-circle-fill' },
    { value: 'ELEVEE', label: 'Élevée', color: '#EF4444', icon: 'bi-exclamation-triangle-fill' },
    { value: 'CRITIQUE', label: 'Critique', color: '#991B1B', icon: 'bi-exclamation-octagon-fill' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private alerteService: AlerteService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkUserRole();
    this.checkMobile();
    this.loadAlertes();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile && this.isSidebarCollapsed) {
      this.isSidebarCollapsed = false;
    }
  }

  checkUserRole(): void {
    const role = this.authService.getUserRole();
    this.userRole = role;
    this.isAdmin = role === 'ADMIN';
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  loadAlertes(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    const endpoint$ = this.isAdmin 
      ? this.alerteService.getAll() 
      : this.alerteService.getAlertesResponsable();

    endpoint$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.alertes = data || [];
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading alerts:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    let result = [...this.alertes];

    // Search filter
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(a =>
        (a.description || '').toLowerCase().includes(q) ||
        (a.agriculteurNom || '').toLowerCase().includes(q) ||
        (a.vergerTypeOlive || '').toLowerCase().includes(q) ||
        (a.type || '').toLowerCase().includes(q)
      );
    }

    // Status filter
    if (this.selectedStatus) {
      result = result.filter(a => a.statut === this.selectedStatus);
    }

    // Urgence filter
    if (this.selectedUrgence) {
      result = result.filter(a => a.niveauUrgence === this.selectedUrgence);
    }

    // Type filter
    if (this.selectedType) {
      result = result.filter(a => a.type === this.selectedType);
    }

    // Sort by urgence (CRITIQUE first), then by date (newest first)
    result.sort((a, b) => {
      const urgenceOrder: Record<NiveauUrgence, number> = {
        'CRITIQUE': 0,
        'ELEVEE': 1,
        'MOYENNE': 2,
        'FAIBLE': 3
      };
      const urgenceDiff = (urgenceOrder[a.niveauUrgence] || 4) - (urgenceOrder[b.niveauUrgence] || 4);
      if (urgenceDiff !== 0) return urgenceDiff;
      return new Date(b.dateSignalement).getTime() - new Date(a.dateSignalement).getTime();
    });

    this.filteredAlertes = result;
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.selectedUrgence = '';
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

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  openModifierPage(alerteId: string): void {
    this.router.navigate(['/alertes/modifier', alerteId]);
  }

  // Helper Methods
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
}