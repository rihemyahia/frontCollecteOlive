import { AuthService } from './../../services/auth';
import { Component, OnInit, HostListener, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VergerService } from '../../services/verger';
import { VergerResponse } from '../../models/verger';
import { StatutVerger } from '../../models/enums/statut-verger';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { StatutVergerLabelPipe } from '../../pipes/statut-verger-label-pipe';

@Component({
  selector: 'app-liste-vergers',
  standalone: true,
  imports: [CommonModule, FormsModule, StatutVergerLabelPipe, SideBarResponsable],
  templateUrl: './liste-vergers.html',
  styleUrl: './liste-vergers.css'
})
export class ListeVergersComponent implements OnInit {

  vergers: VergerResponse[] = [];
  filteredVergers: VergerResponse[] = [];
  searchTerm = '';
  isLoading = false;
  errorMessage = '';
  StatutVerger = StatutVerger;

  isSidebarCollapsed = false;
  isMobile = false;
  userRole: string = '';

  constructor(
    private vergerService: VergerService,
    public router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef   // ← ADD THIS
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
    this.loadVergers();
  }

  trackById(index: number, item: VergerResponse): string {
    return item.id;
  }

  loadVergers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    const role = this.authService.getUserRole();

    const obs = (role === 'AGRICULTEUR')
      ? this.vergerService.getByAgriculteur(this.authService.getUserId())
      : this.vergerService.getAll();

    obs.subscribe({
      next: data => {
        this.vergers = [...data];          // spread forces new reference
        this.filteredVergers = [...data];  // spread forces new reference
        this.isLoading = false;
        this.cdr.detectChanges();          // ← FORCE re-render
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement.';
        this.isLoading = false;
        this.cdr.detectChanges();          // ← also here
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredVergers = this.vergers.filter(v =>
      v.agriculteurNom.toLowerCase().includes(term) ||
      v.typeOlive.toLowerCase().includes(term) ||
      (v.statut || '').toString().toLowerCase().includes(term)
    );
    this.cdr.detectChanges();              // ← and after filter
  }

  private searchTimeout: any;
  applyFilterDebounced(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.applyFilter(), 300);
  }

  getStatutCount(statut: StatutVerger): number {
    return this.filteredVergers.filter(v => v.statut === statut).length;
  }

  supprimer(id: string): void {
    if (!confirm('Supprimer ce verger ?')) return;
    this.vergerService.desactiver(id).subscribe({
      next: () => this.loadVergers(),
      error: () => {
        this.errorMessage = 'Erreur lors de la suppression.';
        this.cdr.detectChanges();
      }
    });
  }

  changerStatut(id: string, statut: StatutVerger): void {
    this.vergerService.changerStatut(id, statut).subscribe({
      next: () => this.loadVergers(),
      error: () => {
        this.errorMessage = 'Erreur lors du changement de statut.';
        this.cdr.detectChanges();
      }
    });
  }

  getStatutClass(statut: StatutVerger): string {
    return ({
      [StatutVerger.NON_RECOLTE]: 'badge-warning',
      [StatutVerger.EN_COURS]:    'badge-info',
      [StatutVerger.RECOLTE]:     'badge-success'
    } as Record<string, string>)[statut] ?? '';
  }

  isResponsableOrAdmin(): boolean {
    return this.userRole === 'RESPONSABLE' || this.userRole === 'ADMIN';
  }
}
