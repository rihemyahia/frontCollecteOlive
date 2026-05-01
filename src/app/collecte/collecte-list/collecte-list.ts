// src/app/collecte/collecte-list/collecte-list.component.ts
import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CollecteService, Collecte } from '../../services/collecte';
import { VergerService } from '../../services/verger';
import { AuthService } from '../../services/auth';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-collecte-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBarResponsable],
  templateUrl: './collecte-list.html',
  styleUrls: ['./collecte-list.css']
})
export class CollecteListComponent implements OnInit {
  isSidebarCollapsed = false;
  userRole = '';
  collectes: Collecte[] = [];
  filteredCollectes: Collecte[] = [];
  paginatedCollectes: Collecte[] = [];
  isLoading = true;
  successMessage = '';
  errorMessage = '';
  selectedAnnee: string = '';
  searchTerm: string = '';
  annees: string[] = [];
  isMobile: boolean = false;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  
  private searchSubject = new Subject<string>();

  constructor(
    private collecteService: CollecteService,
    private vergerService: VergerService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  ngOnInit() {
    this.userRole = this.authService.getUserRole();
    this.loadCollectes();
    this.checkMobile();
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile && this.isSidebarCollapsed) {
      this.isSidebarCollapsed = false;
    }
  }

  loadCollectes() {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.collecteService.getAll().subscribe({
      next: (data) => {
        console.log('Collectes reçues:', data);
        this.collectes = data || [];
        this.loadVergerNames();
        this.extractAnnees();
        this.applyFilters();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.errorMessage = 'Erreur lors du chargement des collectes';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadVergerNames() {
    this.collectes.forEach(collecte => {
      if (collecte.vergerId && !collecte.vergerNom) {
        this.vergerService.getById(collecte.vergerId).subscribe({
          next: (verger: any) => {
            if (verger) {
              let vergerName = verger.typeOlive || 'Verger';
              if (verger.agriculteur?.nom) {
                vergerName += ` - ${verger.agriculteur.prenom || ''} ${verger.agriculteur.nom}`;
              } else if (verger.agriculteurNom) {
                vergerName += ` - ${verger.agriculteurNom}`;
              }
              collecte.vergerNom = vergerName;
            } else {
              collecte.vergerNom = 'Verger inconnu';
            }
            this.cdr.markForCheck();
          },
          error: () => {
            collecte.vergerNom = 'Verger inconnu';
            this.cdr.markForCheck();
          }
        });
      } else if (!collecte.vergerNom) {
        collecte.vergerNom = 'Verger inconnu';
      }
    });
  }

  extractAnnees() {
    const anneeSet = new Set<string>();
    this.collectes.forEach(c => {
      if (c.annee) anneeSet.add(c.annee);
    });
    this.annees = Array.from(anneeSet).sort().reverse();
  }

  applyFilters() {
    let filtered = [...this.collectes];

    // Filter by year
    if (this.selectedAnnee) {
      filtered = filtered.filter(c => c.annee === this.selectedAnnee);
    }

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.code?.toLowerCase().includes(term) ||
        c.vergerNom?.toLowerCase().includes(term) ||
        c.annee?.toLowerCase().includes(term)
      );
    }

    this.filteredCollectes = filtered;
    this.currentPage = 1;
    this.updatePagination();
    this.cdr.markForCheck();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCollectes.length / this.itemsPerPage) || 1;
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedCollectes = this.filteredCollectes.slice(start, start + this.itemsPerPage);
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

  onFilterChange() {
    this.applyFilters();
  }

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  filterByAnnee(annee: string) {
    this.selectedAnnee = annee;
    this.applyFilters();
  }

  getFilteredCollectes(): Collecte[] {
    return this.filteredCollectes;
  }

  getTotalQuantite(): number {
    return this.filteredCollectes.reduce((sum, c) => sum + (c.quantiteTotaleKg || 0), 0);
  }

  getStatutCount(statut: string): number {
    return this.filteredCollectes.filter(c => c.statut === statut).length;
  }

  getStatutClass(statut: string): string {
    const classes: Record<string, string> = {
      'PLANIFIEE': 'statut-planifiee',
      'EN_COURS': 'statut-en-cours',
      'TERMINEE': 'statut-terminee'
    };
    return classes[statut] || '';
  }

  getStatutIcon(statut: string): string {
    const icons: Record<string, string> = {
      'PLANIFIEE': 'bi-calendar-check',
      'EN_COURS': 'bi-play-circle',
      'TERMINEE': 'bi-check-circle'
    };
    return icons[statut] || 'bi-question-circle';
  }

  viewCollecte(id: string) {
    console.log('View collecte ID:', id);
    if (!id) {
      console.error('No ID provided');
      return;
    }
    
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('currentUser');
    
    if (!token || !user) {
      console.error('No auth! Redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    this.router.navigate(['/collectes', id]).then(result => {
      console.log('Navigation result:', result);
    }).catch(err => {
      console.error('Navigation error:', err);
    });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  trackByCollecteId(index: number, collecte: Collecte): string {
    return collecte.id || index.toString();
  }
}