// src/app/services/calendrier.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// src/app/services/calendrier.service.ts
export interface EvenementCalendrier {
  id: string;
  titre: string;
  debut: Date;
  fin: Date;

  // Verger details
  vergerId?: string;
  vergerNom: string;
  vergerTypeOlive?: string;
  vergerSuperficie?: number;
  vergerNbArbre?: number;
  vergerStatut?: string;

  // Agriculteur details
  agriculteurId?: string;
  agriculteurNom?: string;
  agriculteurPrenom?: string;
  agriculteurEmail?: string;
  agriculteurTelephone?: string;

  // Tournée details
  travailleursNoms: string[];
  travailleurIds?: string[];
  statut: string;
  couleur: string;
  quantiteCollecteeKg?: number;
  nbreArbre?: number;
  distanceTotale?: number;
  collecteId?: string;
  collecteCode?: string;
  observations?: string;
  dateCreation?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CalendrierService {
  private apiUrl = 'http://localhost:8080/api/calendrier';

  constructor(private http: HttpClient) {}

  /**
   * Récupère les événements - Le backend filtre automatiquement selon le rôle
   */
  getEvenements(debut: Date, fin: Date): Observable<EvenementCalendrier[]> {
    const params = {
      debut: debut.toISOString(),
      fin: fin.toISOString()
    };
    return this.http.get<EvenementCalendrier[]>(this.apiUrl, { params });
  }

  /**
   * Récupère les événements par verger (pour Admin/Responsable uniquement)
   */
  getEvenementsByVerger(vergerId: string, debut: Date, fin: Date): Observable<EvenementCalendrier[]> {
    const params = {
      debut: debut.toISOString(),
      fin: fin.toISOString()
    };
    return this.http.get<EvenementCalendrier[]>(`${this.apiUrl}/verger/${vergerId}`, { params });
  }

  /**
   * Récupère les événements par travailleur (pour Admin/Responsable uniquement)
   */
  getEvenementsByTravailleur(travailleurId: string, debut: Date, fin: Date): Observable<EvenementCalendrier[]> {
    const params = {
      debut: debut.toISOString(),
      fin: fin.toISOString()
    };
    return this.http.get<EvenementCalendrier[]>(`${this.apiUrl}/travailleur/${travailleurId}`, { params });
  }

  /**
   * Récupère le planning personnel (pour Travailleur/Agriculteur)
   */
  getMonPlanning(debut: Date, fin: Date): Observable<EvenementCalendrier[]> {
    const params = {
      debut: debut.toISOString(),
      fin: fin.toISOString()
    };
    return this.http.get<EvenementCalendrier[]>(`${this.apiUrl}/mon-planning`, { params });
  }

  /**
   * Reprogramme une collecte
   */
  reprogrammer(tourneeId: string, nouvelleDate: Date, raison?: string): Observable<any> {
    const params: any = { nouvelleDate: nouvelleDate.toISOString() };
    if (raison) params.raison = raison;
    return this.http.put(`${this.apiUrl}/${tourneeId}/reprogrammer`, null, { params });
  }

  getCouleurParStatut(statut: string): string {
    switch (statut) {
      case 'PLANIFIEE': return '#3498db';
      case 'EN_COURS': return '#f39c12';
      case 'TERMINEE': return '#27ae60';
      case 'ANNULEE': return '#e74c3c';
      default: return '#95a5a6';
    }
  }
// Dans calendrier.service.ts
getEvenementsByVergerAndTravailleur(
  vergerId: string,
  travailleurId: string,
  debut: Date,
  fin: Date
): Observable<EvenementCalendrier[]> {
  const params = {
    debut: debut.toISOString(),
    fin: fin.toISOString()
  };
  return this.http.get<EvenementCalendrier[]>(
    `${this.apiUrl}/verger/${vergerId}/travailleur/${travailleurId}`,
    { params }
  );
}
  toFullCalendarEvent(event: EvenementCalendrier): any {
    return {
      id: event.id,
      title: `🫒 ${event.titre}`,
      start: event.debut,
      end: event.fin,
      backgroundColor: event.couleur,
      borderColor: event.couleur,
      extendedProps: {
        vergerNom: event.vergerNom,
        travailleurs: event.travailleursNoms,
        statut: event.statut,
        quantite: event.quantiteCollecteeKg,
        nbreArbre: event.nbreArbre
      }
    };
  }
}
