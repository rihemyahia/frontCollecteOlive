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

      roles: ['ADMIN', 'RESPONSABLE', 'AGRICULTEUR', 'TRANSPORTEUR']
    },
    {
      id: 'utilisateurs',
      label: 'Utilisateurs',
      icon: 'users',
      route: '/utilisateurs',
      roles: ['ADMIN']
    },
    {
      id: 'ressources',
      label: 'Ressources',
      icon: 'resources',
      route: '/ressources',
      roles: ['ADMIN', 'RESPONSABLE'],
      children: [
        {
          id: 'bennes',
          label: 'Bennes',
          icon: 'basket',
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
      icon: 'diagnostic',
      route: '/diagnostic',
      roles: ['AGRICULTEUR']
    },
    {
      id: 'tournees',
      label: 'Tournées',
      icon: 'map-pin',
      route: '/tournees',
      roles: ['ADMIN', 'RESPONSABLE']
    },
    {
      id: 'mes-tournees-transporteur',
      label: 'Mes tournées',
      icon: 'map-pin',
      route: '/tournees',
      roles: ['TRANSPORTEUR']
    },
    // Collectes
    {
      id: 'collectes',
      label: 'Collectes',
      icon: 'collectes',
      route: '/collectes',
      roles: ['RESPONSABLE', 'ADMIN']
    },
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
      // Dashboard - House / Home
      dashboard: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-5v-8H7v8H5a2 2 0 0 1-2-2V9z',

      // Users - Person / People
      users: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 20c0-4 8-6 8-6s8 2 8 6',

      // Resources - Box / Package
      resources: 'M20 7h-4.18A3 3 0 0 0 16 5.18V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v1.18A3 3 0 0 0 8.18 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z',

      // Basket - Olive basket
      basket: 'M5 11h14M9 7l-2 4M15 7l2 4M12 15v4M8 15v3M16 15v3',

      // Tractor - Farm vehicle
      tractor: 'M4 12h13M9 4v8M15 4v8M7 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 0h10',

      // Leaf - Olive tree / Orchard
      leaf: 'M12 2C8 6 4 10 4 14c0 4 4 8 8 8s8-4 8-8c0-4-4-8-8-8z',

      // Trees - Multiple trees
      trees: 'M7 11L5 9l2-2M17 11l2-2-2-2M12 3L9 8h6zM10 21v-8M14 21v-8',

      // Diagnostic - Stethoscope
      diagnostic: 'M9 2v4M15 2v4M12 6a4 4 0 0 1 4 4v3a4 4 0 0 1-8 0v-3a4 4 0 0 1 4-4zm9 3v3a9 9 0 0 1-9 9 9 9 0 0 1-9-9V9',

      // Map pin - Routes / Tours
      'map-pin': 'M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',

      // Collectes - Clipboard / Harvest record
      collectes: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2',

      // Calendar
      calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',

      // Alert - Bell
      alert: 'M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V9a6 6 0 0 0-12 0v7l-2 2v1h16v-1l-2-2z',

      // User - Profile
      user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    };
    return icons[iconName] || icons['dashboard'];
  }
}
