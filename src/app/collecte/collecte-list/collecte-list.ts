// src/app/collecte/collecte-list/collecte-list.component.ts
import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CollecteService, Collecte } from '../../services/collecte';
import { VergerService } from '../../services/verger';
import { AuthService } from '../../services/auth';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';

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
  isLoading = true;
  errorMessage = '';
  selectedAnnee: string = '';
  annees: string[] = [];
  isMobile: boolean = false;  // ← ADD THIS

  constructor(
    private collecteService: CollecteService,
    private vergerService: VergerService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.userRole = this.authService.getUserRole();
    this.loadCollectes();
    this.checkMobile();  // ← ADD THIS
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
        // Log each collecte's ID
        data.forEach((c, index) => {
          console.log(`Collecte ${index}: ID=${c.id}, Code=${c.code}`);
        });
        this.collectes = data || [];
        this.loadVergerNames();
        this.extractAnnees();
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

  filterByAnnee(annee: string) {
    this.selectedAnnee = annee;
    this.cdr.markForCheck();
  }

  getFilteredCollectes(): Collecte[] {
    if (!this.selectedAnnee) return this.collectes;
    return this.collectes.filter(c => c.annee === this.selectedAnnee);
  }

  getTotalQuantite(): number {
    return this.getFilteredCollectes().reduce((sum, c) => sum + (c.quantiteTotaleKg || 0), 0);
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
    console.log('🚨🚨🚨 VIEW COLLECTE CLICKED! ID:', id);
    console.log('🚨 Current URL:', this.router.url);

    // Check authentication
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('currentUser');
    console.log('🚨 Has token:', !!token);
    console.log('🚨 Has user:', !!user);

    if (!token || !user) {
      console.error('🚨 No auth! Redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    // Navigate
    this.router.navigate(['/collectes', id]).then(result => {
      console.log('🚨 Navigation result:', result);
    }).catch(err => {
      console.error('🚨 Navigation error:', err);
    });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}