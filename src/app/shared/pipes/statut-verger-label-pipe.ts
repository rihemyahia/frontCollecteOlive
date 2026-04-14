import { Pipe, PipeTransform } from '@angular/core';
import { StatutVerger } from '../../models/enums/statut-verger';

@Pipe({ name: 'statutVergerLabel', standalone: true })
export class StatutVergerLabelPipe implements PipeTransform {
  transform(value: StatutVerger): string {
    const map: Record<StatutVerger, string> = {
      [StatutVerger.NON_RECOLTE]: 'Non récolté',
      [StatutVerger.EN_COURS]:    'En cours',
      [StatutVerger.RECOLTE]:     'Récolté'
    };
    return map[value] ?? value;
  }
}