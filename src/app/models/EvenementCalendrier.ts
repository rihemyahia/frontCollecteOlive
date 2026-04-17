// src/app/models/evenement-calendrier.ts

export class EvenementCalendrier {
  id: string = '';
  titre: string = '';
  debut: Date = new Date();
  fin: Date = new Date();
  vergerNom: string = '';
  travailleursNoms: string[] = [];
  statut: string = '';
  couleur: string = '';

  constructor(data?: Partial<EvenementCalendrier>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  get formattedDebut(): string {
    return this.debut ? new Date(this.debut).toLocaleString() : '';
  }

  get formattedFin(): string {
    return this.fin ? new Date(this.fin).toLocaleString() : '';
  }

  get titreComplet(): string {
    return `${this.titre} - ${this.vergerNom}`;
  }

  get travailleursTexte(): string {
    return this.travailleursNoms?.join(', ') || '';
  }
}
