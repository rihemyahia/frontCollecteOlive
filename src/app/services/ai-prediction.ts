import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AIPredictionService {
  private readonly API = 'http://localhost:8080/api/ai';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Prédiction pour tous les vergers
  getToutesPredictions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/prediction/tous`, {
      headers: this.getHeaders()
    });
  }

  // Prédiction pour un verger spécifique
  getPredictionByVerger(vergerId: string): Observable<any> {
    return this.http.get<any>(`${this.API}/prediction/verger/${vergerId}`, {
      headers: this.getHeaders()
    });
  }
}
