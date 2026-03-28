// travailleur.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Travailleur {
  id?: string;
  nom: string;
  prenom?: string;
  telephone?: string;
  specialite?: string;
  statut: string;
  salaireJournalier?: number;
  typeTravailleur?: string;
  dateEmbauche?: Date;
  type?: string;
}

@Injectable({ providedIn: 'root' })
export class TravailleurService {
  private apiUrl = 'http://localhost:8080/api/employe/travailleurs';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Travailleur[]> {
    const timestamp = new Date().getTime();
    return this.http.get<Travailleur[]>(`${this.apiUrl}?_=${timestamp}`).pipe(
      tap({
        next: (data) => console.log('Réponse reçue:', data),
        error: (err) => console.error('Erreur HTTP:', err.status, err.error)
      })
    );
  }

  getById(id: string): Observable<Travailleur> {
    return this.http.get<Travailleur>(`${this.apiUrl}/${id}`);
  }

  create(travailleur: Travailleur): Observable<Travailleur> {
    const payload = {
      ...travailleur,
      type: 'TRAVAILLEUR',
      statut: travailleur.statut || 'DISPONIBLE'
    };
    return this.http.post<Travailleur>(this.apiUrl, payload);
  }

  update(id: string, travailleur: Travailleur): Observable<Travailleur> {
    return this.http.put<Travailleur>(`${this.apiUrl}/${id}`, travailleur);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getDisponibles(): Observable<Travailleur[]> {
    return this.http.get<Travailleur[]>(`${this.apiUrl}/disponibles`);
  }

  getBySpecialite(specialite: string): Observable<Travailleur[]> {
    return this.http.get<Travailleur[]>(`${this.apiUrl}/specialite/${specialite}`);
  }
}
