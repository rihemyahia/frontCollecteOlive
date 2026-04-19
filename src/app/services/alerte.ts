// alerte.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TypeAlerte = 'MATURITE' | 'MALADIE' | 'METEO' | 'RECOLTE' | 'AUTRE' | 'NUISIBLE' | 'IRRIGATION' | 'QUALITE_HUILE' | 'SECURITE_RECOLTE' | 'MATURITE_ACCELEREE' | 'CHUTE_PREMATUREE' | 'LOGISTIQUE_MOULIN' | 'RENDEMENT_ANORMAL';
export type StatutAlerte = 'EN_ATTENTE' | 'TRAITEE' | 'IGNOREE';
export type NiveauUrgence = 'FAIBLE' | 'MOYENNE' | 'ELEVEE' | 'CRITIQUE';
export type PhaseCulturale = 'FLORAISON' | 'NOUAISON' | 'VERDAISON' | 'PRE_RECOLTE' | 'RECOLTE' | 'INCONNUE';

export interface AlerteRequest {
  agriculteurId: string;    // @NotBlank - Required
  vergerId: string;         // @NotBlank - Required, backend extracts geolocation from this verger
  type: TypeAlerte;         // @NotNull - Required
  description: string;      // @NotBlank - Required
  latitude?: number;        // Optional - kept for backward compatibility but not used
  longitude?: number;       // Optional - kept for backward compatibility but not used
  adresseIndicative?: string; // Optional - kept for backward compatibility but not used
}

export interface AlerteResponse {
  id: string;
  agriculteurId: string;
  agriculteurNom: string;
  agriculteurEmail: string;
  vergerId: string;
  vergerTypeOlive: string;
  type: TypeAlerte;
  description: string;
  geolocalisation: {
    latitude: number;
    longitude: number;
    adresseIndicative?: string;
  };
  phase: PhaseCulturale;
  niveauUrgence: NiveauUrgence;
  statut: StatutAlerte;
  commentaireTraitement?: string;
  estSupprimer: boolean;
  dateSignalement: Date;
  dateMiseAJour?: Date;
}

@Injectable({ providedIn: 'root' })
export class AlerteService {
  private readonly API = 'http://localhost:8080/api/alertes';

  constructor(private http: HttpClient) {}

  // Create a new alert
  signaler(request: AlerteRequest): Observable<AlerteResponse> {
    return this.http.post<AlerteResponse>(`${this.API}`, request);
  }

  // Get all alerts (RESPONSABLE/ADMIN only)
  getAll(): Observable<AlerteResponse[]> {
    return this.http.get<AlerteResponse[]>(this.API);
  }

  // Get current user's own alerts
  getByAgriculteur(agriculteurId: string): Observable<AlerteResponse[]> {
    return this.http.get<AlerteResponse[]>(`${this.API}/mes-alertes/${agriculteurId}`);
  }

  // Get alerts for a specific verger
  getByVerger(vergerId: string): Observable<AlerteResponse[]> {
    return this.http.get<AlerteResponse[]>(`${this.API}/verger/${vergerId}`);
  }

  // Get alerts by status
  getByStatut(statut: StatutAlerte): Observable<AlerteResponse[]> {
    return this.http.get<AlerteResponse[]>(`${this.API}/statut`, { params: { statut } });
  }

  // Get alerts by urgency level
  getByUrgence(urgence: NiveauUrgence): Observable<AlerteResponse[]> {
    return this.http.get<AlerteResponse[]>(`${this.API}/urgence`, { params: { urgence } });
  }

  // Get nearby alerts (within 500m)
  getNearbyAlerts(longitude: number, latitude: number): Observable<AlerteResponse[]> {
    return this.http.get<AlerteResponse[]>(`${this.API}/proches`, { params: { longitude: longitude.toString(), latitude: latitude.toString() } });
  }

  // Get single alert by ID
  getById(id: string): Observable<AlerteResponse> {
    return this.http.get<AlerteResponse>(`${this.API}/${id}`);
  }

  // Change alert status (RESPONSABLE/ADMIN only)
  changeStatut(id: string, statut: StatutAlerte): Observable<AlerteResponse> {
    return this.http.patch<AlerteResponse>(`${this.API}/${id}/statut`, null, { params: { statut } });
  }

  // Mark alert as treated (RESPONSABLE/ADMIN only)
  markAsProcessed(id: string, comment: string): Observable<AlerteResponse> {
    return this.http.patch<AlerteResponse>(`${this.API}/${id}/traiter`, null, { params: { commentaire: comment } });
  }

  // Delete alert (RESPONSABLE/ADMIN only)
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
  
}