// pipes/statut-collecte.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statutCollecte',
  standalone: true
})
export class StatutCollectePipe implements PipeTransform {

  transform(value: string): string {
    const statusMap: { [key: string]: string } = {
      'PLANIFIEE': '📋 Planifiée',
      'EN_COURS': '🔄 En cours',
      'TERMINEE': '✅ Terminée',
      'ANNULEE': '❌ Annulée'
    };
    return statusMap[value] || value;
  }
}
