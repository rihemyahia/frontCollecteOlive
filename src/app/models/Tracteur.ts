// src/app/models/tracteur.ts
export interface Tracteur {
  id?: string;
  nom: string;
  type: 'TRACTEUR';
  statut: 'DISPONIBLE' | 'EN_USE' | 'MAINTENANCE' | 'HORS_SERVICE';
  immatriculation: string;
  puissance: string;
  carburant: string;
  consommationHoraire: number;
  aRemorque: boolean;
  kilometrage: number;
  conducteurId?: string;
}

export interface TracteurCreation {
  nom: string;
  immatriculation: string;
  puissance: string;
  carburant: string;
  consommationHoraire: number;
  aRemorque: boolean;
  kilometrage: number;
}
