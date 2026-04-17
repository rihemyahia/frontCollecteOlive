// services/collecte.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CollecteService {
  private apiUrl = 'http://localhost:8080/api/collectes';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

// services/collecte.service.ts
getAll(): Observable<any[]> {
  const url = this.apiUrl;
  console.log('Appel API vers:', url); // Debug
  return this.http.get<any[]>(url, { headers: this.getHeaders() });
}
  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  getActive(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/active`, { headers: this.getHeaders() });
  }

  getByVerger(vergerId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/verger/${vergerId}`, { headers: this.getHeaders() });
  }

  getByStatut(statut: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/statut?statut=${statut}`, { headers: this.getHeaders() });
  }

  creer(observations: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { observations }, { headers: this.getHeaders() });
  }

  demarrer(id: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/demarrer`, {}, { headers: this.getHeaders() });
  }

  terminer(id: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/terminer`, {}, { headers: this.getHeaders() });
  }

  annuler(id: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/annuler`, {}, { headers: this.getHeaders() });
  }

  mettreAJour(id: string, observations: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, { observations }, { headers: this.getHeaders() });
  }

  supprimer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  getQuantiteTotale(id: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/${id}/quantite-totale`, { headers: this.getHeaders() });
  }

  isComplete(id: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/${id}/complete`, { headers: this.getHeaders() });
  }
}
