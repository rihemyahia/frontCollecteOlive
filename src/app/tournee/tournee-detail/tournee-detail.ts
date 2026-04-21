import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TourneeService } from '../../services/tournee';
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tourneeService: TourneeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
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

  // Option 1: Use UTC (recommended)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    hour12: false
  });

  /* Option 2: Manual UTC extraction
  const day = d.getUTCDate().toString().padStart(2, '0');
  const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const year = d.getUTCFullYear();
  const hours = d.getUTCHours().toString().padStart(2, '0');
  const minutes = d.getUTCMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
  */
}

formatDuration(seconds: number): string {
  if (!seconds && seconds !== 0) return 'N/A';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}min`;
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

  getStatutIcon(statut: string): string {
    const icons: Record<string, string> = {
      'PLANIFIEE': 'bi-calendar-check',
      'EN_COURS': 'bi-play-circle',
      'TERMINEE': 'bi-check-circle',
      'ANNULEE': 'bi-x-circle'
    };
    return icons[statut] || 'bi-question-circle';
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
