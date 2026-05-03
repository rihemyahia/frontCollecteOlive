import { AfterViewInit, Component, HostListener, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { PressoirService, TourneeLivree } from '../../services/pressoir';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';

@Component({
  selector: 'app-pressoir-tournees-livrees',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBarResponsable],
  templateUrl: './tournees-livrees.html',
  styleUrls: ['../pressoir.css']
})
export class PressoirTourneesLivreesComponent implements OnInit, AfterViewInit {
  isSidebarCollapsed = false;
  userRole = 'RESPONSABLE_PRESSOIR';
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  tournees: TourneeLivree[] = [];
  selectedTournee: TourneeLivree | null = null;
  receptionForm = { quantiteOlivesRecueKg: null as number | null, observations: '' };
  private wasMobile = false;

  constructor(
    private pressoirService: PressoirService,
    private authService: AuthService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole() || 'RESPONSABLE_PRESSOIR';
    this.loadTournees();
    this.checkMobile();
  }

  ngAfterViewInit(): void {
    this.refreshLayout();
  }

  @HostListener('window:resize')
  checkMobile(): void {
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      this.isSidebarCollapsed = true;
    } else if (this.wasMobile) {
      this.isSidebarCollapsed = false;
    }

    this.wasMobile = isMobile;
  }

  toggleSidebar(collapsed?: boolean): void {
    this.isSidebarCollapsed = typeof collapsed === 'boolean' ? collapsed : !this.isSidebarCollapsed;
    this.refreshLayout();
  }

  loadTournees(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.pressoirService.getTourneesLivrees().subscribe({
      next: data => {
        this.tournees = data || [];
        this.isLoading = false;
        this.refreshLayout();
      },
      error: err => {
        this.errorMessage = this.getError(err, 'Erreur lors du chargement des tournees livrees');
        this.isLoading = false;
      }
    });
  }

  openReceptionModal(tournee: TourneeLivree): void {
    this.selectedTournee = tournee;
    this.receptionForm = { quantiteOlivesRecueKg: tournee.quantiteCollecteeKg || null, observations: '' };
  }

  closeModal(): void {
    this.selectedTournee = null;
    this.isSubmitting = false;
  }

  submitReception(): void {
    if (!this.selectedTournee || !this.receptionForm.quantiteOlivesRecueKg || this.receptionForm.quantiteOlivesRecueKg <= 0) {
      this.errorMessage = 'Veuillez saisir une quantite recue valide';
      return;
    }
    this.isSubmitting = true;
    this.errorMessage = '';
    this.pressoirService.receptionnerTournee(this.selectedTournee.id, {
      quantiteOlivesRecueKg: this.receptionForm.quantiteOlivesRecueKg,
      observations: this.receptionForm.observations
    }).subscribe({
      next: () => {
        this.tournees = this.tournees.filter(t => t.id !== this.selectedTournee?.id);
        this.successMessage = 'Olives receptionnees avec succes';
        this.closeModal();
        this.refreshLayout();
      },
      error: err => {
        this.errorMessage = this.getError(err, 'Erreur lors de la reception des olives');
        this.isSubmitting = false;
      }
    });
  }

  formatDate(value?: string | Date): string {
    return value ? new Date(value).toLocaleString('fr-FR') : '-';
  }

  private getError(err: any, fallback: string): string {
    return err?.error?.error || err?.error?.message || err?.message || fallback;
  }

  private refreshLayout(): void {
    if (typeof window === 'undefined' || typeof requestAnimationFrame === 'undefined') return;

    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    });
  }
}
