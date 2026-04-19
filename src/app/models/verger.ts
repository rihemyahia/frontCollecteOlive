import { StatutVerger } from './enums/statut-verger';

export interface VergerRequest {
  agriculteurId: string;
  superficie: number;
  typeOlive: string;
  nbArbre: number;
  rendementEstime: number;
  maturiteActuelle: number;
  statut?: StatutVerger;
  latitude?: number;
  longitude?: number;
  adresseIndicative?: string;
}

export interface VergerResponse {
  id: string;
  agriculteurId: string;
  agriculteurNom: string;
  agriculteurEmail: string;
  superficie: number;
  typeOlive: string;
  nbArbre: number;
  rendementEstime: number;
  maturiteActuelle: number;
  statut: StatutVerger;
  dateDerniereRecolte?: Date;
  estSupprimer: boolean;
  dateCreation: Date;

  // ← AJOUTÉ : Correspond à ce que renvoie ton backend
  geolocalisation?: {
    latitude: number;
    longitude: number;
    adresseIndicative?: string;
  };
}