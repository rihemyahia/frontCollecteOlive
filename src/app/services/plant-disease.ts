import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PlantDiseaseService {
  private modelReady = false;

  async chargerModele(): Promise<void> {
    if (this.modelReady) {
      return;
    }

    console.log('🌿 Chargement du modèle IA...');

    // Simulation du chargement (2 secondes)
    await this.delay(2000);

    this.modelReady = true;
    console.log('✅ Modèle chargé avec succès');
  }

  isModelReady(): boolean {
    return this.modelReady;
  }

  async detecterAnomalie(imageElement: HTMLImageElement): Promise<any> {
    // Attendre que le modèle soit chargé
    if (!this.modelReady) {
      await this.chargerModele();
    }

    console.log('🔬 Analyse de l\'image en cours...');

    // Simulation d'analyse (2 secondes)
    await this.delay(2000);

    // Retourner un résultat simulé
    return [
      { className: 'Rouille de l\'olivier', probability: 0.87 }
    ];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  analyserResultat(predictions: any[]): any {
    const meilleur = predictions[0];
    const confidence = Math.round(meilleur.probability * 100);

    return {
      label: '🍂 Rouille de l\'olivier',
      confidence: confidence,
      type: 'maladie',
      recommandation: '🍃 Traiter avec de la bouillie bordelaise. Éliminer les feuilles tombées.'
    };
  }
}
