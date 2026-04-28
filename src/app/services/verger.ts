import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VergerRequest, VergerResponse } from '../models/verger';
import { StatutVerger } from '../models/enums/statut-verger';

@Injectable({ providedIn: 'root' })
export class VergerService {
  private readonly API = 'http://localhost:8080/api/vergers';

  constructor(private http: HttpClient) {}

  // RESPONSABLE / ADMIN only
  creer(req: VergerRequest): Observable<VergerResponse> {
    return this.http.post<VergerResponse>(this.API, req);
  }
// Ajoute cette méthode dans la classe VergerService
getCollectesByVerger(vergerId: string): Observable<any[]> {
  return this.http.get<any[]>(`${this.API}/${vergerId}/collectes`);
}
  // All roles (agriculteur sees own check done in controller)
  getById(id: string): Observable<VergerResponse> {
    return this.http.get<VergerResponse>(`${this.API}/${id}`);
  }

  // RESPONSABLE / ADMIN only
  getAll(): Observable<VergerResponse[]> {
    return this.http.get<VergerResponse[]>(this.API);
  }

  // All roles
  getByAgriculteur(agriculteurId: string): Observable<VergerResponse[]> {
    return this.http.get<VergerResponse[]>(`${this.API}/agriculteur/${agriculteurId}`);
  }

  // RESPONSABLE / ADMIN only
  getByStatut(statut: StatutVerger): Observable<VergerResponse[]> {
    const params = new HttpParams().set('statut', statut);
    return this.http.get<VergerResponse[]>(`${this.API}/statut`, { params });
  }

  // RESPONSABLE / AGRICULTEUR (owner)
  mettreAJour(id: string, req: VergerRequest): Observable<VergerResponse> {
    return this.http.put<VergerResponse>(`${this.API}/${id}`, req);
  }

  // ADMIN only (can change responsableId/agriculteurId)
  mettreAJourAdmin(id: string, req: VergerRequest): Observable<VergerResponse> {
    return this.http.put<VergerResponse>(`${this.API}/${id}/admin`, req);
  }

  // RESPONSABLE / AGRICULTEUR (owner)
  changerStatut(id: string, statut: StatutVerger, reason: string): Observable<VergerResponse> {
    return this.http.patch<VergerResponse>(`${this.API}/${id}/statut`, { statut, reason });
  }

  clearStatutOverride(id: string): Observable<VergerResponse> {
    return this.http.patch<VergerResponse>(`${this.API}/${id}/statut`, { clearOverride: true });
  }

  // RESPONSABLE / ADMIN only
  desactiver(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}
