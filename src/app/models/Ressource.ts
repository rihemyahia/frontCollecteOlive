// src/app/models/ressource.ts
export type RessourceType = 'BENNE' | 'TRACTEUR';
export type RessourceStatut = 'DISPONIBLE' | 'EN_USE' | 'MAINTENANCE' | 'HORS_SERVICE';

export interface Ressource {
  id?: string;
  nom: string;
  immatriculation: string;
  type: RessourceType;
  statut: RessourceStatut;
  dateCreation?: Date;
  dateDerniereMaintenance?: Date;
  tourneeId?: string;
}
