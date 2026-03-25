import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators'; // ← add

export interface Travailleur {
  id?: string;
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  email: string;
  specialite: string;
  statut: string;
  salaireJournalier: number;
}

@Injectable({ providedIn: 'root' })
export class TravailleurService {
  private apiUrl = 'http://localhost:8080/api/employe/travailleurs';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Travailleur[]> {
    const timestamp = new Date().getTime();
    console.log('🔵 SERVICE - getAll appelé, timestamp:', timestamp);
    return this.http.get<Travailleur[]>(`${this.apiUrl}?_=${timestamp}`).pipe(
      tap({
        next: (data) => console.log('✅ Réponse reçue:', data),       // ← confirm data shape
        error: (err) => console.error('❌ Erreur HTTP:', err.status, err.error)
      })
    );
  }

  getById(id: string): Observable<Travailleur> {
    return this.http.get<Travailleur>(`${this.apiUrl}/${id}`);
  }

  create(travailleur: Travailleur): Observable<Travailleur> {
    return this.http.post<Travailleur>(this.apiUrl, travailleur);
  }

  update(id: string, travailleur: Travailleur): Observable<Travailleur> {
    return this.http.put<Travailleur>(`${this.apiUrl}/${id}`, travailleur);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
