export interface Tournee {
  id: string;
  code: string;
  statut: 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'EN_LIVRAISON' | 'LIVREE' | 'ANNULEE';
  vergerId: string;
  /** Responsable terrain du verger (assignation transporteur). */
  vergerResponsableId?: string;
  vergerTypeOlive?: string;
  vergerAgriculteurNom?: string;
  vergerSuperficie?: number;
  benneId: string;
  benneNom?: string;
  benneCapaciteKg?: number;
  tracteurId: string;
  tracteurNom?: string;
  tracteurImmatriculation?: string;
  travailleurIds: string[];
  travailleurNoms?: string[];
  nbreArbre: number;
  distanceTotale?: number;
  tempsTotal?: number;
  quantiteCollecteeKg?: number;
  collecteFinalisee: boolean;
  efficacite?: number;
  observations?: string;
  livraisonDestinationNom?: string;
  livraisonDestinationAdresse?: string;
  pressoirNom?: string;
  pressoirAdresse?: string;
  livraisonEstimeDebut?: Date | string;
  livraisonEstimeFin?: Date | string;
  livraisonNotes?: string;
  livraisonStartedAt?: Date | string;
  livraisonCompletedAt?: Date | string;
  livraisonEvidenceName?: string;
  livraisonEvidenceUrl?: string;
  dateDebut: Date;
  dateFin: Date;
  dateCreation: Date;
  totalCollecteVergerKg?: number;
  collecteId?: string;
  collecteCode?: string;
}

export interface TourneeRequest {
  vergerId: string;
  benneId: string;
  tracteurId: string;
  travailleurIds: string[];
  nbreArbre?: number;
  dateDebut: Date;
  dateFin: Date;
  distanceTotale?: number;
  observations?: string;
  livraisonDestinationNom?: string;
  livraisonDestinationAdresse?: string;
}

export interface TerminerTourneeRequest {
  quantiteCollecteeKg: number;
  distanceTotale?: number;
  observations?: string;
}

export type StatutTournee = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'EN_LIVRAISON' | 'LIVREE' | 'ANNULEE';
