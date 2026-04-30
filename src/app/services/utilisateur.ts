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
  photoProfile?: string;

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

export interface PagedTourneesResponse {
  content: any[];
  totalPages?: number;
  totalElements?: number;
  currentPage?: number;
}

@Injectable({ providedIn: 'root' })
export class UtilisateurService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private transporteurApiUrl = 'http://localhost:8080/api/transporteur';
  private adminTransporteurApiUrl = 'http://localhost:8080/api/admin/transporteurs';

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
    console.log('Fetching user with ID:', id);
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
    console.log('Updating user with ID:', id);
    return this.http.put<Utilisateur>(`${this.apiUrl}/admin/utilisateurs/${id}`, utilisateur, {
      headers: this.getHeaders()
    });
  }

  // Admin: update responsable fields
  adminUpdateResponsable(id: string, body: Partial<Utilisateur>): Observable<Utilisateur> {
    return this.http.patch<Utilisateur>(`${this.apiUrl}/admin/responsables/${id}`, body, { headers: this.getHeaders() });
  }

  // Admin: update agriculteur fields
  adminUpdateAgriculteur(id: string, body: Partial<Utilisateur>): Observable<Utilisateur> {
    return this.http.patch<Utilisateur>(`${this.apiUrl}/admin/agriculteurs/${id}`, body, { headers: this.getHeaders() });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/utilisateurs/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ========== GESTION DES COMPTES ==========

  desactiverCompte(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/desactiver-compte/${id}`, {}, {
      headers: this.getHeaders()
    });
  }

  reactiverCompte(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/reactiver-compte/${id}`, {}, {
      headers: this.getHeaders()
    });
  }

  // ========== GESTION DU PROFIL ==========

  getProfil(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profil`, {
      headers: this.getHeaders()
    });
  }

  mettreAJourProfil(updates: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profil`, updates, {
      headers: this.getHeaders()
    });
  }

  changerMotDePasse(ancienMotDePasse: string, nouveauMotDePasse: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/changer-mot-de-passe`, {
      ancienMotDePasse,
      nouveauMotDePasse
    }, {
      headers: this.getHeaders()
    });
  }

  changerMotDePasseAdmin(id: string, nouveauMotDePasse: string): Observable<any> {
    console.log('Changing password for user ID:', id);
    return this.http.post(`${this.apiUrl}/admin/changer-mot-de-passe/${id}`,
      { nouveauMotDePasse },
      { headers: this.getHeaders() }
    );
  }

  // ========== PHOTO DE PROFIL ==========

  updateMyPhoto(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return this.http.put(
    'http://localhost:8080/api/profile/photo',
    formData,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }
  );
}

  updateUserPhoto(id: string, photoBase64: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/utilisateurs/${id}/photo`,
      { photoProfile: photoBase64 },
      { headers: this.getHeaders() }
    );
  }

  // ========== TRAVAILLEURS ==========
getTravailleursPourResponsable(): Observable<Utilisateur[]> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  return this.http.get<Utilisateur[]>('http://localhost:8080/api/responsable/travailleurs', { headers });
}
  getTravailleurs(): Observable<Utilisateur[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    const userStr = localStorage.getItem('currentUser');
    let userRole = '';
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        userRole = user.role?.toUpperCase() || '';
      } catch(e) {}
    }

    let url = '';
    if (userRole === 'ADMIN') {
      url = 'http://localhost:8080/api/auth/admin/utilisateurs';
    } else {
      url = 'http://localhost:8080/api/responsable/travailleurs';
    }

    console.log('📡 Appel API travailleurs avec URL:', url);
    return this.http.get<Utilisateur[]>(url, { headers }).pipe(
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

  // ========== UTILISATEURS EN ATTENTE ==========

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

  // ========== ACTIVATION ==========

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

  // ========== TRANSPORTEUR ==========

  getMesTourneesTransporteur(): Observable<any> {
    return this.http.get(`${this.transporteurApiUrl}/mes-tournees`, { headers: this.getHeaders() });
  }

  startLivraison(tourneeId: string): Observable<any> {
    return this.http.patch(
      `${this.transporteurApiUrl}/tournees/${tourneeId}/start-livraison`,
      {},
      { headers: this.getHeaders() }
    );
  }

  completeLivraison(tourneeId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    const token = localStorage.getItem('token');
    return this.http.patch(
      `${this.transporteurApiUrl}/tournees/${tourneeId}/complete-livraison`,
      formData,
      {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${token}`
        })
      }
    );
  }
  getTourneesAssignedToTransporteur(transporteurId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/transporteurs/${transporteurId}/tournees`, {
      headers: this.getHeaders()
    });
  }

  // ========== ADMIN: ASSIGN TOURNEES TO TRANSPORTEUR ==========

  getAvailableTourneesForTransporteurAdmin(): Observable<PagedTourneesResponse> {
    return this.http.get<PagedTourneesResponse>(
      `${this.adminTransporteurApiUrl}/tournees-disponibles`,
      { headers: this.getHeaders() }
    );
  }

  getAssignedTourneesForTransporteurAdmin(transporteurId: string): Observable<any> {
    return this.http.get(
      `${this.adminTransporteurApiUrl}/${transporteurId}/tournees`,
      { headers: this.getHeaders() }
    );
  }

  assignTourneesToTransporteurAdmin(transporteurId: string, tourneesIds: string[]): Observable<any> {
    return this.http.patch(
      `${this.adminTransporteurApiUrl}/${transporteurId}/tournees`,
      { tourneesIds },
      { headers: this.getHeaders() }
    );
  }
}
