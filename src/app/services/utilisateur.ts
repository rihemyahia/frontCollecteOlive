// src/app/services/utilisateur.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Utilisateur {
  id?: string;
  email: string;
  prenom: string;
  nom: string;
  telephone: string;
  role: string;
  adresse: string;
  estActif: boolean;
  compteActif?: boolean;
  motDePasse?: string;
  // Pour agriculteur
  nomExploitation?: string;
  vergers?: any[];
  // Pour travailleur
  cin?: string;
  specialites?: string[];
  dateEmbauche?: Date;
  salaire?: number;
  statutEmploye?: string;
  // Pour transporteur
  permis?: string;
  tarifKm?: number;
  anneesExperience?: number;
}

export interface ActivationDTO {
  nouveauMotDePasse: string;
}

@Injectable({ providedIn: 'root' })
export class UtilisateurService {
  private apiUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // ========== MÉTHODES EXISTANTES ==========

  getAll(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.apiUrl}/utilisateurs`, {
      headers: this.getHeaders()
    }).pipe(
      tap({
        next: (data) => console.log('Utilisateurs reçus:', data),
        error: (err) => console.error('Erreur lors de la récupération des utilisateurs:', err)
      })
    );
  }

  getById(id: string): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.apiUrl}/utilisateurs/${id}`, {
      headers: this.getHeaders()
    });
  }

  create(utilisateur: Utilisateur): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(`${this.apiUrl}/utilisateurs`, utilisateur, {
      headers: this.getHeaders()
    });
  }

  update(id: string, utilisateur: Partial<Utilisateur>): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(`${this.apiUrl}/utilisateurs/${id}`, utilisateur, {
      headers: this.getHeaders()
    });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/utilisateurs/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ========== NOUVELLES MÉTHODES POUR L'ADMIN ==========

  // Récupérer les agriculteurs en attente
  getAgriculteursEnAttente(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.apiUrl}/admin/agriculteurs/en-attente`, {
      headers: this.getHeaders()
    }).pipe(
      tap({
        next: (data) => console.log('Agriculteurs en attente:', data),
        error: (err) => console.error('Erreur:', err)
      })
    );
  }

  // Récupérer les travailleurs en attente
  getTravailleursEnAttente(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.apiUrl}/admin/travailleurs/en-attente`, {
      headers: this.getHeaders()
    }).pipe(
      tap({
        next: (data) => console.log('Travailleurs en attente:', data),
        error: (err) => console.error('Erreur:', err)
      })
    );
  }

  // Récupérer tous les utilisateurs en attente
  getUtilisateursEnAttente(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.apiUrl}/admin/utilisateurs/en-attente`, {
      headers: this.getHeaders()
    });
  }

  // Récupérer les statistiques
  getStatsAttente(): Observable<{ agriculteursEnAttente: number; travailleursEnAttente: number }> {
    return this.http.get<{ agriculteursEnAttente: number; travailleursEnAttente: number }>(
      `${this.apiUrl}/admin/stats/attente`,
      { headers: this.getHeaders() }
    );
  }

  // Activer un agriculteur
  activerAgriculteur(id: string, nouveauMotDePasse: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/activer-agriculteur/${id}`,
      { nouveauMotDePasse } as ActivationDTO,
      { headers: this.getHeaders() }
    ).pipe(
      tap({
        next: (res) => console.log('Agriculteur activé:', res),
        error: (err) => console.error('Erreur activation:', err)
      })
    );
  }

  // Activer un travailleur
  activerTravailleur(id: string, nouveauMotDePasse: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/activer-travailleur/${id}`,
      { nouveauMotDePasse } as ActivationDTO,
      { headers: this.getHeaders() }
    ).pipe(
      tap({
        next: (res) => console.log('Travailleur activé:', res),
        error: (err) => console.error('Erreur activation:', err)
      })
    );
  }

  // Activer un compte générique
  activerCompte(id: string, nouveauMotDePasse: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/activer-compte/${id}`,
      { nouveauMotDePasse } as ActivationDTO,
      { headers: this.getHeaders() }
    );
  }
}
