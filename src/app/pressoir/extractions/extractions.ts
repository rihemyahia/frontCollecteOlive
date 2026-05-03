import { AfterViewInit, Component, HostListener, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { ExtractionHuile, ExtractionStatut, PressoirService, QualiteHuile } from '../../services/pressoir';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';

@Component({
  selector: 'app-pressoir-extractions',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBarResponsable],
  templateUrl: './extractions.html',
  styleUrls: ['../pressoir.css']
})
export class PressoirExtractionsComponent implements OnInit, AfterViewInit {
  isSidebarCollapsed = false;
  userRole = 'RESPONSABLE_PRESSOIR';
  isLoading = false;
  isSubmitting = false;
  activeTab: 'ALL' | ExtractionStatut = 'ALL';
  errorMessage = '';
  successMessage = '';
  extractions: ExtractionHuile[] = [];
  selectedExtraction: ExtractionHuile | null = null;
  qualites: QualiteHuile[] = ['EXTRA_VIERGE', 'VIERGE', 'COURANTE', 'LAMPANTE'];
  extractionForm = { quantiteHuileExtraiteL: null as number | null, qualiteHuile: 'EXTRA_VIERGE' as QualiteHuile, observations: '' };
  private wasMobile = false;

  constructor(
    private pressoirService: PressoirService,
    private authService: AuthService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole() || 'RESPONSABLE_PRESSOIR';
    this.loadExtractions();
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

  loadExtractions(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.pressoirService.getExtractions().subscribe({
      next: data => {
        this.extractions = data || [];
        this.isLoading = false;
        this.refreshLayout();
      },
      error: err => {
        this.errorMessage = this.getError(err, 'Erreur lors du chargement des extractions');
        this.isLoading = false;
      }
    });
  }

  filteredExtractions(): ExtractionHuile[] {
    return this.activeTab === 'ALL' ? this.extractions : this.extractions.filter(e => e.statut === this.activeTab);
  }

  openExtractionModal(extraction: ExtractionHuile): void {
    this.selectedExtraction = extraction;
    this.extractionForm = { quantiteHuileExtraiteL: extraction.quantiteHuileExtraiteL || null, qualiteHuile: extraction.qualiteHuile || 'EXTRA_VIERGE', observations: '' };
  }

  closeModal(): void {
    this.selectedExtraction = null;
    this.isSubmitting = false;
  }

  submitExtraction(): void {
    if (!this.selectedExtraction || !this.extractionForm.quantiteHuileExtraiteL || this.extractionForm.quantiteHuileExtraiteL <= 0) {
      this.errorMessage = 'Veuillez saisir une quantite huile valide';
      return;
    }
    this.isSubmitting = true;
    this.pressoirService.extraireHuile(this.selectedExtraction.id, {
      quantiteHuileExtraiteL: this.extractionForm.quantiteHuileExtraiteL,
      qualiteHuile: this.extractionForm.qualiteHuile,
      observations: this.extractionForm.observations
    }).subscribe({
      next: updated => {
        this.extractions = this.extractions.map(e => e.id === updated.id ? updated : e);
        this.successMessage = 'Extraction enregistree avec succes';
        this.closeModal();
        this.refreshLayout();
      },
      error: err => {
        this.errorMessage = this.getError(err, 'Erreur lors de l extraction');
        this.isSubmitting = false;
      }
    });
  }

  valider(extraction: ExtractionHuile): void {
    this.pressoirService.validerExtraction(extraction.id).subscribe({
      next: updated => {
        this.extractions = this.extractions.map(e => e.id === updated.id ? updated : e);
        this.successMessage = 'Extraction validee avec succes';
        this.refreshLayout();
      },
      error: err => this.errorMessage = this.getError(err, 'Erreur lors de la validation')
    });
  }

  getStatusLabel(statut: string): string {
    return statut === 'RECUE' ? 'En attente extraction' : statut === 'EXTRAITE' ? 'Extraite' : 'Validee';
  }

  getYieldClass(value?: number | null): string {
    const pct = value || 0;
    if (pct < 12) return 'yield-low';
    if (pct <= 18) return 'yield-normal';
    return 'yield-good';
  }

  formatDate(value?: string | Date | null): string {
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
