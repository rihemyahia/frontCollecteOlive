import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TravailleurService, Travailleur } from '../../services/travailleur';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';

@Component({
  selector: 'app-liste-travailleurs',
  standalone: true,
  imports: [CommonModule, RouterModule, SideBarResponsable],
  templateUrl: './liste-travailleurs.html',
  styleUrls: ['./liste-travailleurs.css']
})
export class ListeTravailleurs implements OnInit {
  travailleurs: Travailleur[] = [];
  isLoading = true;
  errorMessage = '';

  // Sidebar state
  isSidebarCollapsed = false;
  isMobile = false;
  userRole = '';

  constructor(
    private travailleurService: TravailleurService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkMobile();
    this.loadUserRole();
    this.loadTravailleurs();
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.isSidebarCollapsed = false;
    }
  }

  loadUserRole(): void {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        this.userRole = userData.role?.toUpperCase() || '';
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }

  loadTravailleurs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.travailleurService.getAll().subscribe({
      next: (data) => {
        console.log('🟢 COMPONENT next() called, data:', data);
        this.travailleurs = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('❌ COMPONENT error():', err);
        this.errorMessage = 'Erreur lors du chargement des travailleurs';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
deleteTravailleur(id: string | undefined): void {
  if (!id) return;

  if (confirm('Voulez-vous vraiment supprimer ce travailleur ?')) {
    this.travailleurService.delete(id).subscribe({
      next: () => {
        this.loadTravailleurs(); // or refresh the list
      },
      error: (err) => {
        console.error(err);
        // show error message
      }
    });
  }
}
viewTravailleur(id?: string): void {
  if (!id) return;
  this.router.navigate(['/travailleurs', id]);
}

editTravailleur(id?: string): void {
  if (!id) return;
  this.router.navigate(['/travailleurs/modifier', id]);
}

  getStatutClass(statut: string): string {
    const statutUpper = statut?.toUpperCase() || '';
    switch (statutUpper) {
      case 'ACTIF':
        return 'actif';
      case 'INACTIF':
        return 'inactif';
      case 'SUSPENDU':
        return 'suspendu';
      case 'CONGE':
        return 'conge';
      default:
        return 'inactif';
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}
