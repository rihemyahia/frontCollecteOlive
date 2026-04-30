import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-transporteur-dashboard',
  standalone: true,
  imports: [CommonModule, SideBarResponsable],
  template: `
    <div class="app-layout">
      <app-sidebar
        [isCollapsed]="isSidebarCollapsed"
        (toggleSidebar)="toggleSidebar($event)"
        [userRole]="userRole">
      </app-sidebar>

      <main class="main-content" [class.sidebar-collapsed]="isSidebarCollapsed">
        <div class="oh-scene">
          <div class="oh-ambient" aria-hidden="true">
            <div class="amb-orb amb-orb--1"></div>
            <div class="amb-orb amb-orb--2"></div>
            <div class="amb-orb amb-orb--3"></div>
          </div>

          <div class="oh-card">
            <div class="oh-card__glow" aria-hidden="true"></div>
            <div class="oh-card__header">
              <div class="oh-header__inner">
                <div class="oh-header__left">
                  <div class="oh-header__text">
                    <p class="oh-header__eyebrow">ESPACE TRANSPORTEUR</p>
                    <h2 class="oh-header__title">Tableau de bord</h2>
                    <p class="header-subtitle">Accédez rapidement à vos tournées et livraisons</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="oh-card__body">
              <div class="oh-state">
                <p>Utilisez le menu à gauche pour accéder à vos tournées.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
 
})
export class TransporteurDashboardComponent implements OnInit {
  isSidebarCollapsed = false;
  userRole = 'TRANSPORTEUR';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Ensure sidebar gets correct role even after refresh
    const role = this.authService.getUserRole();
    this.userRole = role || 'TRANSPORTEUR';
  }

  toggleSidebar(collapsed: boolean): void {
    this.isSidebarCollapsed = collapsed;
  }
}
