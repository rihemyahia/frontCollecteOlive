// src/app/services/dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminDashboard {
  totalUtilisateurs: number;
  totalAdmins: number;
  totalResponsables: number;
  totalAgriculteurs: number;
  totalTravailleurs: number;
  compteEnAttente: number;
  totalVergers: number;
  vergersNonRecolte: number;
  vergersEnCours: number;
  vergersRecolte: number;
  totalBennes: number;
  bennesDisponibles: number;
  bennesMaintenance: number;
  totalTracteurs: number;
  tracteursDisponibles: number;
  tracteursMaintenance: number;
  totalTournees: number;
  tourneesEnCours: number;
  tourneesTerminees: number;
  tourneesPlanifiees: number;
  tourneesAnnulees: number;
  totalCollectes: number;
  collectesEnCours: number;
  collectesTerminees: number;
  quantiteTotaleKgRecolteeCetteAnnee: number;
  totalAlertes: number;
  alertesEnAttente: number;
  alertesEnCours: number;
  alertesTraitees: number;
  alertesCritiques: number;
  topVergers: VergerStats[];
  recentActivity: RecentActivity[];
}

export interface VergerStats {
  vergerId: string;
  typeOlive: string;
  agriculteurNom: string;
  responsableNom: string;
  quantiteKg: number;
  nbTournees: number;
}

export interface RecentActivity {
  type: string;
  message: string;
  date: string;
  statut: string;
}

export interface ResponsableDashboard {
  totalMesVergers: number;
  mesVergersNonRecolte: number;
  mesVergersEnCours: number;
  mesVergersRecolte: number;
  totalMesTournees: number;
  mesTourneesEnCours: number;
  mesTourneesTerminees: number;
  mesTourneesPlanifiees: number;
  totalMesCollectes: number;
  mesCollectesEnCours: number;
  mesQuantiteTotaleKg: number;
  mesAlertesEnAttente: number;
  mesAlertesEnCours: number;
  mesAlertesCritiques: number;
  totalMesAlertes: number;
  totalTravailleurs: number;
  bennesDisponibles: number;
  tracteursDisponibles: number;
  mesVergers: VergerDetail[];
}

export interface VergerDetail {
  vergerId: string;
  typeOlive: string;
  agriculteurNom: string;
  statut: string;
  nbArbre: number;
  superficie: number;
  quantiteRecolteKg: number;
  nbTournees: number;
  nbAlertes: number;
  maturiteActuelle: number;
}

export interface AgriculteurDashboard {
  totalMesVergers: number;
  mesVergersNonRecolte: number;
  mesVergersEnCours: number;
  mesVergersRecolte: number;
  totalMesCollectes: number;
  mesCollectesEnCours: number;
  mesCollectesTerminees: number;
  mesQuantiteTotaleKg: number;
  mesTourneesPlanifiees: number;
  mesTourneesEnCours: number;
  mesTourneesTerminees: number;
  mesAlertesEnAttente: number;
  mesAlertesEnCours: number;
  mesAlertesTraitees: number;
  totalMesAlertes: number;
  mesVergers: MonVerger[];
}

export interface MonVerger {
  vergerId: string;
  typeOlive: string;
  responsableNom: string;
  responsableEmail: string;
  statut: string;
  nbArbre: number;
  superficie: number;
  maturiteActuelle: number;
  quantiteRecolteKg: number;
  nbTournees: number;
  nbAlertes: number;
  phaseCulturale: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private base = 'http://localhost:8080/api/dashboard';

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getAdminDashboard(): Observable<AdminDashboard> {
    return this.http.get<AdminDashboard>(`${this.base}/admin`, { headers: this.headers() });
  }

  getResponsableDashboard(): Observable<ResponsableDashboard> {
    return this.http.get<ResponsableDashboard>(`${this.base}/responsable`, { headers: this.headers() });
  }

  getAgriculteurDashboard(): Observable<AgriculteurDashboard> {
    return this.http.get<AgriculteurDashboard>(`${this.base}/agriculteur`, { headers: this.headers() });
  }
}