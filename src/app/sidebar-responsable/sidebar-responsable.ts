import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
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
  expandedMenus: Set<string> = new Set();
  unreadAlerts: number = 0;

  userProfile: any = {
    prenom: '',
    nom: '',
    role: ''
  };

  menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: 'dashboard',
      route: '/dashboard',
      roles: ['ADMIN', 'RESPONSABLE']
    },
    {
      id: 'travailleurs',
      label: 'Travailleurs',
      icon: 'people',
      route: '/travailleurs',
      roles: ['ADMIN', 'RESPONSABLE']
    },
    {
      id: 'vergers',
      label: 'Vergers',
      icon: 'orchard',
      route: '/vergers',
      roles: ['ADMIN', 'RESPONSABLE']
    },
    {
      id: 'tournees',
      label: 'Tournées',
      icon: 'route',
      route: '/tournees',
      roles: ['ADMIN', 'RESPONSABLE', 'EQUIPE_RECOLTE']
    },
    {
      id: 'alertes',
      label: 'Alertes',
      icon: 'alert',
      route: '/alertes',
      roles: ['ADMIN', 'RESPONSABLE', 'AGRICULTEUR']
    },
    {
      id: 'utilisateurs',
      label: 'Gestion des utilisateurs',
      icon: 'admin',
      route: '/utilisateurs',
      roles: ['ADMIN'] // Seuls les administrateurs peuvent voir ce menu
    },
    {
      id: 'profile',
      label: 'Mon profil',
      icon: 'profile',
      route: '/profile',
      roles: ['ADMIN', 'RESPONSABLE', 'AGRICULTEUR', 'EQUIPE_RECOLTE']
    }
  ];

  filteredMenuItems: MenuItem[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.filterMenuByRole();
    this.setActiveRoute();
    this.loadUnreadAlerts();

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
          prenom: user.prenom || '',
          nom: user.nom || '',
          role: user.role || this.userRole
        };

        // Si userRole n'est pas passé en entrée, utilisez celui de localStorage
        if (!this.userRole && user.role) {
          this.userRole = user.role.toUpperCase();
        }
        console.log('User role loaded:', this.userRole);
      } catch (e) {
        console.error('Error parsing user data', e);
        this.setDefaultProfile();
      }
    } else {
      this.setDefaultProfile();
    }
  }

  setDefaultProfile(): void {
    this.userProfile = {
      prenom: 'Utilisateur',
      nom: '',
      role: this.userRole || 'VISITEUR'
    };
  }

  loadUnreadAlerts(): void {
    // Vous pouvez implémenter ceci pour récupérer le nombre d'alertes non lues depuis votre service
    this.unreadAlerts = 0;
  }

  filterMenuByRole(): void {
    // Si aucun userRole, essayez de le récupérer depuis localStorage
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

    console.log('Filtering menu for role:', this.userRole);
    this.filteredMenuItems = this.menuItems.filter(item => {
      if (!item.roles) return true;
      return item.roles.includes(this.userRole);
    });
    console.log('Filtered menu items:', this.filteredMenuItems);
  }

  setActiveRoute(): void {
    this.activeRoute = this.router.url;
  }

  isActive(route: string): boolean {
    if (route === '/') {
      return this.activeRoute === route;
    }
    return this.activeRoute.startsWith(route);
  }

  toggleMenu(menuId: string): void {
    if (this.expandedMenus.has(menuId)) {
      this.expandedMenus.delete(menuId);
    } else {
      this.expandedMenus.add(menuId);
    }
  }

  isMenuExpanded(menuId: string): boolean {
    return this.expandedMenus.has(menuId);
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  toggle(): void {
    this.toggleSidebar.emit();
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  getIconPath(iconName: string): string {
    const icons: { [key: string]: string } = {
      dashboard: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
      people: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
      orchard: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
      route: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
      alert: 'M12 2L1 21h22L12 2zm1 16h-2v-2h2v2zm0-4h-2v-4h2v4z',
      admin: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z',
      profile: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'
    };
    return icons[iconName] || icons['dashboard'];
  }
}