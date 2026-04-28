import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

@Injectable({ providedIn: 'root' })
export class PlantDiseaseService {
  private model: mobilenet.MobileNet | null = null;

  async chargerModele(): Promise<void> {
    if (!this.model) {
      console.log('🌿 Chargement du modèle IA...');
      this.model = await mobilenet.load();
      console.log('✅ Modèle chargé avec succès');
    }
  }

  async detecterAnomalie(imageElement: HTMLImageElement): Promise<any> {
    await this.chargerModele();

    if (!this.model) {
      throw new Error('Modèle non chargé');
    }

    // Classifier l'image
    const predictions = await this.model.classify(imageElement);

    return predictions;
  }

  // Version pour détection de maladies spécifiques à l'olivier
  analyserResultat(predictions: any[]): any {
    const maladiesOlivier = [
      { nom: 'Rouille de l\'olivier', motsCles: ['rust', 'fungus', 'brown'] },
      { nom: 'Œil de paon (Cycloconium)', motsCles: ['spot', 'leaf spot', 'cycloconium'] },
      { nom: 'Verticilliose', motsCles: ['wilt', 'verticillium', 'yellow'] },
      { nom: 'Fumagine', motsCles: ['sooty', 'mold', 'black'] },
      { nom: 'Plomb parasitaire', motsCles: ['lead', 'parasitic', 'silver'] }
    ];

    const meilleur = predictions[0];

    // Tenter de matcher avec les maladies de l'olivier
    for (const maladie of maladiesOlivier) {
      for (const motCle of maladie.motsCles) {
        if (meilleur.className.toLowerCase().includes(motCle)) {
          return {
            label: maladie.nom,
            confidence: meilleur.probability,
            type: 'maladie',
            recommandation: this.getRecommandation(maladie.nom)
          };
        }
      }
    }

    // Si pas de match, retourner la meilleure prédiction
    return {
      label: meilleur.className,
      confidence: meilleur.probability,
      type: 'information',
      recommandation: 'Consultez un expert pour confirmer le diagnostic'
    };
  }

  private getRecommandation(maladie: string): string {
    const recommandations: Record<string, string> = {
      'Rouille de l\'olivier': 'Traiter avec de la bouillie bordelaise. Éliminer les feuilles tombées.',
      'Œil de paon': 'Taille aérée. Traitement à la bouillie bordelaise en automne.',
      'Verticilliose': 'Arracher les arbres atteints. Rotation des cultures.',
      'Fumagine': 'Lutter contre la cochenille. Savon noir.',
      'Plomb parasitaire': 'Tailler les branches atteintes. Désinfecter les outils.'
    };
    return recommandations[maladie] || 'Consulter un technicien agricole';
  }
}
