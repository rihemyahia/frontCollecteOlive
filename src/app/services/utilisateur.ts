// src/app/services/utilisateur.ts
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
  photoProfile?: string; // Base64 data URL: "data:image/jpeg;base64,..."

  // Pour travailleur
  cin?: string;
  specialites?: string[];
  dateEmbauche?: Date;
  salaire?: number;
  statutEmploye?: string;
  collectesAssignees?: any[];

  // Pour responsable
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

  // ========== CRUD UTILISATEURS ==========

  getAll(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.apiUrl}/admin/utilisateurs`, {
      headers: this.getHeaders()
    }).pipe(
      tap({
        next: (data) => console.log('Utilisateurs reçus:', data),
        error: (err) => console.error('Erreur:', err)
      })
    );
  }

  getById(id: string): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.apiUrl}/admin/utilisateurs/${id}`, {
      headers: this.getHeaders()
    });
  }

  creerUtilisateurParAdmin(utilisateur: Utilisateur): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/utilisateurs`, utilisateur, {
      headers: this.getHeaders()
    });
  }

  create(utilisateur: Utilisateur): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(`${this.apiUrl}/utilisateurs`, utilisateur, {
      headers: this.getHeaders()
    });
  }

  update(id: string, utilisateur: Partial<Utilisateur>): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(`${this.apiUrl}/admin/utilisateurs/${id}`, utilisateur, {
      headers: this.getHeaders()
    });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/utilisateurs/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ========== PHOTO DE PROFIL ==========

  /**
   * Update the logged-in user's own profile photo.
   * @param photoBase64 Full data URL: "data:image/jpeg;base64,..."
   */
  updateMyPhoto(photoBase64: string): Observable<any> {
    return this.http.put('http://localhost:8080/api/profile/photo',
      { photoProfile: photoBase64 },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Admin updates a specific user's photo.
   * @param id User ID
   * @param photoBase64 Full data URL: "data:image/jpeg;base64,..."
   */
  updateUserPhoto(id: string, photoBase64: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/utilisateurs/${id}/photo`,
      { photoProfile: photoBase64 },
      { headers: this.getHeaders() }
    );
  }

  // ========== COMPTE ==========

  desactiverCompte(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/desactiver-compte/${id}`, {}, {
      headers: this.getHeaders()
    });
  }

  changerMotDePasseAdmin(id: string, nouveauMotDePasse: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/changer-mot-de-passe/${id}`,
      { nouveauMotDePasse },
      { headers: this.getHeaders() }
    );
  }

  // ========== TRAVAILLEURS ==========

  getTravailleurs(): Observable<Utilisateur[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<Utilisateur[]>('http://localhost:8080/api/responsable/travailleurs', { headers }).pipe(
      tap({
        next: (data) => console.log('Travailleurs reçus:', data),
        error: (err) => console.error('Erreur chargement travailleurs:', err)
      })
    );
  }

  getTravailleursActifs(): Observable<Utilisateur[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<Utilisateur[]>('http://localhost:8080/api/responsable/travailleurs?actif=true', { headers });
  }

  getTravailleursBySpecialite(specialite: string): Observable<Utilisateur[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<Utilisateur[]>(
      `http://localhost:8080/api/responsable/travailleurs/specialite/${specialite}`, { headers }
    );
  }

  // ========== ACTIVATION ==========

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