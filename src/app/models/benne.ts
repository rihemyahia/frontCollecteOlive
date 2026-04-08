// src/app/models/benne.ts
export interface Benne {
  id?: string;
  nom: string;
  type: 'BENNE';
  statut: 'DISPONIBLE' | 'EN_USE' | 'MAINTENANCE' | 'HORS_SERVICE';
  immatriculation: string;
  capaciteKg: number;
  quantiteChargeeActuelle?: number;
  tauxRemplissage?: number;
  estPleine?: boolean;
  tracteurAttacheId?: string;
}

export interface BenneCreation {
  nom: string;
  immatriculation: string;
  capaciteKg: number;
}