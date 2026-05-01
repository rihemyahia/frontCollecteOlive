import { ChangeDetectionStrategy, Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { AuthService } from '../../services/auth';

interface DashboardUser {
  prenom?: string;
  nom?: string;
  role?: string;
}

interface OpenMeteoResponse {
  current?: {
    temperature_2m: number;
    weather_code: number;
    precipitation: number;
    cloud_cover: number;
  };
}

@Component({
  selector: 'app-transporteur-dashboard',
  imports: [CommonModule, SideBarResponsable],
  templateUrl: './transporteur-dashboard.html',
  styleUrls: ['./transporteur-dashboard.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransporteurDashboardComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);

  readonly isSidebarCollapsed = signal(false);
  readonly user = signal<DashboardUser | null>(null);
  readonly loading = false;
  readonly error = '';
  readonly currentSeason = computed(() => {
    const today = new Date();
    return `${this.getSeasonLabel(today)} ${today.getFullYear()}`;
  });

  readonly userRole = computed(() => this.user()?.role?.toUpperCase() || 'TRANSPORTEUR');
  readonly displayName = computed(() => {
    const user = this.user();
    const fullName = `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim();
    return fullName || 'Transporteur';
  });
  readonly initials = computed(() => {
    const user = this.user();
    const first = user?.prenom?.charAt(0) ?? 'T';
    const last = user?.nom?.charAt(0) ?? 'R';
    return `${first}${last}`.toUpperCase();
  });

  readonly missionStats = [
    { label: 'À livrer', value: '2' },
    { label: 'En livraison', value: '1' },
    { label: 'Livrées', value: '2' }
  ];

  readonly areaValue = signal('Détection en cours...');
  readonly temperatureValue = signal('--°C');
  readonly weatherValue = signal('Chargement...');

  readonly routeConditions = computed(() => [
    { label: 'Zone', value: this.areaValue(), icon: 'bi-geo-alt' },
    { label: 'Température', value: this.temperatureValue(), icon: 'bi-thermometer-half' },
    { label: 'Météo', value: this.weatherValue(), icon: 'bi-sun' }
  ]);

  readonly quickActions = [
    { title: 'Mes tournées', icon: 'bi-truck-front', route: '/transporteur/tournees' },
    { title: 'Liste générale', icon: 'bi-calendar2-week', route: '/tournees' },
    { title: 'Mon profil', icon: 'bi-person-badge', route: '/profile' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUser();
    this.loadLocalWeather();
  }

  private getSeasonLabel(date: Date): string {
    const month = date.getMonth() + 1;

    if (month >= 3 && month <= 5) {
      return 'Printemps';
    }

    if (month >= 6 && month <= 8) {
      return 'Été';
    }

    if (month >= 9 && month <= 11) {
      return 'Automne';
    }

    return 'Hiver';
  }

  private loadLocalWeather(): void {
    if (!isPlatformBrowser(this.platformId) || !('geolocation' in navigator)) {
      this.areaValue.set('Zone locale');
      this.weatherValue.set('Non disponible');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void this.fetchWeather(position.coords.latitude, position.coords.longitude);
      },
      () => {
        this.areaValue.set('Zone locale');
        this.weatherValue.set('Autorisation refusée');
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }

  private async fetchWeather(latitude: number, longitude: number): Promise<void> {
    this.areaValue.set(`${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,precipitation,cloud_cover&timezone=auto`
      );

      if (!response.ok) {
        throw new Error('Weather API request failed');
      }

      const data = (await response.json()) as OpenMeteoResponse;

      if (!data.current) {
        throw new Error('Missing current weather in response');
      }

      this.temperatureValue.set(`${Math.round(data.current.temperature_2m)}°C`);
      this.weatherValue.set(
        this.weatherCodeToLabel(
          data.current.weather_code,
          data.current.precipitation,
          data.current.cloud_cover
        )
      );
    } catch {
      this.weatherValue.set('Indisponible');
    }
  }

  private weatherCodeToLabel(code: number, precipitation: number, cloudCover: number): string {
    const hasRainNow = precipitation >= 0.2;

    if (!hasRainNow && (code >= 51 && code <= 67 || code >= 80 && code <= 82)) {
      if (cloudCover >= 70) {
        return 'Nuageux';
      }

      return 'Temps sec';
    }

    if (code === 0) {
      return 'Ciel clair';
    }

    if (code >= 1 && code <= 3) {
      return 'Partiellement nuageux';
    }

    if (code === 45 || code === 48) {
      return 'Brouillard';
    }

    if (code >= 51 && code <= 67) {
      return 'Pluie';
    }

    if (code >= 71 && code <= 77) {
      return 'Neige';
    }

    if (code >= 80 && code <= 82) {
      return 'Averses';
    }

    if (code >= 95) {
      return 'Orage';
    }

    return 'Variable';
  }

  loadUser(): void {
    const stored = localStorage.getItem('currentUser');

    if (stored) {
      try {
        this.user.set(JSON.parse(stored));
      } catch {
        this.user.set(null);
      }
    }

    if (!this.user()?.role) {
      const role = this.authService.getUserRole();
      if (role) {
        this.user.update((current) => ({ ...(current ?? {}), role }));
      }
    }
  }

  toggleSidebar(collapsed: boolean): void {
    this.isSidebarCollapsed.set(collapsed);
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }
}