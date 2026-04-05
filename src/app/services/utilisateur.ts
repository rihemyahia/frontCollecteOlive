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
  motDePasse?: string;  // ← Ajoutez cette ligne (optionnel)

  // Pour agriculteur
  nomExploitation?: string;
  vergers?: any[];

  // Pour travailleur (EQUIPE_RECOLTE)
  cin?: string;
  specialites?: string[];
  dateEmbauche?: Date;
  salaire?: number;
  statutEmploye?: string;
  collectesAssignees?: any[];

  // Pour responsable
  fonction?: string;
  datePrisePoste?: Date;

  // Pour transporteur
  permis?: string;
  tarifKm?: number;
  anneesExperience?: number;
  disponibleTransport?: boolean;
  ressources?: any[];
  tourneesAssignees?: any[];
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

  getAll(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.apiUrl}/utilisateurs`, {
      headers: this.getHeaders()
    }).pipe(
      tap({
        next: (data) => console.log('Utilisateurs reçus:', data),
        error: (err) => console.error('Erreur:', err)
      })
    );
  }

  getById(id: string): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.apiUrl}/utilisateurs/${id}`, {
      headers: this.getHeaders()
    });
  }

// Dans utilisateur.service.ts
creerUtilisateurParAdmin(utilisateur: Utilisateur): Observable<any> {
  return this.http.post(`${this.apiUrl}/admin/utilisateurs`, utilisateur, {
    headers: this.getHeaders()
  });
}

// Si vous avez besoin de la méthode create pour d'autres usages
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

  getAgriculteursEnAttente(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.apiUrl}/admin/agriculteurs/en-attente`, {
      headers: this.getHeaders()
    });
  }

  getTravailleursEnAttente(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.apiUrl}/admin/travailleurs/en-attente`, {
      headers: this.getHeaders()
    });
  }

  getStatsAttente(): Observable<{ agriculteursEnAttente: number; travailleursEnAttente: number }> {
    return this.http.get<{ agriculteursEnAttente: number; travailleursEnAttente: number }>(
      `${this.apiUrl}/admin/stats/attente`,
      { headers: this.getHeaders() }
    );
  }

  activerAgriculteur(id: string, nouveauMotDePasse: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/activer-agriculteur/${id}`,
      { nouveauMotDePasse } as ActivationDTO,
      { headers: this.getHeaders() }
    );
  }

  activerTravailleur(id: string, nouveauMotDePasse: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/activer-travailleur/${id}`,
      { nouveauMotDePasse } as ActivationDTO,
      { headers: this.getHeaders() }
    );
  }
}
