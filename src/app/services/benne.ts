// src/app/services/benne.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Benne, BenneCreation } from '../models/benne';

@Injectable({
  providedIn: 'root'
})
export class BenneService {
  private apiUrl = 'http://localhost:8080/api/ressources/bennes';

  constructor(private http: HttpClient) { }

  getAll(): Observable<Benne[]> {
    console.log('📦 Chargement de toutes les bennes...');
    return this.http.get<Benne[]>(this.apiUrl).pipe(
      tap(data => console.log('✅ Bennes reçues:', data)),
      catchError(this.handleError)
    );
  }

  getById(id: string): Observable<Benne> {
    console.log(`📦 Chargement de la benne ${id}...`);
    return this.http.get<Benne>(`${this.apiUrl}/${id}`).pipe(
      tap(data => console.log('✅ Benne reçue:', data)),
      catchError(this.handleError)
    );
  }

  create(benne: BenneCreation): Observable<Benne> {
    console.log('📦 Création benne:', benne);
    const data = {
      nom: benne.nom,
      immatriculation: benne.immatriculation,
      capaciteKg: benne.capaciteKg,
      type: 'BENNE',
      statut: 'DISPONIBLE',
      quantiteChargeeActuelle: 0,
      tauxRemplissage: 0,
      estPleine: false
    };
    return this.http.post<Benne>(this.apiUrl, data).pipe(
      tap(response => console.log('✅ Benne créée:', response)),
      catchError(this.handleError)
    );
  }

  update(id: string, benne: Partial<Benne>): Observable<Benne> {
    console.log(`📦 Mise à jour benne ${id}:`, benne);
    return this.http.put<Benne>(`${this.apiUrl}/${id}`, benne).pipe(
      tap(response => console.log('✅ Benne mise à jour:', response)),
      catchError(this.handleError)
    );
  }

  delete(id: string): Observable<void> {
    console.log(`📦 Suppression benne ${id}`);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => console.log('✅ Benne supprimée')),
      catchError(this.handleError)
    );
  }

  chargerBenne(id: string, quantite: number): Observable<Benne> {
    return this.http.post<Benne>(`${this.apiUrl}/${id}/charger?quantite=${quantite}`, {}).pipe(
      catchError(this.handleError)
    );
  }

  viderBenne(id: string): Observable<Benne> {
    return this.http.post<Benne>(`${this.apiUrl}/${id}/vider`, {}).pipe(
      catchError(this.handleError)
    );
  }

  startMaintenance(id: string): Observable<Benne> {
    return this.http.post<Benne>(`${this.apiUrl}/${id}/maintenance`, {}).pipe(
      catchError(this.handleError)
    );
  }

  endMaintenance(id: string): Observable<Benne> {
    return this.http.post<Benne>(`${this.apiUrl}/${id}/maintenance/end`, {}).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ Erreur:', error);
    let errorMessage = 'Une erreur est survenue';
    if (error.error?.error) errorMessage = error.error.error;
    else if (error.status === 0) errorMessage = 'Impossible de se connecter au serveur';
    else errorMessage = `Erreur ${error.status}: ${error.message}`;
    return throwError(() => new Error(errorMessage));
  }
}