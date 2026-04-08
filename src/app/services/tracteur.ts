// src/app/services/tracteur.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Tracteur, TracteurCreation } from '../models/tracteur';

@Injectable({
  providedIn: 'root'
})
export class TracteurService {
  private apiUrl = 'http://localhost:8080/api/ressources/tracteurs';

  constructor(private http: HttpClient) { }

  getAll(): Observable<Tracteur[]> {
    console.log('🚜 Chargement de tous les tracteurs...');
    return this.http.get<Tracteur[]>(this.apiUrl).pipe(
      tap(data => console.log('✅ Tracteurs reçus:', data)),
      catchError(this.handleError)
    );
  }

  getById(id: string): Observable<Tracteur> {
    console.log(`🚜 Chargement du tracteur ${id}...`);
    return this.http.get<Tracteur>(`${this.apiUrl}/${id}`).pipe(
      tap(data => console.log('✅ Tracteur reçu:', data)),
      catchError(this.handleError)
    );
  }

  create(tracteur: TracteurCreation): Observable<Tracteur> {
    console.log('🚜 Création tracteur:', tracteur);
    const data = {
      nom: tracteur.nom,
      immatriculation: tracteur.immatriculation,
      puissance: tracteur.puissance,
      carburant: tracteur.carburant,
      consommationHoraire: tracteur.consommationHoraire,
      aRemorque: tracteur.aRemorque,
      kilometrage: tracteur.kilometrage,
      type: 'TRACTEUR',
      statut: 'DISPONIBLE'
    };
    return this.http.post<Tracteur>(this.apiUrl, data).pipe(
      tap(response => console.log('✅ Tracteur créé:', response)),
      catchError(this.handleError)
    );
  }

  update(id: string, tracteur: Partial<Tracteur>): Observable<Tracteur> {
    console.log(`🚜 Mise à jour tracteur ${id}:`, tracteur);
    return this.http.put<Tracteur>(`${this.apiUrl}/${id}`, tracteur).pipe(
      tap(response => console.log('✅ Tracteur mis à jour:', response)),
      catchError(this.handleError)
    );
  }

  delete(id: string): Observable<void> {
    console.log(`🚜 Suppression tracteur ${id}`);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => console.log('✅ Tracteur supprimé')),
      catchError(this.handleError)
    );
  }

  updateKilometrage(id: string, kilometrage: number): Observable<Tracteur> {
    return this.http.put<Tracteur>(`${this.apiUrl}/${id}/update-mileage?mileage=${kilometrage}`, {}).pipe(
      catchError(this.handleError)
    );
  }

  startMaintenance(id: string): Observable<Tracteur> {
    return this.http.post<Tracteur>(`${this.apiUrl}/${id}/maintenance`, {}).pipe(
      catchError(this.handleError)
    );
  }

  endMaintenance(id: string): Observable<Tracteur> {
    return this.http.post<Tracteur>(`${this.apiUrl}/${id}/maintenance/end`, {}).pipe(
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