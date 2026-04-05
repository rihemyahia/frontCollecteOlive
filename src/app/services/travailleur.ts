// src/app/services/travailleur.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface Travailleur {
  id?: string;
  email: string;
  prenom: string;
  nom: string;
  telephone: string;
  adresse: string;
  role: string;
  cin: string;
  specialites: string[];
  dateEmbauche: Date;
  salaire: number;
  statutEmploye: string;
  compteActif?: boolean;
  estActif?: boolean;
  collectesAssignees?: any[];
  disponible?: boolean;
  nombreCollectes?: number;
}

export interface InscriptionTravailleurDTO {
  email: string;
  prenom: string;
  nom: string;
  telephone: string;
  adresse: string;
  cin: string;
  specialites: string[];
  dateEmbauche: Date;
  salaire: number;
  statutEmploye: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class TravailleurService {
  private apiUrl = 'http://localhost:8080/api/responsable/travailleurs';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    console.log('🔐 Token récupéré:', token ? token.substring(0, 50) + '...' : 'AUCUN');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  create(travailleur: InscriptionTravailleurDTO): Observable<any> {
    console.log('📤 Envoi des données:', JSON.stringify(travailleur, null, 2));
    console.log('📤 URL:', this.apiUrl);

    return this.http.post(this.apiUrl, travailleur, {
      headers: this.getHeaders()
    }).pipe(
      tap({
        next: (res) => {
          console.log('✅ Réponse succès:', res);
        },
        error: (err) => {
          console.error('❌ Erreur complète:', err);
          console.error('❌ Statut:', err.status);
          console.error('❌ Message:', err.message);
          console.error('❌ Erreur body:', err.error);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ CatchError - Statut:', error.status);
        console.error('❌ CatchError - Message:', error.message);
        console.error('❌ CatchError - Error:', error.error);
        return throwError(() => error);
      })
    );
  }

  getAll(): Observable<Travailleur[]> {
    return this.http.get<Travailleur[]>(this.apiUrl, {
      headers: this.getHeaders()
    }).pipe(
      tap({
        next: (data) => console.log('✅ Travailleurs reçus:', data.length),
        error: (err) => console.error('❌ Erreur récupération:', err)
      })
    );
  }

  getDisponibles(): Observable<Travailleur[]> {
    return this.http.get<Travailleur[]>(`${this.apiUrl}/disponibles`, {
      headers: this.getHeaders()
    });
  }

  getBySpecialite(specialite: string): Observable<Travailleur[]> {
    return this.http.get<Travailleur[]>(`${this.apiUrl}/specialite/${specialite}`, {
      headers: this.getHeaders()
    });
  }

  getDisponiblesPourPeriode(dateDebut: Date, dateFin: Date): Observable<Travailleur[]> {
    return this.http.get<Travailleur[]>(`${this.apiUrl}/disponibles/periode`, {
      headers: this.getHeaders(),
      params: {
        dateDebut: dateDebut.toISOString(),
        dateFin: dateFin.toISOString()
      }
    });
  }

  getById(id: string): Observable<Travailleur> {
    return this.http.get<Travailleur>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  update(id: string, travailleur: Partial<Travailleur>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, travailleur, {
      headers: this.getHeaders()
    }).pipe(
      tap({
        next: (res) => console.log('✅ Travailleur mis à jour:', res),
        error: (err) => console.error('❌ Erreur mise à jour:', err)
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  checkDisponibilite(id: string): Observable<{ disponible: boolean; enCollecte: boolean }> {
    return this.http.get<{ disponible: boolean; enCollecte: boolean }>(
      `${this.apiUrl}/${id}/disponible`,
      { headers: this.getHeaders() }
    );
  }
}
