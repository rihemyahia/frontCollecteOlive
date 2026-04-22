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

  // Change alert urgency/criticality (RESPONSABLE/ADMIN only)
  changeUrgence(id: string, urgence: NiveauUrgence): Observable<AlerteResponse> {
    return this.http.patch<AlerteResponse>(`${this.API}/${id}/urgence`, null, { params: { urgence } });
  }

  // Mark alert as treated (RESPONSABLE/ADMIN only)
  markAsProcessed(id: string, comment: string): Observable<AlerteResponse> {
    return this.http.patch<AlerteResponse>(`${this.API}/${id}/traiter`, null, { params: { commentaire: comment } });
  }

  // Delete alert (RESPONSABLE/ADMIN only)
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }

  // Get alerts from responsable's managed vergers
  getByResponsable(): Observable<AlerteResponse[]> {
    return this.http.get<AlerteResponse[]>(`${this.API}`);
  }

  // Search alerts with filters
  search(
    keyword?: string,
    types?: TypeAlerte[],
    statuts?: StatutAlerte[],
    urgences?: NiveauUrgence[],
    phase?: PhaseCulturale,
    vergerId?: string,
    agriculteurId?: string,
    dateFrom?: string,
    dateTo?: string
  ): Observable<AlerteResponse[]> {
    let params = new HttpParams();
    if (keyword) params = params.set('keyword', keyword);
    if (types && types.length > 0) types.forEach(t => params = params.append('types', t));
    if (statuts && statuts.length > 0) statuts.forEach(s => params = params.append('statuts', s));
    if (urgences && urgences.length > 0) urgences.forEach(u => params = params.append('urgences', u));
    if (phase) params = params.set('phase', phase);
    if (vergerId) params = params.set('vergerId', vergerId);
    if (agriculteurId) params = params.set('agriculteurId', agriculteurId);
    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo) params = params.set('dateTo', dateTo);

    return this.http.get<AlerteResponse[]>(`${this.API}/search`, { params });
  }

  // Get alerts by phase
  getByPhase(phase: PhaseCulturale): Observable<AlerteResponse[]> {
    return this.http.get<AlerteResponse[]>(`${this.API}/by-phase`, { params: { phase } });
  }

  // Get alerts by type(s)
  getByTypes(types: TypeAlerte[]): Observable<AlerteResponse[]> {
    let params = new HttpParams();
    types.forEach(t => params = params.append('types', t));
    return this.http.get<AlerteResponse[]>(`${this.API}/by-type`, { params });
  }

  // Add comment to alert
  addComment(alerteId: string, texte: string, typeComment?: string): Observable<any> {
    const body = { texte, typeComment: typeComment || 'OBSERVATION' };
    return this.http.post(`${this.API}/${alerteId}/comments`, body);
  }

  // Get comments for alert
  getComments(alerteId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/${alerteId}/comments`);
  }

  // Delete comment
  deleteComment(alerteId: string, commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/${alerteId}/comments/${commentId}`);
  }

  // Change status with validation
  changeStatusWithValidation(alerteId: string, newStatut: StatutAlerte, notes?: string): Observable<AlerteResponse> {
    const body = { newStatut, notes };
    return this.http.patch<AlerteResponse>(`${this.API}/${alerteId}/change-status`, body);
  }

  // Get available status transitions
  getAvailableTransitions(alerteId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/${alerteId}/available-transitions`);
  }

  // Get status history
  getStatusHistory(alerteId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/${alerteId}/status-history`);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RESPONSABLE-SPECIFIC METHODS
  // ════════════════════════════════════════════════════════════════════════════

  // Get all alerts for responsable (from their managed vergers)
  getAlertesResponsable(): Observable<AlerteResponse[]> {
    return this.http.get<AlerteResponse[]>(`${this.API}/responsable`);
  }

  // Get single alert detail for responsable (with ownership verification)
  getAlertDetailResponsable(id: string): Observable<AlerteResponse> {
    return this.http.get<AlerteResponse>(`${this.API}/responsable/${id}`);
  }

  // Get alerts filtered by status (responsable only sees their vergers)
  getAlertesResponsableByStatut(statut: StatutAlerte): Observable<AlerteResponse[]> {
    return this.http.get<AlerteResponse[]>(`${this.API}/responsable/statut`, { params: { statut } });
  }

  // Get alerts filtered by urgency level (responsable only sees their vergers)
  getAlertesResponsableByUrgence(urgence: NiveauUrgence): Observable<AlerteResponse[]> {
    return this.http.get<AlerteResponse[]>(`${this.API}/responsable/urgence`, { params: { urgence } });
  }

  // Change alert status for responsable
  changerStatutResponsable(id: string, statut: StatutAlerte): Observable<AlerteResponse> {
    return this.http.patch<AlerteResponse>(`${this.API}/responsable/${id}/statut`, null, { params: { statut } });
  }

  // Change alert urgency for responsable
  changerUrgenceResponsable(id: string, urgence: NiveauUrgence): Observable<AlerteResponse> {
    return this.http.patch<AlerteResponse>(`${this.API}/responsable/${id}/urgence`, null, { params: { urgence } });
  }

  // Mark alert as treated for responsable
  marquerTraiteeResponsable(id: string, commentaire: string): Observable<AlerteResponse> {
    return this.http.patch<AlerteResponse>(`${this.API}/responsable/${id}/traiter`, null, { params: { commentaire } });
  }
  
}