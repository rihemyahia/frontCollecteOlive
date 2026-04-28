// src/app/sidebar-responsable/sidebar-responsable.ts
import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  roles?: string[];
  children?: MenuItem[];
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar-responsable.html',
  styleUrls: ['./sidebar-responsable.css']
})
export class SideBarResponsable implements OnInit {
  @Input() isCollapsed: boolean = false;
  @Output() toggleSidebar = new EventEmitter<boolean>();
  @Input() userRole: string = '';

  activeRoute: string = '';
  expandedMenus: Set<string> = new Set(['ressources']);
  isMobile: boolean = false;

  userProfile: any = {
    prenom: '',
    nom: '',
    role: '',
    email: '',
    avatar: ''
  };

  menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: 'dashboard',
      route: '/dashboard',
      roles: ['ADMIN', 'RESPONSABLE']
    },
    // Utilisateurs
    {
      id: 'utilisateurs',
      label: 'Utilisateurs',
      icon: 'users',
      route: '/utilisateurs',
      roles: ['ADMIN']
    },
    // Ressources
    {
      id: 'ressources',
      label: 'Ressources',
      icon: 'package',
      route: '/ressources',
      roles: ['ADMIN', 'RESPONSABLE'],
      children: [
        {
          id: 'bennes',
          label: 'Bennes',
          icon: 'truck',
          route: '/ressources/bennes',
          roles: ['ADMIN', 'RESPONSABLE']
        },
        {
          id: 'tracteurs',
          label: 'Tracteurs',
          icon: 'tractor',
          route: '/ressources/tracteurs',
          roles: ['ADMIN', 'RESPONSABLE']
        }
      ]
    },
    // Vergers
    {
      id: 'vergers',
      label: 'Vergers',
      icon: 'leaf',
      route: '/vergers',
      roles: ['ADMIN', 'RESPONSABLE']
    },
    {
      id: 'mes-vergers',
      label: 'Mes vergers',
      icon: 'trees',
      route: '/mes-vergers',
      roles: ['AGRICULTEUR']
    },
    {
      id: 'diagnostic',
      label: 'Diagnostic',
      icon: 'stethoscope',
      route: '/diagnostic',
      roles: ['AGRICULTEUR']
    },
    // Tournées
    {
      id: 'tournees',
      label: 'Tournées',
      icon: 'map-pin',
      route: '/tournees',
      roles: ['ADMIN', 'RESPONSABLE']
    },
    // Collectes
    {
      id: 'collectes',
      label: 'Collectes',
      icon: 'basket',
      route: '/collectes',
      roles: ['RESPONSABLE', 'ADMIN']
    },
    // Autres
    {
      id: 'calendrier',
      label: 'Calendrier',
      icon: 'calendar',
      route: '/calendrier',
      roles: ['ADMIN', 'RESPONSABLE', 'AGRICULTEUR', 'TRAVAILLEUR']
    },
    {
      id: 'alertes',
      label: 'Alertes',
      icon: 'alert',
      route: '/alertes',
      roles: ['AGRICULTEUR', 'ADMIN', 'RESPONSABLE'],
      children: [
        {
          id: 'mes-alerte',
          label: 'Mes alertes',
          icon: '',
          route: '/alertes/mes-alertes',
          roles: ['AGRICULTEUR']
        },
        {
          id: 'creer-alerte',
          label: 'Créer une alerte',
          icon: '',
          route: '/alertes/creer',
          roles: ['AGRICULTEUR']
        },
        {
          id: 'gestion-alertes',
          label: 'Gestion des alertes',
          icon: '',
          route: '/alertes/gestion',
          roles: ['ADMIN', 'RESPONSABLE']
        }
      ]
    },
    {
      id: 'profile',
      label: 'Mon profil',
      icon: 'user',
      route: '/profile',
      roles: ['ADMIN', 'RESPONSABLE', 'AGRICULTEUR', 'TRAVAILLEUR']
    }
  ];

  filteredMenuItems: MenuItem[] = [];

  constructor(private router: Router) {
    this.checkMobile();
  }

  ngOnInit(): void {
    this.loadUserProfile();
    this.filterMenuByRole();
    this.setActiveRoute();
    this.setupRouterListener();
  }

  @HostListener('window:storage', ['$event'])
  onStorageChange(event: StorageEvent): void {
    if (event.key === 'currentUser') {
      this.refreshSidebarUserData();
    }
  }

  @HostListener('window:profile-updated')
  onProfileUpdated(): void {
    this.refreshSidebarUserData();
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile && this.isCollapsed) {
      this.isCollapsed = false;
      this.toggleSidebar.emit(this.isCollapsed);
    }
  }

  setupRouterListener(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.setActiveRoute();
    });
  }

  loadUserProfile(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userProfile = {
          prenom: user.prenom || 'Utilisateur',
          nom: user.nom || '',
          role: user.role?.toUpperCase() || this.userRole,
          email: user.email || '',
          photo: user.photoProfile || null,
          avatar: user.prenom ? user.prenom.charAt(0).toUpperCase() : 'U'
        };

        if (!this.userRole && user.role) {
          this.userRole = user.role.toUpperCase();
        }
      } catch (e) {
        console.error('Error parsing user data', e);
        this.setDefaultProfile();
      }
    } else {
      this.setDefaultProfile();
    }
  }

  private refreshSidebarUserData(): void {
    this.loadUserProfile();
    this.filterMenuByRole();
  }

  setDefaultProfile(): void {
    this.userProfile = {
      prenom: 'Utilisateur',
      nom: '',
      role: this.userRole || 'VISITEUR',
      email: '',
      avatar: 'U'
    };

  }

  filterMenuByRole(): void {
    if (!this.userRole) {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          this.userRole = user.role?.toUpperCase() || '';
        } catch (e) {
          console.error('Error parsing user data', e);
        }
      }
    }

    this.filteredMenuItems = this.menuItems
      .filter(item => {
        if (!item.roles) return true;
        return item.roles.includes(this.userRole);
      })
      .map(item => {
        if (item.children && item.children.length > 0) {
          return {
            ...item,
            children: item.children.filter(child => {
              if (!child.roles) return true;
              return child.roles.includes(this.userRole);
            })
          };
        }
        return item;
      })
      .filter(item => {
        if (item.children) return item.children.length > 0;
        return true;
      });
  }

  setActiveRoute(): void {
    this.activeRoute = this.router.url;
  }

  isActive(route: string): boolean {
    if (route === '/') {
      return this.activeRoute === route;
    }
    return this.activeRoute === route || this.activeRoute.startsWith(route + '/');
  }

  isChildActive(children: MenuItem[] | undefined): boolean {
    if (!children) return false;
    return children.some(child => this.isActive(child.route));
  }

  toggleMenu(menuId: string): void {
    if (this.expandedMenus.has(menuId)) {
      this.expandedMenus.delete(menuId);
    } else {
      this.expandedMenus.add(menuId);
    }
  }

  isMenuExpanded(menuId: string): boolean {
    const item = this.menuItems.find(m => m.id === menuId);
    return this.expandedMenus.has(menuId) || this.isChildActive(item?.children);
  }

  navigate(route: string): void {
    if (this.isMobile) {
      this.isCollapsed = true;
      this.toggleSidebar.emit(this.isCollapsed);
    }
    this.router.navigate([route]);
  }

  toggle(): void {
    this.isCollapsed = !this.isCollapsed;
    this.toggleSidebar.emit(this.isCollapsed);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  getIconPath(iconName: string): string {
    const icons: { [key: string]: string } = {
      // Dashboard - Statistics/Overview
      dashboard: 'M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z',
      // Users - Team management
      users: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
      // Resources - Equipment/Machines
      package: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
      // Orchards - Single olive tree with leaves
      leaf: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z',
      // My Orchards - Multiple trees
      trees: 'M8 19h3v4h2v-4h3l-4-4-4 4zm6-15h3V2h-2v2h-1V2h-2v2h3v2zm5.5 2.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM12 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 10c2.97 0 6-1.46 6-3.5V8h1.5c1.1 0 2-.9 2-2s-.9-2-2-2h-1.5V2h-2v2h-3V2h-2v2H6c-1.1 0-2 .9-2 2s.9 2 2 2H7.5v4.5C7.5 14.54 9.03 16 12 16z',
      // Routes/Delivery - Route map/path icon
      'map-pin': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.5 5c.83 0 1.5.67 1.5 1.5S14.33 10 13.5 10 12 9.33 12 8.5s.67-1.5 1.5-1.5zm0 9l-6-6h12l-6 6z',
      // Harvest/Collections - Basket/harvesting icon
      basket: 'M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z',
      // Calendar - Schedule/Season planning
      calendar: 'M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zm-5-5h4v4h-4z',
      // Alerts - Warning/notifications
      alert: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
      // Profile - User account
      user: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
      // Trucks/Containers - Transport
      truck: 'M18 18.5a1.5 1.5 0 01-1.5-1.5 1.5 1.5 0 011.5-1.5 1.5 1.5 0 011.5 1.5 1.5 1.5 0 01-1.5 1.5m1.5-9l-6-6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V11m-9 9a1.5 1.5 0 01-1.5-1.5 1.5 1.5 0 011.5-1.5 1.5 1.5 0 011.5 1.5 1.5 1.5 0 01-1.5 1.5z',
      // Tractors - Farm machinery
      tractor: 'M9.5 11c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2m0-9C5.6 2 2.5 5.1 2.5 9s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7m10 6v4c0 .55.45 1 1 1h2v-2h-2v-2h-1c-.55 0-1 .45-1 1zm0-4h6v2h-6V3z',
    };
    return icons[iconName] || icons['dashboard'];
  }
}
