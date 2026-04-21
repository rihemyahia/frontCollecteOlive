// src/app/services/collecte.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Collecte {
  id: string;
  code: string;
  statut: 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE';
  vergerId: string;
  vergerNom?: string;
  annee: string;
  quantiteTotaleKg: number;
  nbreTournees: number;
  totalArbresRecoltes?: number;
  rendementMoyenParArbre?: number;
  efficaciteMoyenne?: number;
  dateDebutCampagne?: Date;
  dateCreation: Date;
  estCloturee?: boolean;
}

export interface TourneeCollecte {
  id: string;
  code: string;
  statut: string;
  dateDebut: Date;
  dateFin: Date;
  quantiteCollecteeKg: number;
  nbreArbre: number;
  distanceTotale: number;
  tempsTotal: number;
  efficacite: number;
}

export interface CollecteDetail {
  collecte: Collecte;
  tournees: TourneeCollecte[];
  verger?: {
    id: string;
    typeOlive: string;
    nbArbre: number;  // ← ADDED HERE (correct place)
    agriculteur?: {
      nom: string;
      prenom: string;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class CollecteService {
  private apiUrl = 'http://localhost:8080/api/collectes';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Collecte[]> {
    return this.http.get<Collecte[]>(this.apiUrl).pipe(
      map((collectes: any[]) => {
        return collectes.map(c => this.mapCollecte(c));
      })
    );
  }

  getById(id: string): Observable<CollecteDetail> {
    return this.http.get<any>(`${this.apiUrl}/${id}/details`).pipe(
      map((data) => {
        console.log('📦 API Response (details):', data);
        return {
          collecte: this.mapCollecte(data.collecte),
          tournees: data.tournees?.map((t: any) => this.mapTournee(t)) || [],
          verger: data.verger ? {
            ...data.verger,
            nbArbre: data.verger.nbArbre || 0  // Ensure nbArbre exists
          } : undefined
        };
      })
    );
  }

  getByVerger(vergerId: string): Observable<Collecte[]> {
    return this.http.get<Collecte[]>(`${this.apiUrl}/verger/${vergerId}`).pipe(
      map((collectes) => collectes.map(c => this.mapCollecte(c)))
    );
  }

  getByAnnee(annee: string): Observable<Collecte[]> {
    return this.http.get<Collecte[]>(`${this.apiUrl}/annee/${annee}`).pipe(
      map((collectes) => collectes.map(c => this.mapCollecte(c)))
    );
  }

  private mapCollecte(data: any): Collecte {
    return {
      id: data.id || data._id,
      code: data.code,
      statut: data.statut,
      vergerId: data.vergerId,
      vergerNom: data.vergerNom || data.vergerTypeOlive,
      annee: data.annee,
      quantiteTotaleKg: data.quantiteTotaleKg || data.quantiteTotale || 0,
      nbreTournees: data.nbreTournees || data.nbrTournees || 0,
      totalArbresRecoltes: data.totalArbresRecoltes || 0,
      rendementMoyenParArbre: data.rendementMoyenParArbre || 0,
      efficaciteMoyenne: data.efficaciteMoyenne || 0,
      dateDebutCampagne: data.dateDebutCampagne,
      dateCreation: data.dateCreation,
      estCloturee: data.estCloturee
    };
  }

  private mapTournee(data: any): TourneeCollecte {
    return {
      id: data.id || data._id,
      code: data.code,
      statut: data.statut,
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
      quantiteCollecteeKg: data.quantiteCollecteeKg || 0,
      nbreArbre: data.nbreArbre || 0,
      distanceTotale: data.distanceTotale || 0,
      tempsTotal: data.tempsTotal || 0,
      efficacite: data.efficacite || 0
    };
  }
}
