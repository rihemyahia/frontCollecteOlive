// src/app/pressoir/collectes-huile/collectes-huile.component.ts
import { AfterViewInit, Component, HostListener, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { CollecteHuile, PressoirService } from '../../services/pressoir';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';

@Component({
  selector: 'app-pressoir-collectes-huile',
  standalone: true,
  imports: [CommonModule, SideBarResponsable],
  templateUrl: './collectes-huile.html',
  styleUrls: ['../pressoir.css']
})
export class PressoirCollectesHuileComponent implements OnInit, AfterViewInit {
  isSidebarCollapsed = false;
  isMobile = false;
  userRole = 'RESPONSABLE_PRESSOIR';
  isLoading = false;
  errorMessage = '';
  collectes: CollecteHuile[] = [];
  private wasMobile = false;

  constructor(
    private pressoirService: PressoirService,
    private authService: AuthService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole() || 'RESPONSABLE_PRESSOIR';
    this.loadCollectes();
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
    this.isMobile = isMobile;
  }

  toggleSidebar(collapsed?: boolean): void {
    this.isSidebarCollapsed = typeof collapsed === 'boolean' ? collapsed : !this.isSidebarCollapsed;
    this.refreshLayout();
  }

  loadCollectes(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.pressoirService.getCollectesHuile().subscribe({
      next: data => {
        this.collectes = data || [];
        this.isLoading = false;
        this.refreshLayout();
      },
      error: err => {
        this.errorMessage = err?.error?.error || err?.error?.message || 'Erreur lors du chargement des collectes huile';
        this.isLoading = false;
      }
    });
  }

  progress(c: CollecteHuile): number {
    if (!c.nombreTourneesRecues || c.nombreTourneesRecues === 0) return 0;
    return Math.min(100, Math.round((c.nombreTourneesExtraites / c.nombreTourneesRecues) * 100));
  }

  totalHuile(): number {
    return this.collectes.reduce((sum, c) => sum + (c.totalHuileExtraiteL || 0), 0);
  }

  totalOlives(): number {
    return this.collectes.reduce((sum, c) => sum + (c.totalOlivesRecuesKg || 0), 0);
  }

  rendementMoyenGlobal(): number {
    const totalHuile = this.totalHuile();
    const totalOlives = this.totalOlives();
    if (totalOlives === 0) return 0;
    return (totalHuile / totalOlives) * 100;
  }

  getRendementClass(rendement: number): string {
    if (!rendement) return 'rendement-low';
    if (rendement < 10) return 'rendement-low';
    if (rendement < 15) return 'rendement-medium';
    return 'rendement-high';
  }

  getRendementColor(rendement: number): string {
    if (!rendement) return '#DC2626';
    if (rendement < 10) return '#DC2626';
    if (rendement < 15) return '#F59E0B';
    return '#10B981';
  }

  private refreshLayout(): void {
    if (typeof window === 'undefined' || typeof requestAnimationFrame === 'undefined') return;

    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    });
  }
}