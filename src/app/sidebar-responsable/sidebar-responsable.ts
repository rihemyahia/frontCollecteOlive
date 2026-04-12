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
  @Output() toggleSidebar = new EventEmitter<void>();
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
      roles: ['ADMIN', 'RESPONSABLE', 'AGRICULTEUR', 'TRAVAILLEUR', 'TRANSPORTEUR']
    },
    {
      id: 'travailleurs',
      label: 'Travailleurs',
      icon: 'users',
      route: '/travailleurs',
      roles: ['ADMIN', 'RESPONSABLE']
    },
    {
      id: 'agriculteurs',
      label: 'Agriculteurs',
      icon: 'farmer',
      route: '/agriculteurs',
      roles: ['ADMIN', 'RESPONSABLE']
    },
    {
      id: 'vergers',
      label: 'Vergers',
      icon: 'tree',
      route: '/vergers',
      roles: ['ADMIN', 'RESPONSABLE', 'AGRICULTEUR']
    },
    {
      id: 'tournees',
      label: 'Tournées',
      icon: 'route',
      route: '/tournees',
      roles: ['ADMIN', 'RESPONSABLE', 'TRAVAILLEUR', 'TRANSPORTEUR']
    },
    {
      id: 'alertes',
      label: 'Alertes',
      icon: 'bell',
      route: '/alertes',
      roles: ['ADMIN', 'RESPONSABLE', 'AGRICULTEUR'],
      badge: 3
    },
    {
      id: 'activation',
      label: 'Activation des comptes',
      icon: 'user-check',
      route: '/admin/activation',
      roles: ['ADMIN']
    },
    {
      id: 'utilisateurs',
      label: 'Utilisateurs',
      icon: 'users-cog',
      route: '/utilisateurs',
      roles: ['ADMIN']
    },
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
          icon: 'box',
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
      id: 'profile',
      label: 'Mon Profil',
      icon: 'user',
      route: '/profile',
      roles: ['ADMIN', 'RESPONSABLE', 'AGRICULTEUR', 'TRAVAILLEUR', 'TRANSPORTEUR']
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

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile && this.isCollapsed) {
      this.isCollapsed = false;
      this.toggleSidebar.emit();
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
          role: this.getRoleLabel(user.role?.toUpperCase() || this.userRole),
          email: user.email || '',
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

  getRoleLabel(role: string): string {
    const roleLabels: { [key: string]: string } = {
      'ADMIN': 'Administrateur',
      'RESPONSABLE': 'Responsable',
      'AGRICULTEUR': 'Agriculteur',
      'TRAVAILLEUR': 'Travailleur',
      'TRANSPORTEUR': 'Transporteur'
    };
    return roleLabels[role] || role;
  }

  setDefaultProfile(): void {
    this.userProfile = {
      prenom: 'Utilisateur',
      nom: '',
      role: this.getRoleLabel(this.userRole) || 'Visiteur',
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
      this.toggleSidebar.emit();
    }
    this.router.navigate([route]);
  }

  toggle(): void {
    this.isCollapsed = !this.isCollapsed;
    this.toggleSidebar.emit();
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  // Navigate to profile page
  goToProfile(): void {
    this.navigate('/profile');
  }

  getIconPath(iconName: string): string {
    const icons: { [key: string]: string } = {
      dashboard: 'M3 12h6V3H3v9zm12 0h6V3h-6v9zM3 21h6v-6H3v6zm12 0h6v-6h-6v6z',
      users: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
      farmer: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
      tree: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
      route: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
      bell: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
      'user-check': 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
      'users-cog': 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
      package: 'M4 8h16M4 16h16M8 3v18M16 3v18',
      box: 'M4 8h16M4 16h16M8 3v18M16 3v18',
      tractor: 'M5 10h14M5 14h14M7 6h10M7 18h10M12 2v4M12 18v4',
      user: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'
    };
    return icons[iconName] || icons['dashboard'];
  }
}
