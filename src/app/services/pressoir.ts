import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export type ExtractionStatut = 'RECUE' | 'EXTRAITE' | 'VALIDEE';
export type QualiteHuile = 'EXTRA_VIERGE' | 'VIERGE' | 'COURANTE' | 'LAMPANTE';

export interface PressoirDashboard {
  totalOlivesRecuesKg: number;
  totalHuileExtraiteL: number;
  rendementMoyenPourcentage: number;
  tourneesEnAttenteReception: number;
  tourneesEnAttenteExtraction: number;
  extractionsValidees: number;
  meilleureCollecte?: CollecteHuile | null;
  plusFaibleCollecte?: CollecteHuile | null;
  collectesHuile: CollecteHuile[];
}

export interface TourneeLivree {
  id: string;
  code?: string;
  collecteCode?: string;
  vergerTypeOlive?: string;
  quantiteCollecteeKg?: number;
  transporteurNom?: string;
  livraisonCompletedAt?: string | Date;
  livraisonDestinationNom?: string;
  livraisonDestinationAdresse?: string;
}

export interface ExtractionHuile {
  id: string;
  tourneeId: string;
  tourneeCode?: string;
  collecteId?: string;
  collecteCode?: string;
  responsablePressoirId?: string;
  responsablePressoirNom?: string;
  pressoirNom?: string;
  quantiteOlivesRecueKg: number;
  quantiteHuileExtraiteL?: number | null;
  rendementPourcentage?: number | null;
  dateReception?: string | Date;
  dateExtraction?: string | Date | null;
  statut: ExtractionStatut;
  qualiteHuile?: QualiteHuile | null;
  observationsReception?: string | null;
  observationsExtraction?: string | null;
}

export interface CollecteHuile {
  collecteId: string;
  collecteCode: string;
  vergerId?: string;
  vergerTypeOlive?: string;
  totalOlivesRecuesKg: number;
  totalHuileExtraiteL: number;
  rendementMoyenPourcentage: number;
  nombreTourneesRecues: number;
  nombreTourneesExtraites: number;
  extractions?: ExtractionHuile[];
}

export interface PressoirProfile {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  telephone?: string;
  adresse?: string;
  disponible: boolean;
  pressoir?: {
    id?: string;
    nom?: string;
    adresse?: string;
    telephone?: string;
    email?: string;
    capaciteJournaliere?: string;
    horaires?: string;
    horaireDebut?: string;
    horaireFin?: string;
    geolocalisation?: { latitude?: number; longitude?: number };
    actif?: boolean;
    dateCreation?: string | Date;
  };
}

@Injectable({ providedIn: 'root' })
export class PressoirService {
  private apiUrl = 'http://localhost:8080/api/pressoir';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    });
  }

  getDashboard(): Observable<PressoirDashboard> {
    return this.http.get<PressoirDashboard>(`${this.apiUrl}/dashboard`, { headers: this.getHeaders() });
  }

  getTourneesLivrees(): Observable<TourneeLivree[]> {
    return this.http.get<TourneeLivree[]>(`${this.apiUrl}/tournees-livrees`, { headers: this.getHeaders() });
  }

  receptionnerTournee(tourneeId: string, payload: { quantiteOlivesRecueKg: number; observations?: string }): Observable<ExtractionHuile> {
    return this.http.post<ExtractionHuile>(`${this.apiUrl}/tournees/${tourneeId}/reception`, payload, { headers: this.getHeaders() });
  }

  getExtractions(): Observable<ExtractionHuile[]> {
    return this.http.get<ExtractionHuile[]>(`${this.apiUrl}/extractions`, { headers: this.getHeaders() });
  }

  extraireHuile(extractionId: string, payload: { quantiteHuileExtraiteL: number; qualiteHuile: QualiteHuile; observations?: string }): Observable<ExtractionHuile> {
    return this.http.patch<ExtractionHuile>(`${this.apiUrl}/extractions/${extractionId}/extraire`, payload, { headers: this.getHeaders() });
  }

  validerExtraction(extractionId: string): Observable<ExtractionHuile> {
    return this.http.patch<ExtractionHuile>(`${this.apiUrl}/extractions/${extractionId}/valider`, {}, { headers: this.getHeaders() });
  }

  getCollectesHuile(): Observable<CollecteHuile[]> {
    return this.http.get<CollecteHuile[]>(`${this.apiUrl}/collectes-huile`, { headers: this.getHeaders() });
  }

  getProfile(): Observable<PressoirProfile> {
    return this.http.get<PressoirProfile>(`${this.apiUrl}/profile`, { headers: this.getHeaders() });
  }

  updateProfile(payload: any): Observable<PressoirProfile> {
    return this.http.patch<PressoirProfile>(`${this.apiUrl}/profile`, payload, { headers: this.getHeaders() });
  }
}
