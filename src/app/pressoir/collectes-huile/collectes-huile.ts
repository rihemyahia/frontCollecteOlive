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
  userRole = 'RESPONSABLE_PRESSOIR';
  isLoading = false;
  errorMessage = '';
  collectes: CollecteHuile[] = [];
  expandedIds = new Set<string>();
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

  toggleExpanded(id: string): void {
    this.expandedIds.has(id) ? this.expandedIds.delete(id) : this.expandedIds.add(id);
    this.refreshLayout();
  }

  isExpanded(id: string): boolean {
    return this.expandedIds.has(id);
  }

  progress(c: CollecteHuile): number {
    return c.nombreTourneesRecues ? Math.round((c.nombreTourneesExtraites / c.nombreTourneesRecues) * 100) : 0;
  }

  maxOil(): number {
    return Math.max(...this.collectes.map(c => c.totalHuileExtraiteL || 0), 1);
  }

  private refreshLayout(): void {
    if (typeof window === 'undefined' || typeof requestAnimationFrame === 'undefined') return;

    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    });
  }
}
