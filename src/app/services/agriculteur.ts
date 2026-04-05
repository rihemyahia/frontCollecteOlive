// src/app/services/agriculteur.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Agriculteur {
  id?: string;
  email: string;
  prenom: string;
  nom: string;
  telephone: string;
  adresse: string;
  role: string;
  nomExploitation: string;
  vergers?: any[];
  compteActif?: boolean;
  estActif?: boolean;
}

export interface InscriptionAgriculteurDTO {
  email: string;
  prenom: string;
  nom: string;
  telephone: string;
  adresse: string;
  nomExploitation: string;
  role: string
}

@Injectable({ providedIn: 'root' })
export class AgriculteurService {
  private apiUrl = 'http://localhost:8080/api/responsable/agriculteurs';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Créer un agriculteur (sans mot de passe, en attente activation)
  create(agriculteur: InscriptionAgriculteurDTO): Observable<any> {
    return this.http.post(this.apiUrl, agriculteur, {
      headers: this.getHeaders()
    }).pipe(
      tap({
        next: (res) => console.log('Agriculteur créé, en attente activation:', res),
        error: (err) => console.error('Erreur création agriculteur:', err)
      })
    );
  }

  // Lister tous les agriculteurs
  getAll(): Observable<Agriculteur[]> {
    return this.http.get<Agriculteur[]>(this.apiUrl, {
      headers: this.getHeaders()
    }).pipe(
      tap({
        next: (data) => console.log('Agriculteurs reçus:', data),
        error: (err) => console.error('Erreur récupération agriculteurs:', err)
      })
    );
  }

  // Récupérer un agriculteur par ID
  getById(id: string): Observable<Agriculteur> {
    return this.http.get<Agriculteur>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Mettre à jour un agriculteur
  update(id: string, agriculteur: Partial<Agriculteur>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, agriculteur, {
      headers: this.getHeaders()
    }).pipe(
      tap({
        next: (res) => console.log('Agriculteur mis à jour:', res),
        error: (err) => console.error('Erreur mise à jour:', err)
      })
    );
  }

  // Supprimer un agriculteur
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Rechercher par exploitation
  getByExploitation(nomExploitation: string): Observable<Agriculteur[]> {
    return this.http.get<Agriculteur[]>(`${this.apiUrl}/recherche?nom=${nomExploitation}`, {
      headers: this.getHeaders()
    });
  }
}
