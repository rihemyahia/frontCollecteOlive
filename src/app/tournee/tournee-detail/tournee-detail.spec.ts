// src/app/tournees/tournee-detail/tournee-detail.component.ts
import { Component, OnInit } from '@angular/core';
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tourneeService: TourneeService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTournee(id);
    }
  }

  loadTournee(id: string) {
    this.tourneeService.getById(id).subscribe({
      next: (data) => this.tournee = data,
      error: (err) => console.error(err)
    });
  }

  formatDate(date: Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
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

  startTournee() {
    if (confirm('Démarrer cette tournée ?')) {
      this.tourneeService.demarrer(this.tournee.id).subscribe(() => {
        this.loadTournee(this.tournee.id);
      });
    }
  }

  completeTournee() {
    const quantity = prompt('Quantité collectée (kg):');
    if (quantity && +quantity > 0) {
      this.tourneeService.terminer(this.tournee.id, { quantiteCollecteeKg: +quantity }).subscribe(() => {
        this.loadTournee(this.tournee.id);
      });
    }
  }

  cancelTournee() {
    if (confirm('Annuler cette tournée ?')) {
      this.tourneeService.annuler(this.tournee.id).subscribe(() => {
        this.loadTournee(this.tournee.id);
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
