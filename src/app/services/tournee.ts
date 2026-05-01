// src/app/services/tournee.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaderResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Tournee {
  id: string;
  code: string;
  statut: 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'EN_LIVRAISON' | 'LIVREE' | 'ANNULEE';
  vergerId: string;
  vergerTypeOlive?: string;
  vergerAgriculteurNom?: string;
  vergerSuperficie?: number;
  benneId: string;
  benneNom?: string;
  benneCapaciteKg?: number;
  tracteurId: string;
  tracteurNom?: string;
  tracteurImmatriculation?: string;
  travailleurIds: string[];
  travailleurNoms?: string[];
  nbreArbre: number;
  distanceTotale?: number;
  tempsTotal?: number;
  quantiteCollecteeKg?: number;
  collecteFinalisee: boolean;
  efficacite?: number;
  observations?: string;
  livraisonDestinationNom?: string;
  livraisonDestinationAdresse?: string;
  livraisonStartedAt?: Date | string;
  livraisonCompletedAt?: Date | string;
  livraisonEvidenceName?: string;
  livraisonEvidenceUrl?: string;
  dateDebut: Date;
  dateFin: Date;
  dateCreation: Date;
  totalCollecteVergerKg?: number;
  collecteId?: string;
  collecteCode?: string;
}

export interface TourneeRequest {
  vergerId: string;
  benneId: string;
  tracteurId: string;
  travailleurIds: string[];
  nbreArbre?: number;
  dateDebut: Date;
  dateFin: Date;
  distanceTotale?: number;
  observations?: string;
  livraisonDestinationNom?: string;
  livraisonDestinationAdresse?: string;
}


export interface TerminerTourneeRequest {
  quantiteCollecteeKg: number;
  distanceTotale?: number | null;
  observations?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TourneeService {
  // Utiliser l'URL complète directement
  private apiUrl = 'http://localhost:8080/api/tournees';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Tournee[]> {
    return this.http.get<Tournee[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getActive(): Observable<Tournee[]> {
    return this.http.get<Tournee[]>(`${this.apiUrl}/active`, { headers: this.getHeaders() });
  }

  getById(id: string): Observable<Tournee> {
    return this.http.get<Tournee>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); // ou comment vous stockez le token
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

// Dans tournee.service.ts
getTravailleurs(): Observable<any[]> {  // ⚠️ Important: retourne Observable<any[]> pas Observable<Tournee>
  return this.http.get<any[]>(`${this.apiUrl}/travailleurs`, {
    headers: this.getHeaders()
  });
}

  getByVerger(vergerId: string): Observable<Tournee[]> {
    return this.http.get<Tournee[]>(`${this.apiUrl}/verger/${vergerId}`, { headers: this.getHeaders() });
  }

  getByStatut(statut: string): Observable<Tournee[]> {
    return this.http.get<Tournee[]>(`${this.apiUrl}/statut?statut=${statut}`, { headers: this.getHeaders() });
  }

  getTotalCollecteParVerger(vergerId: string): Observable<{ vergerId: string; totalCollecteKg: number; nbTourneesNecessaires: number }> {
    return this.http.get<{ vergerId: string; totalCollecteKg: number; nbTourneesNecessaires: number }>(
      `${this.apiUrl}/verger/${vergerId}/total-collecte`, { headers: this.getHeaders() }
    );
  }

  create(request: TourneeRequest): Observable<Tournee> {
    return this.http.post<Tournee>(this.apiUrl, request, { headers: this.getHeaders() });
  }

  update(id: string, request: TourneeRequest): Observable<Tournee> {
    return this.http.put<Tournee>(`${this.apiUrl}/${id}`, request, { headers: this.getHeaders() });
  }

  demarrer(id: string): Observable<Tournee> {
    return this.http.patch<Tournee>(`${this.apiUrl}/${id}/demarrer`, {}, { headers: this.getHeaders() });
  }

  terminer(id: string, request: TerminerTourneeRequest): Observable<Tournee> {
    return this.http.patch<Tournee>(`${this.apiUrl}/${id}/terminer`, request, { headers: this.getHeaders() });
  }

  annuler(id: string): Observable<Tournee> {
    return this.http.patch<Tournee>(`${this.apiUrl}/${id}/annuler`, {}, { headers: this.getHeaders() });
  }

  supprimer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
