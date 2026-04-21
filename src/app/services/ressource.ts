// src/app/services/ressource.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RessourceService {
  private apiUrl = 'http://localhost:8080/api/ressources';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
// ressource.service.ts
getBennes(): Observable<any[]> {
  // CORRIGE : utilise /bennes au lieu de ?type=BENNE
  return this.http.get<any[]>(`${this.apiUrl}/bennes`);
}

getTracteurs(): Observable<any[]> {
  // CORRIGE : utilise /tracteurs au lieu de ?type=TRACTEUR
  return this.http.get<any[]>(`${this.apiUrl}/tracteurs`);
}

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
}
